"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Eye, Edit, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { supplierService } from "@/services/supplierService"
import { ingredientService } from "@/services/ingredientService"
import { inventoryImportService } from "@/services/inventoryImportService"
import { toast } from "react-toastify"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import employeeApi from "@/services/employeeService"
import { v4 as uuidv4 } from "uuid"

interface Employee {
  id: string
  user: {
    full_name: string
  }
}

interface IngredientAttributes {
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

interface ImportIngredient {
  ingredient: {
    id: string
    name: string
    unit: string
  }
  quantity: number
  total_price: number
}

interface InventoryImportAttributes {
  id: string
  reason?: string
  total_price: number
  employee_id?: string
  employee?: Employee | null
  supplier_id?: string
  supplier?: Supplier
  timestamp?: Date
  ingredients?: ImportIngredient[]
}

interface InventoryImportIngredientAttributes {
  id: string
  ingredient_id?: string
  quantity: number
  total_price: number
  inventory_imports_id?: string
  ingredient?: {
    id: string
    name: string
    unit: string
  }
}

interface Supplier {
  id: string
  name: string
  email?: string
  contact?: string
  address?: string
}

interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export function ImportManagement() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [ingredients, setIngredients] = useState<IngredientAttributes[]>([])
  const [imports, setImports] = useState<PaginationResult<InventoryImportAttributes>>()
  const [selectedImport, setSelectedImport] = useState<InventoryImportAttributes | undefined>()
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [selectedIngredients, setSelectedIngredients] = useState<InventoryImportIngredientAttributes[]>([])
  const [totalImportPrice, setTotalImportPrice] = useState(0)
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [reason, setReason] = useState("")

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ingredientErrors, setIngredientErrors] = useState<Record<number, Record<string, string>>>({})

  useEffect(() => {
    loadSuppliers()
    loadIngredients()
    loadImports(1)
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await employeeApi.getAllNoPaging()
      setEmployees(response as any || [])
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên")
    }
  }

  const loadSuppliers = async () => {
    try {
      const response = await supplierService.getAllNoPaging()
      setSuppliers(response as any || [])
    } catch (error) {
      toast.error("Không thể tải danh sách nhà cung cấp")
    }
  }

  const loadIngredients = async () => {
    try {
      const response = await ingredientService.getAllNoPaging()
      setIngredients(response as any || [])
    } catch (error) {
      toast.error("Không thể tải danh sách nguyên liệu")
    }
  }

  const loadImports = async (page: number) => {
    try {
      const response = await inventoryImportService.getAll({
        page,
        limit: 10,
        sortBy: 'timestamp',
        sortOrder: 'DESC'
      })
      const data = response.data || []
      setImports({
        items: data,
        total: data.length,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      })
      setCurrentPage(page)
    } catch (error) {
      toast.error("Không thể tải lịch sử nhập hàng")
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedSupplier) {
      newErrors.supplier = "Vui lòng chọn nhà cung cấp"
    }

    if (selectedIngredients.length === 0) {
      newErrors.ingredients = "Phải có ít nhất 1 nguyên liệu"
    }

    const newIngErrors: Record<number, Record<string, string>> = {}

    selectedIngredients.forEach((ing, index) => {
      const err: Record<string, string> = {}

      if (!ing.ingredient_id) {
        err.ingredient = "Vui lòng chọn nguyên liệu"
      }
      if (!ing.quantity || ing.quantity <= 0) {
        err.quantity = "Số lượng phải > 0"
      }
      if (!ing.total_price || ing.total_price <= 0) {
        err.total_price = "Thành tiền phải > 0"
      }

      if (Object.keys(err).length > 0) {
        newIngErrors[index] = err
      }
    })

    setErrors(newErrors)
    setIngredientErrors(newIngErrors)

    if (Object.keys(newErrors).length > 0 || Object.keys(newIngErrors).length > 0) {
      const firstError = Object.values(newErrors)[0] || "Vui lòng kiểm tra lại các trường"
      toast.error(firstError)
      return false
    }

    return true
  }

  const resetForm = () => {
    setSelectedIngredients([])
    setTotalImportPrice(0)
    setSelectedSupplier("")
    setSelectedEmployee("")
    setReason("")
    setSelectedImport(undefined)
    setErrors({})
    setIngredientErrors({})
  }

  const handleCreateImport = async () => {
    if (!validateForm()) return

    const id = uuidv4()
    try {
      const importData = {
        id,
        reason: reason.trim() || "Nhập hàng",
        supplier_id: selectedSupplier,
        employee_id: selectedEmployee === "none" ? null : selectedEmployee,
        total_price: totalImportPrice,
        ingredients: selectedIngredients.map(ing => ({
          id: uuidv4(),
          ingredient_id: ing.ingredient_id!,
          quantity: ing.quantity,
          total_price: ing.total_price
        }))
      }

      await inventoryImportService.create(importData)
      await inventoryImportService.addIngredients({
        inventory_imports_id: id,
        ingredients: importData.ingredients
      })

      toast.success("Tạo phiếu nhập hàng thành công")
      setIsImportDialogOpen(false)
      loadImports(currentPage)
      resetForm()
    } catch (error: any) {
      toast.error(error?.message || "Không thể tạo phiếu nhập hàng")
    }
  }

  const handleUpdateImport = async () => {
    if (!selectedImport || !validateForm()) return

    try {
      const calculatedTotal = selectedIngredients.reduce((sum, ing) => sum + ing.total_price, 0)

      const importData = {
        reason: reason.trim() || "Nhập hàng",
        supplier_id: selectedSupplier,
        employee_id: selectedEmployee === "none" ? null : selectedEmployee,
        total_price: calculatedTotal
      }

      await inventoryImportService.update(selectedImport.id, importData)

      const ingredients = selectedIngredients.map(ing => ({
        id: ing.id,
        ingredient_id: ing.ingredient_id!,
        quantity: ing.quantity,
        total_price: ing.total_price
      }))

      await inventoryImportService.updateInventoryIngredients(selectedImport.id, ingredients)

      toast.success("Cập nhật phiếu nhập hàng thành công")
      setIsEditDialogOpen(false)
      loadImports(currentPage)
      resetForm()
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật phiếu nhập hàng")
    }
  }

  const handleDeleteImport = async () => {
    if (!selectedImport) return
    try {
      await inventoryImportService.remove(selectedImport.id)
      toast.success("Xóa phiếu nhập hàng thành công")
      setIsDeleteDialogOpen(false)
      loadImports(currentPage)
      setSelectedImport(undefined)
    } catch (error) {
      toast.error("Không thể xóa phiếu nhập hàng")
    }
  }

  const handleEdit = async (importRecord: InventoryImportAttributes) => {
    try {
      const resp = await inventoryImportService.getById(importRecord.id)
      const data = resp as any

      setSelectedImport(data)
      setReason(data.reason || "")
      setSelectedSupplier(data.supplier_id || data.supplier?.id || "")
      setSelectedEmployee(data.employee_id || data.employee?.id || "none")
      setTotalImportPrice(data.total_price || 0)

      if (data.ingredients) {
        setSelectedIngredients(
          data.ingredients.map((ing: any) => ({
            id: ing.id || uuidv4(),
            ingredient_id: ing.ingredient?.id || ing.ingredient_id || "",
            quantity: Number(ing.quantity) || 0,
            total_price: Number(ing.total_price) || 0
          }))
        )
      }

      setErrors({})
      setIngredientErrors({})
      setIsEditDialogOpen(true)
    } catch (error) {
      toast.error("Không thể tải chi tiết phiếu nhập")
    }
  }

  const loadImportDetail = async (id: string) => {
    try {
      setIsLoadingDetail(true)
      const resp = await inventoryImportService.getById(id)
      setSelectedImport(resp as any)
      setIsDetailDialogOpen(true)
    } catch (error) {
      toast.error("Không thể tải chi tiết phiếu nhập")
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const getPageNumbers = () => {
    if (!imports) return []
    const totalPages = imports.totalPages
    const maxPagesToShow = 5
    const pages: (number | string)[] = []
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    if (startPage > 1) {
      pages.unshift('...')
      pages.unshift(1)
    }
    if (endPage < totalPages) {
      pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const handleOpenImportDialog = () => {
    resetForm()
    setIsImportDialogOpen(true)
  }

  const updateIngredient = (index: number, field: keyof InventoryImportIngredientAttributes, value: any) => {
    const newIngredients = [...selectedIngredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }

    if (field === "total_price") {
      const total = newIngredients.reduce((sum, ing) => sum + (Number(ing.total_price) || 0), 0)
      setTotalImportPrice(total)
    }

    setSelectedIngredients(newIngredients)

    // Clear error on change
    const newIngErrors = { ...ingredientErrors }
    if (newIngErrors[index]) {
      delete newIngErrors[index][field]
      if (Object.keys(newIngErrors[index]).length === 0) {
        delete newIngErrors[index]
      }
    }
    setIngredientErrors(newIngErrors)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={handleOpenImportDialog}>
              <Package className="h-4 w-4 mr-2" />
              Nhập hàng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nhập hàng mới</DialogTitle>
              <DialogDescription>Tạo phiếu nhập hàng mới</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="import-reason">Lý do nhập</Label>
                  <Input
                    id="import-reason"
                    placeholder="Nhập hàng định kỳ"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="supplier">Nhà cung cấp *</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier && <p className="text-sm text-red-500">{errors.supplier}</p>}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="employee">Nhân viên</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhân viên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không chọn</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Nguyên liệu nhập *</Label>
                {errors.ingredients && <p className="text-sm text-red-500 -mt-2">{errors.ingredients}</p>}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 text-sm font-medium">
                    <span>Nguyên liệu</span>
                    <span>Số lượng</span>
                    <span>Thành tiền</span>
                    <span></span>
                  </div>
                  {selectedIngredients.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 items-start">
                      <div className="space-y-1">
                        <Select
                          value={item.ingredient_id || ""}
                          onValueChange={(value) => updateIngredient(index, "ingredient_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn nguyên liệu" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ingredient) => (
                              <SelectItem key={ingredient.id} value={ingredient.id}>
                                {ingredient.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {ingredientErrors[index]?.ingredient && (
                          <p className="text-sm text-red-500">{ingredientErrors[index].ingredient}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="number"
                          min="1"
                          placeholder="SL"
                          value={item.quantity || ""}
                          onChange={(e) => updateIngredient(index, "quantity", Number(e.target.value) || 0)}
                        />
                        {ingredientErrors[index]?.quantity && (
                          <p className="text-sm text-red-500">{ingredientErrors[index].quantity}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Tiền"
                          value={item.total_price || ""}
                          onChange={(e) => updateIngredient(index, "total_price", Number(e.target.value) || 0)}
                        />
                        {ingredientErrors[index]?.total_price && (
                          <p className="text-sm text-red-500">{ingredientErrors[index].total_price}</p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newIngredients = selectedIngredients.filter((_, i) => i !== index)
                          setSelectedIngredients(newIngredients)
                          setTotalImportPrice(newIngredients.reduce((sum, i) => sum + (i.total_price || 0), 0))
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedIngredients([
                        ...selectedIngredients,
                        { id: uuidv4(), quantity: 0, total_price: 0, ingredient_id: "" }
                      ])
                    }}
                  >
                    + Thêm nguyên liệu
                  </Button>
                </div>
                <div className="text-right font-bold text-lg">
                  Tổng cộng: {totalImportPrice.toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateImport}>Tạo phiếu nhập</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen && !isLoadingDetail} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          {isLoadingDetail ? (
            <div className="py-8 text-center">Đang tải...</div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết phiếu nhập</DialogTitle>
                <DialogDescription>
                  Phiếu #{selectedImport?.id} - {selectedImport?.reason || "Không có lý do"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ngày nhập</Label>
                    <div>{selectedImport?.timestamp ? new Date(selectedImport.timestamp).toLocaleDateString("vi-VN") : "-"}</div>
                  </div>
                  <div>
                    <Label>Tổng tiền</Label>
                    <div className="font-bold">
                      {(selectedImport?.total_price || 0).toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                </div>
                {selectedImport?.supplier && (
                  <div>
                    <Label>Nhà cung cấp</Label>
                    <div className="text-sm space-y-1">
                      <div><strong>{selectedImport.supplier.name}</strong></div>
                      {selectedImport.supplier.contact && <div>SĐT: {selectedImport.supplier.contact}</div>}
                    </div>
                  </div>
                )}
                <div>
                  <Label>Nhân viên</Label>
                  <div>{selectedImport?.employee?.user.full_name || "Không có"}</div>
                </div>
                <div>
                  <Label>Danh sách nguyên liệu</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>SL</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedImport?.ingredients?.length ? (
                        selectedImport.ingredients.map((ing: any) => (
                          <TableRow key={ing.id}>
                            <TableCell>{ing.ingredient?.name || "-"}</TableCell>
                            <TableCell>{ing.quantity || 0}</TableCell>
                            <TableCell>{ing.ingredient?.unit || "-"}</TableCell>
                            <TableCell>{(ing.total_price || 0).toLocaleString("vi-VN")}đ</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Không có nguyên liệu
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phiếu nhập #{selectedImport?.id}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImport}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phiếu nhập</DialogTitle>
            <DialogDescription>Phiếu #{selectedImport?.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label>Lý do nhập</Label>
                <Input
                  placeholder="Nhập hàng định kỳ"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label>Nhà cung cấp *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplier && <p className="text-sm text-red-500">{errors.supplier}</p>}
              </div>
              <div className="grid gap-1">
                <Label>Nhân viên</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.user.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Nguyên liệu nhập *</Label>
              {errors.ingredients && <p className="text-sm text-red-500 -mt-2">{errors.ingredients}</p>}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 text-sm font-medium">
                  <span>Nguyên liệu</span>
                  <span>Số lượng</span>
                  <span>Thành tiền</span>
                  <span></span>
                </div>
                {selectedIngredients.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 items-start">
                    <div className="space-y-1">
                      <Select
                        value={item.ingredient_id || ""}
                        onValueChange={(v) => updateIngredient(index, "ingredient_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {ingredientErrors[index]?.ingredient && (
                        <p className="text-sm text-red-500">{ingredientErrors[index].ingredient}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        onChange={(e) => updateIngredient(index, "quantity", Number(e.target.value) || 0)}
                      />
                      {ingredientErrors[index]?.quantity && (
                        <p className="text-sm text-red-500">{ingredientErrors[index].quantity}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Input
                        type="number"
                        min="1"
                        value={item.total_price || ""}
                        onChange={(e) => updateIngredient(index, "total_price", Number(e.target.value) || 0)}
                      />
                      {ingredientErrors[index]?.total_price && (
                        <p className="text-sm text-red-500">{ingredientErrors[index].total_price}</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const filtered = selectedIngredients.filter((_, i) => i !== index)
                        setSelectedIngredients(filtered)
                        setTotalImportPrice(filtered.reduce((s, i) => s + (i.total_price || 0), 0))
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedIngredients([
                      ...selectedIngredients,
                      { id: uuidv4(), quantity: 0, total_price: 0, ingredient_id: "" }
                    ])
                  }}
                >
                  + Thêm nguyên liệu
                </Button>
              </div>
              <div className="text-right font-bold text-lg">
                Tổng: {totalImportPrice.toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateImport}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nhập hàng</CardTitle>
          <CardDescription>Theo dõi các lần nhập hàng vào kho</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiếu</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Ngày nhập</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(imports?.items || []).map((imp) => (
                <TableRow key={imp.id}>
                  <TableCell className="font-medium">#{imp.id}</TableCell>
                  <TableCell>{imp.reason || "Nhập hàng"}</TableCell>
                  <TableCell>{imp.timestamp ? new Date(imp.timestamp).toLocaleDateString("vi-VN") : "-"}</TableCell>
                  <TableCell className="font-medium">{(imp.total_price || 0).toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>{imp.employee?.user?.full_name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => loadImportDetail(imp.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(imp)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedImport(imp)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {imports && imports.totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => imports.hasPrevious && loadImports(currentPage - 1)}
                      className={!imports.hasPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, i) => (
                    <PaginationItem key={i}>
                      {page === '...' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => typeof page === 'number' && loadImports(page)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => imports.hasNext && loadImports(currentPage + 1)}
                      className={!imports.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}