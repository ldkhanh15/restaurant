"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Move, RotateCcw, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import { tableService } from "@/services/tableService"
import { CreateReservationDialog } from "./modalCreateReservation"
import cloneDeep from "lodash/cloneDeep";

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
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface RestaurantAreaAttributes {
  id: string
  name: string
  area_size: number
  shape_type: "square" | "rectangle" | "circle" | "polygon"
  status: "active" | "maintenance" | "clean"
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface TableMapManagementProps {
  tables: TableAttributes[]
  setTables: React.Dispatch<React.SetStateAction<any>>
  area: RestaurantAreaAttributes | null
}

export function TableMapManagement({ tables, setTables }: TableMapManagementProps) {
  const [draggedTable, setDraggedTable] = useState<TableAttributes | null>(null)
  const [isLayoutMode, setIsLayoutMode] = useState(false)
  const [tableStyles, setTableStyles] = useState<{
    [key: string]: { shape: "rectangle" | "circle" | "square"; rotation: number }
  }>({})
  const [selectedFloor, setSelectedFloor] = useState<string>("unassigned")
  const [cachedCoordinates, setCachedCoordinates] = useState<{
    [key: string]: { x: number; y: number }
  }>({})
  const [initialCoordinates, setInitialCoordinates] = useState<{
    [key: string]: { x: number; y: number }
  }>({})
  const [oldDataTable, setOldDataTable] = useState<TableAttributes[]>([])
  const [isCreateReservationOpen, setIsCreateReservationOpen] = useState(false)
  const [selectedTableForReservation, setSelectedTableForReservation] = useState<TableAttributes | null>(null)
  const floorPlanRef = useRef<HTMLDivElement>(null)
  const [hasInitOldData, setHasInitOldData] = useState(false)

  // Lấy danh sách tầng có trong dữ liệu
  const floors = Array.from(
    new Set(
      tables
        .filter((table) => !table.deleted_at)
        .map((table) => table.location?.floor)
        .filter((floor): floor is number => floor != null)
    )
  ).sort((a, b) => a - b)

  // Lọc bàn theo tầng đã chọn và loại bỏ bàn đã xóa
  const filteredTables = tables.filter((table) => {
    if (table.deleted_at) return false
    if (selectedFloor === "unassigned") return table.location?.floor == null
    return table.location?.floor === Number(selectedFloor)
  })


  useEffect(() => {
    if (!hasInitOldData && tables.length > 0) {
      const initialCoords: { [key: string]: { x: number; y: number } } = {}
      const oldTablesCopy = cloneDeep(tables)

      tables.forEach((table) => {
        if (!table.deleted_at) {
          initialCoords[table.id] = {
            x: table.location?.coordinates?.x ?? 0,
            y: table.location?.coordinates?.y ?? 0,
          }
        }
      })

      setInitialCoordinates(initialCoords)
      setOldDataTable(oldTablesCopy)
      setHasInitOldData(true)
    }
  }, [tables, hasInitOldData])


  // Kiểm tra xem tọa độ có bị trùng không
  const isOverlapping = (tableId: string, newX: number, newY: number) => {
    return filteredTables.some((table) => {
      if (table.id === tableId) return false
      const tableX = table.location?.coordinates?.x ?? 0
      const tableY = table.location?.coordinates?.y ?? 0
      return Math.abs(tableX - newX) < 80 && Math.abs(tableY - newY) < 80
    })
  }

  const handleTableLayoutDragStart = (e: React.DragEvent, table: TableAttributes) => {
    if (!isLayoutMode) return
    setDraggedTable(table)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleTableLayoutDragEnd = () => {
    setDraggedTable(null)
  }

  const handleFloorPlanDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedTable && floorPlanRef.current) {
      const rect = floorPlanRef.current.getBoundingClientRect()
      let x = e.clientX - rect.left - 40
      let y = e.clientY - rect.top - 40

      // Đảm bảo tọa độ không âm
      x = Math.max(0, x)
      y = Math.max(0, y)

      // Kiểm tra trùng lặp tọa độ
      if (isOverlapping(draggedTable.id, x, y)) {
        toast.error("Vị trí này đã có bàn khác, vui lòng chọn vị trí khác")
        return
      }

      // Cập nhật cache tọa độ
      setCachedCoordinates((prev) => ({
        ...prev,
        [draggedTable.id]: { x, y },
      }))

      // Cập nhật tọa độ tạm thời
      setTables((prevTables:any) =>
        prevTables.map((t:any) =>
          t.id === draggedTable.id
            ? {
                ...t,
                location: {
                  ...t.location,
                  coordinates: { x: x === 0 || y === 0 ? 0 : x, y: x === 0 || y === 0 ? 0 : y },
                },
              }
            : t
        )
      )
    }
  }

  const handleFloorPlanDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const rotateTable = (tableId: string) => {
    setTableStyles((prev) => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        rotation: ((prev[tableId]?.rotation || 0) + 45) % 360,
        shape: prev[tableId]?.shape || "rectangle",
      },
    }))
  }

  const handleUpdateTable = async (id: string, data: Partial<TableAttributes>) => {
    try {
      const response = await tableService.update(id, data)
      if (response && response.status === 200) {
        setTables((prev:any) =>
          prev.map((table:any) =>
            table.id === id ? { ...table, ...data, updated_at: new Date() } : table
          )
        )
      } else {
        throw new Error("Cập nhật bàn thất bại")
      }
    } catch (err) {
      throw new Error("Lỗi khi cập nhật bàn")
    }
  }

  const saveLayout = async () => {
    try {
      for (const table of filteredTables) {
        if (cachedCoordinates[table.id]) {
          await handleUpdateTable(table.id, {
            location: {
              ...table.location,
              coordinates: {
                x: cachedCoordinates[table.id].x === 0 || cachedCoordinates[table.id].y === 0 ? 0 : cachedCoordinates[table.id].x,
                y: cachedCoordinates[table.id].x === 0 || cachedCoordinates[table.id].y === 0 ? 0 : cachedCoordinates[table.id].y,
              },
            },
          })
        }
      }
      // Cập nhật initialCoordinates và oldDataTable sau khi lưu thành công
      setInitialCoordinates((prev) => ({
        ...prev,
        ...cachedCoordinates,
      }))
      setOldDataTable(tables) // Cập nhật oldDataTable với dữ liệu mới
      toast.success("Đã lưu bố trí bàn thành công")
      setIsLayoutMode(false) // Thoát chế độ sắp xếp sau khi lưu
    } catch (error) {
      toast.error("Lỗi khi lưu bố trí bàn")
    }
  }

  const resetLayout = () => {
    setTableStyles((prev) => {
      const newStyles = { ...prev }
      filteredTables.forEach((table) => {
        delete newStyles[table.id]
      })
      return newStyles
    })

    setCachedCoordinates((prev) => {
      const newCache = { ...prev }
      filteredTables.forEach((table) => {
        delete newCache[table.id]
      })
      return newCache
    })

    // Khôi phục vị trí bàn từ oldDataTable theo tầng đã chọn
    setTables((prevTables:any) =>
      prevTables.map((t:any) => {
        if (filteredTables.some((ft) => ft.id === t.id)) {
          console.log(oldDataTable)
          const oldTable = oldDataTable.find((ot) => ot.id === t.id)
          if (oldTable) {
            return {
              ...t,
              location: {
                ...t.location,
                coordinates: {
                  x: oldTable.location?.coordinates?.x ?? 0,
                  y: oldTable.location?.coordinates?.y ?? 0,
                },
              },
            }
          }
        }
        return t
      })
    )
    setIsLayoutMode(false) // Thoát chế độ sắp xếp sau khi đặt lại
    toast.success("Đã đặt lại bố trí bàn")
  }

  const handleCreateReservation = (data: any) => {
    console.log("Tạo đặt chỗ mới:", data)
    setIsCreateReservationOpen(false)
    setSelectedTableForReservation(null)
    toast.success("Đã gửi thông tin đặt bàn!")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Bố trí sàn nhà hàng</h3>
          <p className="text-sm text-muted-foreground">
            {selectedFloor === "unassigned"
              ? "Bàn chưa gán tầng"
              : `Tầng ${selectedFloor}`}{" "}
            - Kéo thả để sắp xếp lại vị trí bàn. Nhấp để xoay bàn. <br/> <strong>Có thể đặt bàn với những bàn có trạng thái "Còn trống".</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn tầng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Chưa gán tầng</SelectItem>
              {floors.map((floor) => (
                <SelectItem key={floor} value={String(floor)}>
                  Tầng {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={isLayoutMode ? "default" : "outline"}
            onClick={() => setIsLayoutMode(!isLayoutMode)}
          >
            <Move className="h-4 w-4 mr-2" />
            {isLayoutMode ? "Thoát chế độ sắp xếp" : "Chế độ sắp xếp"}
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

      <Card>
        <CardContent className="p-6">
          <div
            ref={floorPlanRef}
            className="relative bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg"
            style={{ height: "600px", width: "100%" }}
            onDrop={handleFloorPlanDrop}
            onDragOver={handleFloorPlanDragOver}
          >
            {/* Lưới nền */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ccc" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Render bàn */}
            {filteredTables.map((table) => {
              const x = table.location?.coordinates?.x ?? 0
              const y = table.location?.coordinates?.y ?? 0
              const rotation = tableStyles[table.id]?.rotation ?? 0
              const shape = tableStyles[table.id]?.shape ?? "rectangle"

              const tableStyle = {
                position: "absolute" as const,
                left: `${x}px`,
                top: `${y}px`,
                transform: `rotate(${rotation}deg)`,
                cursor: isLayoutMode ? "move" : table.status === "available" ? "pointer" : "default",
                zIndex: draggedTable?.id === table.id ? 1000 : 1,
              }

              return (
                <div
                  key={table.id}
                  style={tableStyle}
                  draggable={isLayoutMode}
                  onDragStart={(e) => handleTableLayoutDragStart(e, table)}
                  onDragEnd={handleTableLayoutDragEnd}
                  onClick={() => {
                    if (isLayoutMode) {
                      rotateTable(table.id)
                    } else if (table.status === "available") {
                      setSelectedTableForReservation(table)
                      setIsCreateReservationOpen(true)
                    }
                  }}
                  className={`
                    w-20 h-20 border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all
                    ${
                      table.status === "available"
                        ? "bg-green-100 border-green-500 text-green-800"
                        : table.status === "occupied"
                        ? "bg-red-100 border-red-500 text-red-800"
                        : table.status === "reserved"
                        ? "bg-blue-100 border-blue-500 text-blue-800"
                        : "bg-gray-100 border-gray-500 text-gray-800"
                    }
                    ${shape === "circle" ? "rounded-full" : shape === "square" ? "rounded-lg" : "rounded-md"}
                    ${isLayoutMode ? "hover:shadow-lg hover:scale-105" : table.status === "available" ? "hover:bg-green-200 cursor-pointer" : ""}
                    ${draggedTable?.id === table.id ? "opacity-50" : ""}
                  `}
                >
                  <div className="text-center">
                    <div className="font-bold">{table.table_number}</div>
                    <div className="text-xs">{table.capacity}p</div>
                  </div>
                </div>
              )
            })}

            {/* Chú thích trạng thái bàn */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-sm border">
              <h4 className="font-medium text-sm mb-2">Chú thích</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
                  <span>Trống</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
                  <span>Đã đặt</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
                  <span>Có khách</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-500 rounded"></div>
                  <span>Đang dọn dẹp</span>
                </div>
              </div>
            </div>

            {/* Hướng dẫn thao tác */}
            {isLayoutMode && (
              <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Hướng dẫn:</p>
                  <p>• Kéo bàn để di chuyển</p>
                  <p>• Nhấp để xoay bàn</p>
                  <p>• Nhấn Lưu để xác nhận vị trí</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Reservation Dialog */}
      <CreateReservationDialog
        isOpen={isCreateReservationOpen}
        onOpenChange={(open) => {
          setIsCreateReservationOpen(open)
          if (!open) setSelectedTableForReservation(null)
        }}
        onCreateReservation={(data) => handleCreateReservation({ ...data, table_id: selectedTableForReservation?.id })}
      />
    </div>
  )
}  
