"use client"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Move, RotateCcw, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import { tableService } from "@/services/tableService"
import { CreateReservationDialog } from "./modalCreateReservation"
import cloneDeep from "lodash/cloneDeep"

type AreaShape = "circle" | "square" | "rhombus" | "parallelogram" | "rectangle" | "polygon"

interface TableAttributes {
  id: string
  table_number: string
  capacity: number
  deposit: number
  cancel_minutes: number
  location?: {
    area?: string
    floor?: number
    coordinates?: { x?: number; y?: number }
  } | null
  status: "available" | "occupied" | "cleaning" | "reserved"
  panorama_urls?: any
  amenities?: any
  description?: string
  created_at?: Date | string
  updated_at?: Date | string
  deleted_at?: Date | null
}

interface TableMapManagementProps {
  tables: TableAttributes[]
  setTables: React.Dispatch<React.SetStateAction<TableAttributes[]>>
  areaShape?: AreaShape | null
}

export function TableMapManagement({ tables, setTables, areaShape }: TableMapManagementProps) {
  const [draggedTable, setDraggedTable] = useState<TableAttributes | null>(null)
  const [isLayoutMode, setIsLayoutMode] = useState(false)
  const [tableStyles, setTableStyles] = useState<{ [key: string]: { rotation: number } }>({})
  const [selectedFloor, setSelectedFloor] = useState<string>("unassigned")
  const [cachedCoordinates, setCachedCoordinates] = useState<{ [key: string]: { x: number; y: number } }>({})
  const [oldDataTable, setOldDataTable] = useState<TableAttributes[]>([])
  const [isCreateReservationOpen, setIsCreateReservationOpen] = useState(false)
  const [selectedTableForReservation, setSelectedTableForReservation] = useState<TableAttributes | null>(null)
  const floorPlanRef = useRef<HTMLDivElement>(null)
  const [hasInitOldData, setHasInitOldData] = useState(false)
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)

  // === Cập nhật rect khi resize, floor hoặc shape thay đổi ===
  useEffect(() => {
    const updateRect = () => {
      if (floorPlanRef.current) {
        setContainerRect(floorPlanRef.current.getBoundingClientRect())
      }
    }
    updateRect()
    window.addEventListener("resize", updateRect)
    return () => window.removeEventListener("resize", updateRect)
  }, [selectedFloor, areaShape])

  // === Lọc tầng & bàn ===
  const floors = Array.from(
    new Set(
      tables
        .filter(t => !t.deleted_at)
        .map(t => t.location?.floor)
        .filter((f): f is number => f != null)
    )
  ).sort((a, b) => a - b)

  const filteredTables = tables.filter(table => {
    if (table.deleted_at) return false
    if (selectedFloor === "unassigned") return table.location?.floor == null
    return table.location?.floor === Number(selectedFloor)
  })

  // === Khởi tạo dữ liệu cũ ===
  useEffect(() => {
    if (!hasInitOldData && tables.length > 0) {
      setOldDataTable(cloneDeep(tables))
      setHasInitOldData(true)
    }
  }, [tables, hasInitOldData])

  // === Kiểm tra chồng lấn (dùng tọa độ thực, không display) ===
  const isOverlapping = (tableId: string, newX: number, newY: number) => {
    return filteredTables.some(t => {
      if (t.id === tableId) return false
      const tx = t.location?.coordinates?.x ?? 0
      const ty = t.location?.coordinates?.y ?? 0
      return Math.abs(tx - newX) < 80 && Math.abs(ty - newY) < 80
    })
  }

  // === Tính vị trí hiển thị ===
  const getDisplayPosition = (table: TableAttributes) => {
    const rawX = table.location?.coordinates?.x ?? 0
    const rawY = table.location?.coordinates?.y ?? 0
    const x = cachedCoordinates[table.id]?.x ?? rawX
    const y = cachedCoordinates[table.id]?.y ?? rawY

    if (!containerRect || !floorPlanRef.current) {
      return { x, y, isOutOfBounds: false }
    }

    const rect = floorPlanRef.current.getBoundingClientRect()
    const padding = 60
    const tableSize = 80
    const minX = padding
    const maxX = rect.width - padding - tableSize
    const minY = padding
    const maxY = rect.height - padding - tableSize

    const isOut = x < minX || x > maxX || y < minY || y > maxY

    if (isOut) {
      const centerX = (rect.width - tableSize) / 2
      const centerY = (rect.height - tableSize) / 2
      return { x: centerX, y: centerY, isOutOfBounds: true }
    }

    return { x, y, isOutOfBounds: false }
  }

  // === Drag & Drop ===
  const handleTableLayoutDragStart = (e: React.DragEvent, table: TableAttributes) => {
    if (!isLayoutMode) return
    setDraggedTable(table)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleTableLayoutDragEnd = () => setDraggedTable(null)

  const handleFloorPlanDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedTable || !floorPlanRef.current) return

    const rect = floorPlanRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left - 40
    let y = e.clientY - rect.top - 40

    x = Math.max(30, Math.min(x, rect.width - 110))
    y = Math.max(30, Math.min(y, rect.height - 110))

    if (isOverlapping(draggedTable.id, x, y)) {
      toast.error("Vị trí đã có bàn!")
      return
    }

    setCachedCoordinates(prev => ({ ...prev, [draggedTable.id]: { x, y } }))
    setTables(prev =>
      prev.map(t =>
        t.id === draggedTable.id
          ? { ...t, location: { ...t.location, coordinates: { x, y } } }
          : t
      )
    )
  }

  const handleFloorPlanDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  // === Xoay bàn ===
  const rotateTable = (tableId: string) => {
    setTableStyles(prev => ({
      ...prev,
      [tableId]: {
        rotation: ((prev[tableId]?.rotation || 0) + 45) % 360,
      },
    }))
  }

  // === Cập nhật API ===
  const handleUpdateTable = async (id: string, data: Partial<TableAttributes>) => {
    try {
      const res = await tableService.update(id, data)
      if (res) {
        setTables(prev =>
          prev.map(t => (t.id === id ? { ...t, ...data, updated_at: new Date() } : t))
        )
      }
    } catch {
      throw new Error("Cập nhật thất bại")
    }
  }

  // === Lưu layout ===
  const saveLayout = async () => {
    try {
      for (const table of filteredTables) {
        if (cachedCoordinates[table.id]) {
          await handleUpdateTable(table.id, {
            location: {
              ...table.location,
              coordinates: cachedCoordinates[table.id],
            },
          })
        }
      }
      setOldDataTable(cloneDeep(tables))
      toast.success("Lưu thành công!")
      setIsLayoutMode(false)
      setCachedCoordinates({})
    } catch {
      toast.error("Lỗi lưu!")
    }
  }

  // === Reset layout ===
  const resetLayout = () => {
    setTableStyles({})
    setCachedCoordinates({})
    setTables(prev =>
      prev.map(t => {
        const old = oldDataTable.find(ot => ot.id === t.id)
        if (old && filteredTables.some(ft => ft.id === t.id)) {
          return {
            ...t,
            location: {
              ...t.location,
              coordinates: {
                x: old.location?.coordinates?.x ?? 0,
                y: old.location?.coordinates?.y ?? 0,
              },
            },
          }
        }
        return t
      })
    )
    setIsLayoutMode(false)
    toast.success("Đã đặt lại!")
  }

  // === Đặt bàn ===
  const handleCreateReservation = (data: any) => {
    console.log("Đặt bàn:", data)
    setIsCreateReservationOpen(false)
    setSelectedTableForReservation(null)
    toast.success("Đã gửi đặt bàn!")
  }

  // === Shape styles (RHOMBUS ĐÃ FIX) ===
  const shapeStyles: Record<AreaShape, { container: string; inner: string; clip?: string }> = {
    circle: { container: "rounded-full", inner: "", clip: undefined },
    square: { container: "aspect-square", inner: "", clip: undefined },
    rhombus: {
      container: "aspect-square rotate-[-30deg] skew-x-[25deg] overflow-hidden",
      inner: "rotate-[15deg] skew-x-[-15deg] scale-100",
      clip: undefined,
    },
    parallelogram: { container: "skew-x-20", inner: "skew-x-[-20deg]", clip: undefined },
    rectangle: { container: "", inner: "", clip: undefined },
    polygon: {
      container: "",
      inner: "",
      clip: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
    },
  }

  const shapeKey = (areaShape || "rectangle") as AreaShape
  const { container, inner, clip } = shapeStyles[shapeKey]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Bố trí sàn nhà hàng</h3>
          <p className="text-sm text-muted-foreground">
            {selectedFloor === "unassigned" ? "Bàn chưa gán tầng" : `Tầng ${selectedFloor}`} - Kéo để di chuyển, nhấp để xoay
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Chọn tầng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Chưa gán tầng</SelectItem>
              {floors.map(f => (
                <SelectItem key={f} value={String(f)}>Tầng {f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={isLayoutMode ? "default" : "outline"} onClick={() => setIsLayoutMode(!isLayoutMode)}>
            <Move className="h-4 w-4 mr-2" />
            {isLayoutMode ? "Thoát" : "Sắp xếp"}
          </Button>
          <Button variant="outline" onClick={resetLayout}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Đặt lại
          </Button>
          <Button variant="outline" onClick={saveLayout}>
            <Save className="h-4 w-4 mr-2" />
            Lưu
          </Button>
        </div>
      </div>

      {/* MAP CARD */}
      <Card className="overflow-hidden relative">
        <CardContent className="p-4 sm:p-8">
          <div className="flex justify-center">
            <div
              key={areaShape}
              ref={floorPlanRef}
              className={`
                relative bg-gray-50 border-2 border-dashed border-gray-300
                shadow-xl overflow-hidden
                ${container}
                transition-all duration-500
              `}
              style={{
                ...(areaShape !== "rhombus" && { width: "100%" }),
                maxWidth: areaShape === "parallelogram" ? "1200px" : "1400px",
                minHeight: "800px",
                clipPath: clip,
              }}
              onDrop={handleFloorPlanDrop}
              onDragOver={handleFloorPlanDragOver}
            >
              {/* GRID - KHỚP 100% VỚI BẢN ĐỒ */}
              <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
                <svg width="100%" height="100%" className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#999" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* NỘI DUNG BÀN - CÓ PADDING */}
              <div className={`absolute inset-6 ${inner} z-10`}>
                {/* Tables */}
                {filteredTables.map(table => {
                  const { x, y, isOutOfBounds } = getDisplayPosition(table)
                  const rotation = tableStyles[table.id]?.rotation ?? 0

                  return (
                    <div
                      key={table.id}
                      style={{
                        position: "absolute",
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: "center",
                        cursor: isLayoutMode ? "move" : table.status === "available" ? "pointer" : "default",
                        zIndex: draggedTable?.id === table.id ? 1000 : 10,
                        opacity: isOutOfBounds ? 0.7 : 1,
                        outline: isOutOfBounds ? "2px dashed #f59e0b" : "none",
                      }}
                      draggable={isLayoutMode}
                      onDragStart={e => handleTableLayoutDragStart(e, table)}
                      onDragEnd={handleTableLayoutDragEnd}
                      onClick={() => {
                        if (isLayoutMode) rotateTable(table.id)
                        else if (table.status === "available") {
                          setSelectedTableForReservation(table)
                          setIsCreateReservationOpen(true)
                        }
                      }}
                      className={`
                        w-20 h-20 bg-white border-2 rounded-lg shadow-md
                        flex items-center justify-center text-xs font-semibold
                        transition-all select-none
                        ${table.status === "available" ? "border-green-500 bg-green-50 text-green-800" :
                          table.status === "occupied" ? "border-red-500 bg-red-50 text-red-800" :
                          table.status === "reserved" ? "border-blue-500 bg-blue-50 text-blue-800" :
                          "border-gray-400 bg-gray-50 text-gray-700"}
                        ${isLayoutMode ? "hover:shadow-xl hover:scale-110" : ""}
                        ${draggedTable?.id === table.id ? "opacity-40 scale-90" : ""}
                      `}
                    >
                      <div className={`text-center ${inner}`}>
                        <div className="font-bold">{table.table_number}</div>
                        <div>{table.capacity}p</div>
                        {isOutOfBounds && <div className="text-[10px] text-orange-600">Ngoài vùng</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
            <div className="bg-white/95 backdrop-blur p-4 rounded-xl shadow-xl border pointer-events-auto">
              <h4 className="font-bold text-sm mb-2">Chú thích</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-50 border border-green-500 rounded"></div>
                  <span>Trống</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-50 border border-blue-500 rounded"></div>
                  <span>Đã đặt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-50 border border-red-500 rounded"></div>
                  <span>Có khách</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-50 border border-gray-400 rounded"></div>
                  <span>Đang dọn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guide */}
          {isLayoutMode && (
            <div className="absolute top-6 right-6 z-30 pointer-events-none">
              <div className="bg-blue-100/95 backdrop-blur text-blue-900 p-4 rounded-xl shadow-xl border pointer-events-auto">
                <p className="font-bold text-sm mb-1">Hướng dẫn</p>
                <p className="text-xs">• Kéo để di chuyển</p>
                <p className="text-xs">• Nhấp để xoay</p>
                <p className="text-xs">• Lưu để xác nhận</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateReservationDialog
        isOpen={isCreateReservationOpen}
        onOpenChange={open => {
          setIsCreateReservationOpen(open)
          if (!open) setSelectedTableForReservation(null)
        }}
        onCreateReservation={data =>
          handleCreateReservation({ ...data, table_id: selectedTableForReservation?.id })
        }
      />
    </div>
  )
}