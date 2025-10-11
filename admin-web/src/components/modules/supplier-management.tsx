"use client"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Plus, Edit, Trash2, Eye, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Supplier {
  id: string
  name: string
  contact?: string
  created_at?: string
  deleted_at?: string | null
}

// Mock data for testing
const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Công ty TNHH Thực phẩm A",
    contact: "0901234567",
    created_at: "2024-03-15",
  },
  {
    id: "2",
    name: "Nhà cung cấp B",
    contact: "0912345678",
    created_at: "2024-03-16",
  },
  {
    id: "3",
    name: "Công ty Thực phẩm C",
    contact: "0923456789",
    created_at: "2024-03-17",
    deleted_at: "2024-03-20",
  },
]

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all") // "all", "active", "deleted"

  // Filter suppliers based on search term and status
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      (supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" ||
        (statusFilter === "active" && !supplier.deleted_at) ||
        (statusFilter === "deleted" && supplier.deleted_at))
  )

  // Handler functions
  const handleCreateSupplier = (data: Omit<Supplier, "id" | "created_at">) => {
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString().split("T")[0],
    }
    setSuppliers([...suppliers, newSupplier])
    setIsCreateDialogOpen(false)
  }

  const handleUpdateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === id ? { ...supplier, ...data } : supplier
      )
    )
    setIsEditDialogOpen(false)
  }

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === id ? { ...supplier, deleted_at: new Date().toISOString().split("T")[0] } : supplier
      )
    )
  }

  const handleRestoreSupplier = (id: string) => {
    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === id ? { ...supplier, deleted_at: null } : supplier
      )
    )
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
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhà cung cấp
        </Button>
      </div>

      {/* Main Content */}
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
                <TableHead>Thông tin liên hệ</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className={supplier.deleted_at ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact}</TableCell>
                  <TableCell>{supplier.created_at}</TableCell>
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
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              setIsEditDialogOpen(true)
                            }}
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
                      {supplier.deleted_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestoreSupplier(supplier.id)}
                        >
                          Khôi phục
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhà cung cấp mới</DialogTitle>
            <DialogDescription>Thêm thông tin nhà cung cấp mới vào hệ thống</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleCreateSupplier({
                name: formData.get("name") as string,
                contact: formData.get("contact") as string,
              })
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên nhà cung cấp</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Thông tin liên hệ</Label>
                <Input id="contact" name="contact" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Thêm nhà cung cấp</Button>
            </DialogFooter>
          </form>
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
                <div>{selectedSupplier.name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Thông tin liên hệ</Label>
                <div>{selectedSupplier.contact || "Không có"}</div>
              </div>
              <div className="grid gap-2">
                <Label>Ngày tạo</Label>
                <div>{selectedSupplier.created_at}</div>
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
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhà cung cấp</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateSupplier(selectedSupplier.id, {
                  name: formData.get("name") as string,
                  contact: formData.get("contact") as string,
                })
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Tên nhà cung cấp</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedSupplier.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact">Thông tin liên hệ</Label>
                  <Input
                    id="edit-contact"
                    name="contact"
                    defaultValue={selectedSupplier.contact}
                  />
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
