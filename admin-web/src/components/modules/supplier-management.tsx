"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { v4 as uuidv4 } from "uuid"
import { supplierService } from "@/services/supplierService"
import { toast } from "react-toastify"

interface Supplier {
  id: string
  name: string
  contact?: string
  created_at?: string
  deleted_at?: string | null
}

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  // Form states
  const [createForm, setCreateForm] = useState({ name: "", contact: "" })
  const [editForm, setEditForm] = useState({ name: "", contact: "" })

  // Validation errors
  const [createErrors, setCreateErrors] = useState({ name: "", contact: "" })
  const [editErrors, setEditErrors] = useState({ name: "", contact: "" })

  // Lấy danh sách nhà cung cấp
  const getSuppliers = async () => {
    try {
      const response = await supplierService.getAll()
      if (response && response.data) {
        const data = response.data || response.data.data
        setSuppliers(Array.isArray(data) ? data : [])
      } else {
        toast.error("Lấy danh sách nhà cung cấp thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi tải danh sách nhà cung cấp")
      setSuppliers([])
    }
  }

  useEffect(() => {
    getSuppliers()
  }, [])

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      (supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" ||
        (statusFilter === "active" && !supplier.deleted_at) ||
        (statusFilter === "deleted" && supplier.deleted_at))
  )

  // Validate tên (không trống + không trùng)
  const validateName = (name: string, editingId?: string): string => {
    const trimmed = name.trim()
    if (!trimmed) return "Tên nhà cung cấp không được để trống"

    const isDuplicate = suppliers.some(s => {
      const sameName = s.name.trim().toLowerCase() === trimmed.toLowerCase()
      const differentId = !editingId || s.id !== editingId
      return sameName && differentId
    })

    return isDuplicate ? "Tên nhà cung cấp đã tồn tại" : ""
  }

  // Validate contact (không trống)
  const validateContact = (contact: string): string => {
    return contact.trim() ? "" : "Số điện thoại không được để trống"
  }

  // Xử lý tạo mới
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameError = validateName(createForm.name)
    const contactError = validateContact(createForm.contact)

    setCreateErrors({ name: nameError, contact: contactError })

    if (nameError || contactError) {
      toast.error("Vui lòng kiểm tra lại thông tin")
      return
    }

    const newSupplier: Supplier = {
      id: uuidv4(),
      name: createForm.name.trim(),
      contact: createForm.contact.trim(),
      created_at: new Date().toISOString().split("T")[0],
    }

    try {
      const response = await supplierService.create(newSupplier)
      if (response) {
        toast.success("Đã thêm nhà cung cấp thành công")
        setSuppliers(prev => [...prev, newSupplier])
        setIsCreateDialogOpen(false)
        setCreateForm({ name: "", contact: "" })
        setCreateErrors({ name: "", contact: "" })
      } else {
        toast.error("Thêm nhà cung cấp thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi thêm nhà cung cấp")
    }
  }

  // Xử lý cập nhật
  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSupplier) return

    const nameError = validateName(editForm.name, selectedSupplier.id)
    const contactError = validateContact(editForm.contact)

    setEditErrors({ name: nameError, contact: contactError })

    if (nameError || contactError) {
      toast.error("Vui lòng kiểm tra lại thông tin")
      return
    }

    try {
      const response = await supplierService.update(selectedSupplier.id, {
        name: editForm.name.trim(),
        contact: editForm.contact.trim(),
      })

      if (response) {
        toast.success("Cập nhật nhà cung cấp thành công")
        setSuppliers(prev =>
          prev.map(s =>
            s.id === selectedSupplier.id
              ? { ...s, name: editForm.name.trim(), contact: editForm.contact.trim() }
              : s
          )
        )
        setIsEditDialogOpen(false)
      } else {
        toast.error("Cập nhật thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật")
    }
  }

  // Xóa mềm
  const handleDeleteSupplier = async (id: string) => {
    try {
      const response = await supplierService.remove(id)
      if (response) {
        toast.success("Đã xóa nhà cung cấp thành công")
        setSuppliers(prev =>
          prev.map(s =>
            s.id === id ? { ...s, deleted_at: new Date().toISOString().split("T")[0] } : s
          )
        )
      } else {
        toast.error("Xóa thất bại")
      }
    } catch (err) {
      toast.error("Lỗi khi xóa")
    }
  }

  // Mở form tạo
  const openCreateDialog = () => {
    setCreateForm({ name: "", contact: "" })
    setCreateErrors({ name: "", contact: "" })
    setIsCreateDialogOpen(true)
  }

  // Mở form sửa
  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setEditForm({ name: supplier.name, contact: supplier.contact || "" })
    setEditErrors({ name: "", contact: "" })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhà cung cấp
        </Button>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý nhà cung cấp</CardTitle>
          <CardDescription>
            Quản lý thông tin nhà cung cấp trong hệ thống ({filteredSuppliers.length} nhà cung cấp)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên nhà cung cấp</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Chưa có dữ liệu nhà cung cấp
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className={supplier.deleted_at ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact || "-"}</TableCell>
                    <TableCell>{supplier.created_at || "-"}</TableCell>
                    <TableCell>
                      {supplier.deleted_at ? (
                        <Badge variant="destructive">Đã xóa</Badge>
                      ) : (
                        <Badge variant="secondary">Hoạt động</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSupplier(supplier)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!supplier.deleted_at && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSupplier(supplier.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm nhà cung cấp mới</DialogTitle>
            <DialogDescription>Nhập đầy đủ thông tin nhà cung cấp</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSupplier}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Tên nhà cung cấp *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, name: e.target.value })
                    if (createErrors.name) {
                      setCreateErrors({ ...createErrors, name: validateName(e.target.value) })
                    }
                  }}
                  placeholder="Nhập tên nhà cung cấp"
                  className={createErrors.name ? "border-red-500" : ""}
                />
                {createErrors.name && <p className="text-sm text-red-500">{createErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-contact">Số điện thoại *</Label>
                <Input
                  id="create-contact"
                  value={createForm.contact}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, contact: e.target.value })
                    if (createErrors.contact) {
                      setCreateErrors({ ...createErrors, contact: validateContact(e.target.value) })
                    }
                  }}
                  placeholder="Nhập số điện thoại"
                  className={createErrors.contact ? "border-red-500" : ""}
                />
                {createErrors.contact && <p className="text-sm text-red-500">{createErrors.contact}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!!createErrors.name || !!createErrors.contact || !createForm.name.trim() || !createForm.contact.trim()}
              >
                Thêm nhà cung cấp
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhà cung cấp</DialogTitle>
            <DialogDescription>Cập nhật thông tin nhà cung cấp</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <form onSubmit={handleUpdateSupplier}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Tên nhà cung cấp *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm({ ...editForm, name: e.target.value })
                      if (editErrors.name) {
                        setEditErrors({ ...editErrors, name: validateName(e.target.value, selectedSupplier.id) })
                      }
                    }}
                    placeholder="Nhập tên nhà cung cấp"
                    className={editErrors.name ? "border-red-500" : ""}
                  />
                  {editErrors.name && <p className="text-sm text-red-500">{editErrors.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact">Số điện thoại *</Label>
                  <Input
                    id="edit-contact"
                    value={editForm.contact}
                    onChange={(e) => {
                      setEditForm({ ...editForm, contact: e.target.value })
                      if (editErrors.contact) {
                        setEditErrors({ ...editErrors, contact: validateContact(e.target.value) })
                      }
                    }}
                    placeholder="Nhập số điện thoại"
                    className={editErrors.contact ? "border-red-500" : ""}
                  />
                  {editErrors.contact && <p className="text-sm text-red-500">{editErrors.contact}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={!!editErrors.name || !!editErrors.contact || !editForm.name.trim() || !editForm.contact.trim()}
                >
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin nhà cung cấp</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tên nhà cung cấp</Label>
                <div className="font-medium">{selectedSupplier.name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Số điện thoại</Label>
                <div>{selectedSupplier.contact || "Không có"}</div>
              </div>
              <div className="grid gap-2">
                <Label>Ngày tạo</Label>
                <div>{selectedSupplier.created_at || "Chưa có"}</div>
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <div>
                  {selectedSupplier.deleted_at ? (
                    <Badge variant="destructive">Đã xóa</Badge>
                  ) : (
                    <Badge variant="secondary">Hoạt động</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}