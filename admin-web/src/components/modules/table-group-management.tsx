"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Plus, Edit, Eye, Trash2, Search } from "lucide-react"
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
import { tableService } from "@/services/tableService"

interface TableGroupAttributes {
  id: string
  group_name: string
  table_ids: any
  total_capacity: number
  deposit: number
  cancel_minutes: number
  status: "available" | "occupied" | "cleaning" | "reserved"
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface TableGroupManagementProps {
  tableGroups: TableGroupAttributes[]
  setTableGroups: React.Dispatch<React.SetStateAction<TableGroupAttributes[]>>
}

export function TableGroupManagement({ tableGroups, setTableGroups }: TableGroupManagementProps) {
  const [selectedTableGroup, setSelectedTableGroup] = useState<TableGroupAttributes | null>(null)
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false)
  const [isViewGroupDialogOpen, setIsViewGroupDialogOpen] = useState(false)
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false)
  const [searchGroupTerm, setSearchGroupTerm] = useState("")
  const [groupStatusFilter, setGroupStatusFilter] = useState("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Trống</Badge>
      case "occupied":
        return <Badge className="bg-red-100 text-red-800">Có khách</Badge>
      case "reserved":
        return <Badge className="bg-blue-100 text-blue-800">Đã đặt</Badge>
      case "cleaning":
        return <Badge className="bg-gray-100 text-gray-800">Đang dọn dẹp</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const groupStats = {
    total: tableGroups.length,
    availableTableGroups: tableGroups.filter((t) => t.status === "available").length,
  }

  const getTableGroups = async () => {
    try {
      const response = await tableService.getAllTableGroup()
      if (response && response.status === 200) {
        const data = response.data.data?.rows || response.data.data
        setTableGroups(Array.isArray(data) ? data : [])
      } else {
        toast.error("Lấy danh sách nhóm bàn thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi tải danh sách nhóm bàn")
      setTableGroups([])
    }
  }

  useEffect(() => {
    getTableGroups()
  }, [])

  const filteredTableGroups = tableGroups.filter(
    (group) =>
      group.group_name.toLowerCase().includes(searchGroupTerm.toLowerCase()) &&
      (groupStatusFilter === "all" ||
        (groupStatusFilter === "active" && !group.deleted_at) ||
        (groupStatusFilter === "deleted" && group.deleted_at))
  )

  const handleCreateTableGroup = async (
    data: Omit<TableGroupAttributes, "id" | "created_at" | "updated_at" | "deleted_at">
  ) => {
    const newTableGroup: TableGroupAttributes = {
      id: uuidv4(),
      ...data,
      table_ids: data.table_ids || [],
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }

    try {
      const response = await tableService.createGroup(newTableGroup)
      if (response && response.status === 201) {
        setTableGroups((prev) => [...prev, newTableGroup])
        setIsCreateGroupDialogOpen(false)
        toast.success("Đã thêm nhóm bàn thành công")
      } else {
        toast.error("Thêm nhóm bàn thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi thêm nhóm bàn")
    }
  }

  const handleUpdateTableGroup = async (id: string, data: Partial<TableGroupAttributes>) => {
    try {
      const response = await tableService.updateGroup(id, data)
      if (response && response.status === 200) {
        setTableGroups((prev) =>
          prev.map((tableGroup) =>
            tableGroup.id === id ? { ...tableGroup, ...data, updated_at: new Date() } : tableGroup
          )
        )
        setIsEditGroupDialogOpen(false)
        toast.success("Đã cập nhật nhóm bàn thành công")
      } else {
        toast.error("Cập nhật nhóm bàn thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật nhóm bàn")
    }
  }

  const handleDeleteTableGroup = async (id: string) => {
    try {
      const response = await tableService.removeGroup(id)
      if (response && response.status === 200) {
        setTableGroups((prev) =>
          prev.map((group) => (group.id === id ? { ...group, deleted_at: new Date() } : group))
        )
        toast.success("Đã xóa nhóm bàn thành công")
      } else {
        toast.error("Xóa nhóm bàn thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi xóa nhóm bàn")
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng nhóm bàn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nhóm bàn trống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{groupStats.availableTableGroups}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm nhóm bàn..."
              value={searchGroupTerm}
              onChange={(e) => setSearchGroupTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={groupStatusFilter} onValueChange={setGroupStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="deleted">Đã xóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateGroupDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhóm bàn
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTableGroups.map((tableGroup) => (
          <Card
            key={tableGroup.id}
            className={`border-l-4 ${tableGroup.deleted_at ? "opacity-50" : ""} ${
              tableGroup.status === "available"
                ? "border-l-green-500"
                : tableGroup.status === "occupied"
                  ? "border-l-red-500"
                  : tableGroup.status === "reserved"
                    ? "border-l-blue-500"
                    : "border-l-gray-500"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{tableGroup.group_name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {tableGroup.total_capacity} người
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(tableGroup.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTableGroup(tableGroup)
                      setIsViewGroupDialogOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!tableGroup.deleted_at && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTableGroup(tableGroup)
                          setIsEditGroupDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTableGroup(tableGroup.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Tiền cọc: {tableGroup.deposit} VNĐ</p>
              <p className="text-sm text-muted-foreground">Thời gian hủy: {tableGroup.cancel_minutes} phút</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Table Group Dialog */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhóm bàn mới</DialogTitle>
            <DialogDescription>Thêm thông tin nhóm bàn mới vào hệ thống</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleCreateTableGroup({
                group_name: formData.get("group_name") as string,
                total_capacity: Number(formData.get("total_capacity")),
                deposit: Number(formData.get("deposit")),
                cancel_minutes: Number(formData.get("cancel_minutes")),
                table_ids: formData
                  .get("table_ids")
                  ?.toString()
                  .split(",")
                  .map((id) => id.trim()) || [],
                status: formData.get("status") as "available" | "occupied" | "cleaning" | "reserved",
              })
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="group_name">Tên nhóm</Label>
                <Input id="group_name" name="group_name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_capacity">Tổng sức chứa</Label>
                <Input id="total_capacity" name="total_capacity" type="number" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deposit">Tiền cọc (VNĐ)</Label>
                <Input id="deposit" name="deposit" type="number" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cancel_minutes">Thời gian hủy (phút)</Label>
                <Input id="cancel_minutes" name="cancel_minutes" type="number" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="table_ids">ID các bàn (phân tách bằng dấu phẩy)</Label>
                <Input id="table_ids" name="table_ids" placeholder="table1,table2" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select name="status" defaultValue="available">
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Trống</SelectItem>
                    <SelectItem value="occupied">Có khách</SelectItem>
                    <SelectItem value="reserved">Đã đặt</SelectItem>
                    <SelectItem value="cleaning">Đang dọn dẹp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Thêm nhóm bàn</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Table Group Dialog */}
      <Dialog open={isViewGroupDialogOpen} onOpenChange={setIsViewGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin nhóm bàn</DialogTitle>
          </DialogHeader>
          {selectedTableGroup && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tên nhóm</Label>
                <div>{selectedTableGroup.group_name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Tổng sức chứa</Label>
                <div>{selectedTableGroup.total_capacity} người</div>
              </div>
              <div className="grid gap-2">
                <Label>Tiền cọc</Label>
                <div>{selectedTableGroup.deposit} VNĐ</div>
              </div>
              <div className="grid gap-2">
                <Label>Thời gian hủy</Label>
                <div>{selectedTableGroup.cancel_minutes} phút</div>
              </div>
              <div className="grid gap-2">
                <Label>ID các bàn</Label>
                <div>{Array.isArray(selectedTableGroup.table_ids) ? selectedTableGroup.table_ids.join(", ") : "Không có"}</div>
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <div>{getStatusBadge(selectedTableGroup.status)}</div>
              </div>
              <div className="grid gap-2">
                <Label>Ngày tạo</Label>
                <div>
                  {selectedTableGroup.created_at
                    ? new Date(selectedTableGroup.created_at).toLocaleDateString()
                    : "Không có"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Table Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhóm bàn</DialogTitle>
          </DialogHeader>
          {selectedTableGroup && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateTableGroup(selectedTableGroup.id, {
                  group_name: formData.get("group_name") as string,
                  total_capacity: Number(formData.get("total_capacity")),
                  deposit: Number(formData.get("deposit")),
                  cancel_minutes: Number(formData.get("cancel_minutes")),
                  table_ids: formData
                    .get("table_ids")
                    ?.toString()
                    .split(",")
                    .map((id) => id.trim()) || [],
                  status: formData.get("status") as "available" | "occupied" | "cleaning" | "reserved",
                })
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-group_name">Tên nhóm</Label>
                  <Input id="edit-group_name" name="group_name" defaultValue={selectedTableGroup.group_name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-total_capacity">Tổng sức chứa</Label>
                  <Input id="edit-total_capacity" name="total_capacity" type="number" defaultValue={selectedTableGroup.total_capacity} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-deposit">Tiền cọc (VNĐ)</Label>
                  <Input id="edit-deposit" name="deposit" type="number" defaultValue={selectedTableGroup.deposit} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-cancel_minutes">Thời gian hủy (phút)</Label>
                  <Input id="edit-cancel_minutes" name="cancel_minutes" type="number" defaultValue={selectedTableGroup.cancel_minutes} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-table_ids">ID các bàn (phân tách bằng dấu phẩy)</Label>
                  <Input id="edit-table_ids" name="table_ids" defaultValue={Array.isArray(selectedTableGroup.table_ids) ? selectedTableGroup.table_ids.join(", ") : ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Trạng thái</Label>
                  <Select name="status" defaultValue={selectedTableGroup.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Trống</SelectItem>
                      <SelectItem value="occupied">Có khách</SelectItem>
                      <SelectItem value="reserved">Đã đặt</SelectItem>
                      <SelectItem value="cleaning">Đang dọn dẹp</SelectItem>
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