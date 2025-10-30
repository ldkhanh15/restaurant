"use client"

import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Eye, Trash2, AlertTriangle, Filter } from "lucide-react"
import { ingredientService } from "@/services/ingredientService"
import { toast } from "react-toastify"

interface Ingredient {
  id: string
  name: string
  unit: string
  barcode?: string
  rfid?: string
  min_stock_level: number
  current_stock: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface IngredientManagementProps {
  ingredients: Ingredient[]
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>
}

const UNITS = ["kg", "g", "l", "ml", "cái", "bịch", "chai"]

export function IngredientManagement({
  ingredients,
  setIngredients,
}: IngredientManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [stockFilter, setStockFilter] = useState<"Tất cả" | "Đủ hàng" | "Sắp hết" | "Hết hàng">("Tất cả")
  const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, "id">>({
    name: "",
    unit: "",
    barcode: "",
    rfid: "",
    min_stock_level: 0,
    current_stock: 0,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  })

  const getAllIngredients = async () => {
    try {
      const response = await ingredientService.getAllNoPaging()
      if (!response) {
        toast.error("Lấy nguyên liệu thất bại")
        return
      }
      setIngredients(response as any)
    } catch (error) {
      toast.error("Lấy nguyên liệu thất bại")
    }
  }

  useEffect(() => {
    getAllIngredients()
  }, [])

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.deleted_at) {
      return <Badge variant="destructive">Đã xóa</Badge>
    }
    if (Number(ingredient.current_stock) === 0) {
      return <Badge className="bg-red-100 text-red-800">Hết hàng</Badge>
    } else if (Number(ingredient.current_stock) <= Number(ingredient.min_stock_level)) {
      return <Badge className="bg-yellow-100 text-yellow-800">Sắp hết</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Đủ hàng</Badge>
    }
  }

  const filteredIngredients = ingredients
    .filter((i) => (showDeleted ? true : !i.deleted_at))
    .filter((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((i) => {
      if (stockFilter === "Tất cả") return true
      const status = getStockStatus(i)
      if (stockFilter === "Đủ hàng" && status.props.children === "Đủ hàng") return true
      if (stockFilter === "Sắp hết" && status.props.children === "Sắp hết") return true
      if (stockFilter === "Hết hàng" && status.props.children === "Hết hàng") return true
      return false
    })

  const lowStockItems = ingredients.filter(
    (i) => !i.deleted_at && Number(i.current_stock) <= Number(i.min_stock_level) && Number(i.current_stock) > 0
  )
  const outOfStockItems = ingredients.filter((i) => !i.deleted_at && Number(i.current_stock) === 0)

  const handleCreate = async () => {
    const name = newIngredient.name.trim()
    const unit = newIngredient.unit.trim()
    const barcode = newIngredient.barcode?.trim() || ""
    const rfid = newIngredient.rfid?.trim() || ""
    const current_stock = Number(newIngredient.current_stock)
    const min_stock_level = Number(newIngredient.min_stock_level)

    if (!name || !unit || current_stock < 0 || min_stock_level < 0 || !barcode || !rfid) {
      toast.error("Vui lòng nhập đầy đủ và hợp lệ tất cả thông tin")
      return
    }
    const newItem: Ingredient = {
      id: uuidv4(),
      ...newIngredient,
      created_at: new Date(),
      updated_at: new Date(),
    }
    const response = await ingredientService.create(newItem)
    if (!response) {
      toast.error("Tạo nguyên liệu thất bại")
      return
    }
    toast.success("Tạo nguyên liệu thành công")
    setIngredients([...ingredients, newItem])
    setIsCreateDialogOpen(false)
    setNewIngredient({
      name: "",
      unit: "",
      barcode: "",
      rfid: "",
      min_stock_level: 0,
      current_stock: 0,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    })
  }

  const handleEdit = async () => {
    if (!selectedIngredient) return
    const name = selectedIngredient.name.trim()
    const unit = selectedIngredient.unit.trim()
    const barcode = selectedIngredient.barcode?.trim() || ""
    const rfid = selectedIngredient.rfid?.trim() || ""
    const current_stock = Number(selectedIngredient.current_stock)
    const min_stock_level = Number(selectedIngredient.min_stock_level)

    if (!name || !unit || current_stock < 0 || min_stock_level < 0 || !barcode || !rfid) {
      toast.error("Vui lòng nhập đầy đủ và hợp lệ tất cả thông tin")
      return
    }
    const response = await ingredientService.update(selectedIngredient.id, {
      ...selectedIngredient,
      updated_at: new Date(),
    })
    if (!response) {
      toast.error("Cập nhật nguyên liệu thất bại")
      return
    }
    toast.success("Cập nhật nguyên liệu thành công")
    setIngredients((prev) =>
      prev.map((i) => (i.id === selectedIngredient.id ? { ...selectedIngredient, updated_at: new Date() } : i))
    )
    setIsEditDialogOpen(false)
    setSelectedIngredient(null)
  }

  const handleDelete = async () => {
    if (!selectedIngredient) return
    const response = await ingredientService.remove(selectedIngredient.id)
    if (!response) {
      toast.error("Xóa nguyên liệu thất bại")
      return
    }
    toast.success("Xóa nguyên liệu thành công")
    setIngredients((prev) =>
      prev.map((i) => (i.id === selectedIngredient.id ? { ...i, deleted_at: new Date() } : i))
    )
    setIsDeleteDialogOpen(false)
    setSelectedIngredient(null)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng nguyên liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredients.filter((i) => !i.deleted_at).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sắp hết hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hết hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm nguyên liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button variant={showDeleted ? "default" : "outline"} onClick={() => setShowDeleted(!showDeleted)}>
            {showDeleted ? "Ẩn đã xóa" : "Hiện đã xóa"}
          </Button>

          <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as "Tất cả" | "Đủ hàng" | "Sắp hết" | "Hết hàng")}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Lọc trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tất cả">Tất cả</SelectItem>
              <SelectItem value="Đủ hàng">Đủ hàng</SelectItem>
              <SelectItem value="Sắp hết">Sắp hết</SelectItem>
              <SelectItem value="Hết hàng">Hết hàng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm nguyên liệu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm nguyên liệu mới</DialogTitle>
              <DialogDescription>Nhập thông tin nguyên liệu mới</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tên nguyên liệu</Label>
                <Input
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  placeholder="Nhập tên nguyên liệu"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Đơn vị</Label>
                <Select
                  value={newIngredient.unit}
                  onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tồn kho hiện tại</Label>
                  <Input
                    type="number"
                    value={newIngredient.current_stock}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        current_stock: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tồn kho tối thiểu</Label>
                  <Input
                    type="number"
                    value={newIngredient.min_stock_level}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        min_stock_level: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Mã barcode</Label>
                <Input
                  value={newIngredient.barcode || ""}
                  onChange={(e) => setNewIngredient({ ...newIngredient, barcode: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Mã RFID</Label>
                <Input
                  value={newIngredient.rfid || ""}
                  onChange={(e) => setNewIngredient({ ...newIngredient, rfid: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreate}>Thêm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warnings */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="space-y-2">
          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">Có {lowStockItems.length} nguyên liệu sắp hết hàng</span>
            </div>
          )}
          {outOfStockItems.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-800">Có {outOfStockItems.length} nguyên liệu hết hàng</span>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nguyên liệu</CardTitle>
          <CardDescription>
            Quản lý kho ({filteredIngredients.length} nguyên liệu)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Tối thiểu</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>RFID</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.map((i) => (
                <TableRow key={i.id} className={i.deleted_at ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell>
                    <span
                      className={
                        Number(i.current_stock) <= Number(i.min_stock_level) && !i.deleted_at ? "text-red-600 font-medium" : ""
                      }
                    >
                      {i.current_stock}
                    </span>
                  </TableCell>
                  <TableCell>{i.min_stock_level}</TableCell>
                  <TableCell>{i.barcode || "-"}</TableCell>
                  <TableCell>{i.rfid || "-"}</TableCell>
                  <TableCell>{getStockStatus(i)}</TableCell>
                  <TableCell className="flex gap-2">
                    {/* View */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedIngredient(i)
                        setIsViewDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedIngredient({ ...i })
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    {!i.deleted_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedIngredient(i)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết nguyên liệu</DialogTitle>
          </DialogHeader>
          {selectedIngredient && (
            <div className="grid gap-3">
              <p><strong>Tên:</strong> {selectedIngredient.name}</p>
              <p><strong>Đơn vị:</strong> {selectedIngredient.unit}</p>
              <p><strong>Tồn kho:</strong> {selectedIngredient.current_stock}</p>
              <p><strong>Tối thiểu:</strong> {selectedIngredient.min_stock_level}</p>
              <p><strong>Barcode:</strong> {selectedIngredient.barcode || "Không có"}</p>
              <p><strong>RFID:</strong> {selectedIngredient.rfid || "Không có"}</p>
              <p><strong>Ngày tạo:</strong> {selectedIngredient.created_at?.toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa thông tin nguyên liệu</DialogTitle>
          </DialogHeader>
          {selectedIngredient && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tên nguyên liệu</Label>
                <Input
                  value={selectedIngredient.name}
                  onChange={(e) =>
                    setSelectedIngredient({ ...selectedIngredient, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Đơn vị</Label>
                <Select
                  value={selectedIngredient.unit}
                  onValueChange={(value) =>
                    setSelectedIngredient({ ...selectedIngredient, unit: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tồn kho</Label>
                  <Input
                    type="number"
                    value={selectedIngredient.current_stock}
                    onChange={(e) =>
                      setSelectedIngredient({
                        ...selectedIngredient,
                        current_stock: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tồn kho tối thiểu</Label>
                  <Input
                    type="number"
                    value={selectedIngredient.min_stock_level}
                    onChange={(e) =>
                      setSelectedIngredient({
                        ...selectedIngredient,
                        min_stock_level: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Barcode</Label>
                <Input
                  value={selectedIngredient.barcode || ""}
                  onChange={(e) =>
                    setSelectedIngredient({ ...selectedIngredient, barcode: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>RFID</Label>
                <Input
                  value={selectedIngredient.rfid || ""}
                  onChange={(e) =>
                    setSelectedIngredient({ ...selectedIngredient, rfid: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn xóa nguyên liệu này không? Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}