"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Move, RotateCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface TableMapManagementProps {
  tables: TableAttributes[]
  setTables: React.Dispatch<React.SetStateAction<any>>
}

export function TableMapManagement({ tables, setTables }: TableMapManagementProps) {
  const [draggedTable, setDraggedTable] = useState<TableAttributes | null>(null)
  const [isLayoutMode, setIsLayoutMode] = useState(false)
  const [tableStyles, setTableStyles] = useState<{
    [key: string]: { shape: "rectangle" | "circle" | "square"; rotation: number }
  }>({})
  const [selectedFloor, setSelectedFloor] = useState<string>("unassigned")
  const floorPlanRef = useRef<HTMLDivElement>(null)

  // Lấy danh sách tầng có trong dữ liệu (loại bỏ undefined, null)
  const floors = Array.from(
    new Set(
      tables
        .map((table) => table.location?.floor)
        .filter((floor): floor is number => floor != null)
    )
  ).sort((a, b) => a - b)

  // Lọc bàn theo tầng đã chọn
  const filteredTables = tables.filter((table) => {
    if (selectedFloor === "unassigned") return table.location?.floor == null
    return table.location?.floor === Number(selectedFloor)
  })

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
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setTables(
        tables.map((t) =>
          t.id === draggedTable.id
            ? {
                ...t,
                location: {
                  ...t.location,
                  coordinates: { x: Math.max(0, x - 40), y: Math.max(0, y - 40) },
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

  const resetLayout = () => {
    setTableStyles((prev) => {
      const newStyles = { ...prev }
      filteredTables.forEach((table) => {
        delete newStyles[table.id]
      })
      return newStyles
    })
    setTables(
      tables.map((t) =>
        filteredTables.some((ft) => ft.id === t.id)
          ? {
              ...t,
              location: { ...t.location, coordinates: { x: 0, y: 0 } },
            }
          : t
      )
    )
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
            - Kéo thả để sắp xếp lại vị trí bàn. Nhấp để xoay bàn.
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
                cursor: isLayoutMode ? "move" : "pointer",
                zIndex: draggedTable?.id === table.id ? 1000 : 1,
              }

              return (
                <div
                  key={table.id}
                  style={tableStyle}
                  draggable={isLayoutMode}
                  onDragStart={(e) => handleTableLayoutDragStart(e, table)}
                  onDragEnd={handleTableLayoutDragEnd}
                  onClick={() => isLayoutMode && rotateTable(table.id)}
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
                    ${isLayoutMode ? "hover:shadow-lg hover:scale-105" : ""}
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
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}