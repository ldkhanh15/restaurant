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

  // Form states
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

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const validateField = (
    field: string,
    value: any,
    isEdit: boolean = false,
    currentId?: string
  ): string => {
    let error = ""

    switch (field) {
      case "name":
        if (!value?.trim()) error = "Tên nguyên liệu không được để trống"
        else if (
          ingredients.some(
            (i) =>
              i.name.trim().toLowerCase() === value.trim().toLowerCase() &&
              (!isEdit || i.id !== currentId)
          )
        ) {
          error = "Tên nguyên liệu đã tồn tại"
        }
        break
      case "unit":
        if (!value) error = "Vui lòng chọn đơn vị"
        break
      case "barcode":
        if (!value?.trim()) error = "Mã barcode không được để trống"
        break
      case "rfid":
        if (!value?.trim()) error = "Mã RFID không được để trống"
        break
      case "current_stock":
        if (value < 0) error = "Tồn kho không được âm"
        break
      case "min_stock_level":
        if (value < 0) error = "Tồn kho tối thiểu không được âm"
        break
    }

    return error
  }

  const validateAll = (data: any, isEdit: boolean = false, currentId?: string): boolean => {
    const fields = ["name", "unit", "barcode", "rfid", "current_stock", "min_stock_level"]
    const errs: Record<string, string> = {}

    fields.forEach((field) => {
      const error = validateField(field, data[field], isEdit, currentId)
      if (error) errs[field] = error
    })

    const errorSetter = isEdit ? setEditErrors : setErrors
    errorSetter(errs)

    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0]
      toast.error(firstError)
      return false
    }
    return true
  }

  const resetErrors = (isEdit: boolean = false) => {
    isEdit ? setEditErrors({}) : setErrors({})
  }

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
      const statusText = getStockStatus(i).props.children
      return statusText === stockFilter
    })

  const lowStockItems = ingredients.filter(
    (i) => !i.deleted_at && Number(i.current_stock) <= Number(i.min_stock_level) && Number(i.current_stock) > 0
  )
  const outOfStockItems = ingredients.filter((i) => !i.deleted_at && Number(i.current_stock) === 0)

  const handleCreate = async () => {
    if (!validateAll(newIngredient)) return

    try {
      const newItem: Ingredient = {
        id: uuidv4(),
        ...newIngredient,
        name: newIngredient.name.trim(),
        barcode: newIngredient.barcode?.trim(),
        rfid: newIngredient.rfid?.trim(),
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
      resetErrors()
    } catch (error: any) {
      toast.error(error?.message || "Tạo nguyên liệu thất bại")
    }
  }

  const handleEdit = async () => {
    if (!selectedIngredient || !validateAll(selectedIngredient, true, selectedIngredient.id)) return

    try {
      const updatedItem = {
        ...selectedIngredient,
        name: selectedIngredient.name.trim(),
        barcode: selectedIngredient.barcode?.trim(),
        rfid: selectedIngredient.rfid?.trim(),
        updated_at: new Date(),
      }

      const response = await ingredientService.update(selectedIngredient.id, updatedItem)
      if (!response) {
        toast.error("Cập nhật nguyên liệu thất bại")
        return
      }

      toast.success("Cập nhật nguyên liệu thành công")
      setIngredients((prev) =>
        prev.map((i) => (i.id === selectedIngredient.id ? updatedItem : i))
      )
      setIsEditDialogOpen(false)
      setSelectedIngredient(null)
      resetErrors(true)
    } catch (error: any) {
      toast.error(error?.message || "Cập nhật nguyên liệu thất bại")
    }
  }

  const handleDelete = async () => {
    if (!selectedIngredient) return

    try {
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
    } catch (error: any) {
      toast.error(error?.message || "Xóa nguyên liệu thất bại")
    }
  }

  // Reset form khi mở dialog
  useEffect(() => {
    if (isCreateDialogOpen) {
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
      resetErrors()
    }
  }, [isCreateDialogOpen])

  useEffect(() => {
    if (isEditDialogOpen && selectedIngredient) {
      resetErrors(true)
    }
  }, [isEditDialogOpen, selectedIngredient])

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

          <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as any)}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
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

        {/* CREATE DIALOG */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm nguyên liệu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm nguyên liệu mới</DialogTitle>
              <DialogDescription>Nhập thông tin nguyên liệu mới</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-1">
                <Label>Tên nguyên liệu *</Label>
                <Input
                  value={newIngredient.name}
                  onChange={(e) => {
                    setNewIngredient({ ...newIngredient, name: e.target.value })
                    validateField("name", e.target.value)
                  }}
                  onBlur={() => validateField("name", newIngredient.name)}
                  placeholder="Nhập tên nguyên liệu"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="grid gap-1">
                <Label>Đơn vị *</Label>
                <Select
                  value={newIngredient.unit}
                  onValueChange={(value) => {
                    setNewIngredient({ ...newIngredient, unit: value })
                    validateField("unit", value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-sm text-red-500">{errors.unit}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label>Tồn kho hiện tại *</Label>
                  <Input
                    type="number"
                    value={newIngredient.current_stock}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setNewIngredient({ ...newIngredient, current_stock: val })
                      validateField("current_stock", val)
                    }}
                    onBlur={() => validateField("current_stock", newIngredient.current_stock)}
                    min={0}
                  />
                  {errors.current_stock && <p className="text-sm text-red-500">{errors.current_stock}</p>}
                </div>
                <div className="grid gap-1">
                  <Label>Tồn kho tối thiểu *</Label>
                  <Input
                    type="number"
                    value={newIngredient.min_stock_level}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setNewIngredient({ ...newIngredient, min_stock_level: val })
                      validateField("min_stock_level", val)
                    }}
                    onBlur={() => validateField("min_stock_level", newIngredient.min_stock_level)}
                    min={0}
                  />
                  {errors.min_stock_level && <p className="text-sm text-red-500">{errors.min_stock_level}</p>}
                </div>
              </div>

              <div className="grid gap-1">
                <Label>Mã barcode *</Label>
                <Input
                  value={newIngredient.barcode || ""}
                  onChange={(e) => {
                    setNewIngredient({ ...newIngredient, barcode: e.target.value })
                    validateField("barcode", e.target.value)
                  }}
                  onBlur={() => validateField("barcode", newIngredient.barcode)}
                />
                {errors.barcode && <p className="text-sm text-red-500">{errors.barcode}</p>}
              </div>

              <div className="grid gap-1">
                <Label>Mã RFID *</Label>
                <Input
                  value={newIngredient.rfid || ""}
                  onChange={(e) => {
                    setNewIngredient({ ...newIngredient, rfid: e.target.value })
                    validateField("rfid", e.target.value)
                  }}
                  onBlur={() => validateField("rfid", newIngredient.rfid)}
                />
                {errors.rfid && <p className="text-sm text-red-500">{errors.rfid}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreate}>Thêm nguyên liệu</Button>
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
          <CardDescription>Quản lý kho ({filteredIngredients.length} nguyên liệu)</CardDescription>
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
              {filteredIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    Chưa có dữ liệu nguyên liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredients.map((i) => (
                  <TableRow key={i.id} className={i.deleted_at ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell>{i.unit}</TableCell>
                    <TableCell>
                      <span
                        className={
                          Number(i.current_stock) <= Number(i.min_stock_level) && !i.deleted_at
                            ? "text-red-600 font-medium"
                            : ""
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

                      {!i.deleted_at && (
                        <>
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
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* VIEW DIALOG */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
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

      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa thông tin nguyên liệu</DialogTitle>
          </DialogHeader>
          {selectedIngredient && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-1">
                <Label>Tên nguyên liệu *</Label>
                <Input
                  value={selectedIngredient.name}
                  onChange={(e) => {
                    setSelectedIngredient({ ...selectedIngredient, name: e.target.value })
                    validateField("name", e.target.value, true, selectedIngredient.id)
                  }}
                  onBlur={() => validateField("name", selectedIngredient.name, true, selectedIngredient.id)}
                />
                {editErrors.name && <p className="text-sm text-red-500">{editErrors.name}</p>}
              </div>

              <div className="grid gap-1">
                <Label>Đơn vị *</Label>
                <Select
                  value={selectedIngredient.unit}
                  onValueChange={(value) => {
                    setSelectedIngredient({ ...selectedIngredient, unit: value })
                    validateField("unit", value, true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.unit && <p className="text-sm text-red-500">{editErrors.unit}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label>Tồn kho *</Label>
                  <Input
                    type="number"
                    value={selectedIngredient.current_stock}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setSelectedIngredient({ ...selectedIngredient, current_stock: val })
                      validateField("current_stock", val, true)
                    }}
                    onBlur={() => validateField("current_stock", selectedIngredient.current_stock, true)}
                    min={0}
                  />
                  {editErrors.current_stock && <p className="text-sm text-red-500">{editErrors.current_stock}</p>}
                </div>
                <div className="grid gap-1">
                  <Label>Tồn kho tối thiểu *</Label>
                  <Input
                    type="number"
                    value={selectedIngredient.min_stock_level}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setSelectedIngredient({ ...selectedIngredient, min_stock_level: val })
                      validateField("min_stock_level", val, true)
                    }}
                    onBlur={() => validateField("min_stock_level", selectedIngredient.min_stock_level, true)}
                    min={0}
                  />
                  {editErrors.min_stock_level && <p className="text-sm text-red-500">{editErrors.min_stock_level}</p>}
                </div>
              </div>

              <div className="grid gap-1">
                <Label>Barcode *</Label>
                <Input
                  value={selectedIngredient.barcode || ""}
                  onChange={(e) => {
                    setSelectedIngredient({ ...selectedIngredient, barcode: e.target.value })
                    validateField("barcode", e.target.value, true)
                  }}
                  onBlur={() => validateField("barcode", selectedIngredient.barcode, true)}
                />
                {editErrors.barcode && <p className="text-sm text-red-500">{editErrors.barcode}</p>}
              </div>

              <div className="grid gap-1">
                <Label>RFID *</Label>
                <Input
                  value={selectedIngredient.rfid || ""}
                  onChange={(e) => {
                    setSelectedIngredient({ ...selectedIngredient, rfid: e.target.value })
                    validateField("rfid", e.target.value, true)
                  }}
                  onBlur={() => validateField("rfid", selectedIngredient.rfid, true)}
                />
                {editErrors.rfid && <p className="text-sm text-red-500">{editErrors.rfid}</p>}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa nguyên liệu <strong>{selectedIngredient?.name}</strong>? Hành động này không thể hoàn tác.
            </DialogDescription>
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