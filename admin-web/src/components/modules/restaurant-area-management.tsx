"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Plus, Edit, Eye, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import { toast } from "react-toastify"
import { masterService } from "@/services/masterService"

interface RestaurantAreaAttributes {
  id: string
  name: string
  area_size: number
  shape_type: "square" | "rectangle" | "circle" | "polygon" | "rhombus" | "parallelogram"
  status: "active" | "maintenance" | "clean"
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface RestaurantAreaManagementProps {
  area?: RestaurantAreaAttributes | null
  onAreaChange?: (area: RestaurantAreaAttributes | null) => void
}

export function RestaurantAreaManagement({ area: propArea, onAreaChange }: RestaurantAreaManagementProps) {
  const [area, setArea] = useState<RestaurantAreaAttributes | null>(propArea ?? null)
  const [selectedArea, setSelectedArea] = useState<RestaurantAreaAttributes | null>(null)
  const [isCreateAreaDialogOpen, setIsCreateAreaDialogOpen] = useState(false)
  const [isViewAreaDialogOpen, setIsViewAreaDialogOpen] = useState(false)
  const [isEditAreaDialogOpen, setIsEditAreaDialogOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Hoạt động</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Bảo trì</Badge>
      case "clean":
        return <Badge className="bg-gray-100 text-gray-800">Đang dọn dẹp</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getArea = async () => {
    try {
      const response = await masterService.get()
      if (response) {
        const data = response as any
        setArea(data || null)
        onAreaChange?.(data || null)
      } else {
        toast.error("Lấy thông tin khu vực thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi tải thông tin khu vực")
      setArea(null)
      onAreaChange?.(null)
    }
  }

  // If parent passed area prop, keep local state in sync. Otherwise, fetch on mount.
  useEffect(() => {
    if (propArea !== undefined) {
      setArea(propArea)
    } else {
      getArea()
    }
    // only run on mount or when propArea changes
  }, [propArea])

  const handleCreateArea = async (
    data: Omit<RestaurantAreaAttributes, "id" | "created_at" | "updated_at" | "deleted_at">
  ) => {
    if(data.name.trim() === "" || data.area_size <= 0 || !data.shape_type || !data.status) {
      toast.error("Vui lòng điền đầy đủ thông tin khu vực!")
      return
    } 
    const newArea: RestaurantAreaAttributes = {
      id: uuidv4(),
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }

    try {
      const response = await masterService.create(newArea)
      if (response && response.status === 201) {
        setArea(newArea)
        onAreaChange?.(newArea)
        setIsCreateAreaDialogOpen(false)
        toast.success("Đã thêm khu vực thành công")
      } else {
        toast.error("Thêm khu vực thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi thêm khu vực")
    }
  }

  const handleUpdateArea = async (id: string, data: Partial<RestaurantAreaAttributes>) => {
    try {
      const response = await masterService.update(id, data)
      if (response) {
        setArea((prev) => {
          const updated = prev ? { ...prev, ...data, updated_at: new Date() } : null
          onAreaChange?.(updated)
          return updated
        })
        setIsEditAreaDialogOpen(false)
        toast.success("Đã cập nhật khu vực thành công")
      } else {
        toast.error("Cập nhật khu vực thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật khu vực")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {!area && (
          <Button onClick={() => setIsCreateAreaDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm khu vực
          </Button>
        )}
      </div>

      {area ? (
        <Card
          className={`border-l-4 ${area.deleted_at ? "opacity-50" : ""} ${
            area.status === "active"
              ? "border-l-green-500"
              : area.status === "maintenance"
              ? "border-l-yellow-500"
              : "border-l-gray-500"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{area.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {area.area_size} m²
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(area.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedArea(area)
                    setIsViewAreaDialogOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {!area.deleted_at && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedArea(area)
                        setIsEditAreaDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Hình dạng: {area.shape_type}</p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-muted-foreground">Chưa có khu vực nào được thiết lập.</p>
      )}

      {/* Create Area Dialog */}
      <Dialog open={isCreateAreaDialogOpen} onOpenChange={setIsCreateAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm khu vực mới</DialogTitle>
            <DialogDescription>Thêm thông tin khu vực sàn nhà hàng vào hệ thống</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleCreateArea({
                name: formData.get("name") as string,
                area_size: Number(formData.get("area_size")),
                shape_type: formData.get("shape_type") as "square" | "rectangle" | "circle" | "polygon" | "rhombus" | "parallelogram",
                status: formData.get("status") as "active" | "maintenance" | "clean",
              })
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên khu vực</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area_size">Diện tích (m²)</Label>
                <Input id="area_size" name="area_size" type="number" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shape_type">Hình dạng</Label>
                <Select name="shape_type" defaultValue="square">
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hình dạng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Vuông</SelectItem>
                    <SelectItem value="rectangle">Chữ nhật</SelectItem>
                    <SelectItem value="circle">Bầu dục</SelectItem>
                    <SelectItem value="polygon">Đa giác</SelectItem>
                    <SelectItem value="rhombus">Hình thoi</SelectItem>
                    <SelectItem value="parallelogram">Bình hành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select name="status" defaultValue="active">
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                    <SelectItem value="clean">Đang dọn dẹp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Thêm khu vực</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Area Dialog */}
      <Dialog open={isViewAreaDialogOpen} onOpenChange={setIsViewAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin khu vực</DialogTitle>
          </DialogHeader>
          {selectedArea && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tên khu vực</Label>
                <div>{selectedArea.name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Diện tích</Label>
                <div>{selectedArea.area_size} m²</div>
              </div>
              <div className="grid gap-2">
                <Label>Hình dạng</Label>
                <div>{selectedArea.shape_type}</div>
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <div>{getStatusBadge(selectedArea.status)}</div>
              </div>
              <div className="grid gap-2">
                <Label>Ngày tạo</Label>
                <div>
                  {selectedArea.created_at
                    ? new Date(selectedArea.created_at).toLocaleDateString()
                    : "Không có"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Area Dialog */}
      <Dialog open={isEditAreaDialogOpen} onOpenChange={setIsEditAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khu vực</DialogTitle>
          </DialogHeader>
          {selectedArea && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateArea(selectedArea.id, {
                  name: formData.get("name") as string,
                  area_size: Number(formData.get("area_size")),
                  shape_type: formData.get("shape_type") as "square" | "rectangle" | "circle" | "polygon" | "rhombus" | "parallelogram",
                  status: formData.get("status") as "active" | "maintenance" | "clean",
                })
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Tên khu vực</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedArea.name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-area_size">Diện tích (m²)</Label>
                  <Input id="edit-area_size" name="area_size" type="number" defaultValue={selectedArea.area_size} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shape_type">Hình dạng</Label>
                  <Select name="shape_type" defaultValue={selectedArea.shape_type}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn hình dạng" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="square">Vuông</SelectItem>
                    <SelectItem value="rectangle">Chữ nhật</SelectItem>
                    <SelectItem value="circle">Bầu dục</SelectItem>
                    <SelectItem value="polygon">Đa giác</SelectItem>
                    <SelectItem value="rhombus">Hình thoi</SelectItem>
                    <SelectItem value="parallelogram">Bình hành</SelectItem>
                  </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Trạng thái</Label>
                  <Select name="status" defaultValue={selectedArea.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="maintenance">Bảo trì</SelectItem>
                      <SelectItem value="clean">Đang dọn dẹp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Lưu thay đổi</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}