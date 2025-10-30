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
  const [selectedIngredients, setSelectedIngredients] = useState<InventoryImportIngredientAttributes[]>([])
  const [totalImportPrice, setTotalImportPrice] = useState(0)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [ingredients, setIngredients] = useState<IngredientAttributes[]>([])
  const [imports, setImports] = useState<PaginationResult<InventoryImportAttributes>>()
  const [selectedImport, setSelectedImport] = useState<InventoryImportAttributes | undefined>()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [reason, setReason] = useState("")

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

  const handleCreateImport = async () => {
    if (!selectedIngredients.length) {
      toast.error("Vui lòng thêm ít nhất một nguyên liệu")
      return
    }
    if (!selectedSupplier) {
      toast.error("Vui lòng chọn nhà cung cấp")
      return
    }
    if (selectedIngredients.some(ing => !ing.ingredient_id)) {
      toast.error("Vui lòng chọn nguyên liệu cho tất cả các mục")
      return
    }
    const id = uuidv4()
    try {
      const importData = {
        id,
        reason,
        supplier_id: selectedSupplier,
        employee_id: selectedEmployee === "none" ? null : selectedEmployee,
        total_price: 0,
        ingredients: selectedIngredients.map(ing => ({
          id: ing.id,
          ingredient_id: ing.ingredient_id!,
          quantity: Number(ing.quantity) || 0,
          total_price: Number(ing.total_price) || 0
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
    } catch (error) {
      console.error('Create error:', error)
      toast.error("Không thể tạo phiếu nhập hàng")
    }
  }

  const handleUpdateImport = async () => {
    if (!selectedImport) return
    if (!selectedIngredients.length) {
      toast.error("Vui lòng thêm ít nhất một nguyên liệu")
      return
    }
    if (!selectedSupplier) {
      toast.error("Vui lòng chọn nhà cung cấp")
      return
    }
    if (selectedIngredients.some(ing => !ing.ingredient_id)) {
      toast.error("Vui lòng chọn nguyên liệu cho tất cả các mục")
      return
    }
    try {
      const calculatedTotalPrice = selectedIngredients.reduce((sum, ing) => sum + Number(ing.total_price || 0), 0)
      const importData = {
        reason,
        supplier_id: selectedSupplier,
        employee_id: selectedEmployee === "none" ? null : selectedEmployee,
        total_price: calculatedTotalPrice
      }
      await inventoryImportService.update(selectedImport.id, importData)
      const ingredients = selectedIngredients.map(ing => ({
        id: ing.id,
        ingredient_id: ing.ingredient_id!,
        quantity: Number(ing.quantity) || 0,
        total_price: Number(ing.total_price) || 0
      }))
      await inventoryImportService.updateInventoryIngredients(selectedImport.id, ingredients)
      toast.success("Cập nhật phiếu nhập hàng thành công")
      setIsEditDialogOpen(false)
      loadImports(currentPage)
      resetForm()
    } catch (error) {
      console.error('Update error:', error)
      toast.error("Không thể cập nhật phiếu nhập hàng")
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

  const resetForm = () => {
    setSelectedIngredients([])
    setTotalImportPrice(0)
    setSelectedSupplier("")
    setSelectedEmployee("")
    setReason("")
    setSelectedImport(undefined)
  }

  const handleEdit = (importRecord: InventoryImportAttributes) => {
    (async () => {
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
              id: ing.id ?? crypto.randomUUID(),
              ingredient_id: ing.ingredient?.id ?? ing.ingredient_id ?? "",
              quantity: Number(ing.quantity) || 0,
              total_price: Number(ing.total_price) || 0
            }))
          )
        }
        setIsEditDialogOpen(true)
      } catch (error) {
        toast.error("Không thể tải chi tiết phiếu nhập")
      }
    })()
  }

  const loadImportDetail = async (id: string) => {
    try {
      setIsLoadingDetail(true)
      const resp = await inventoryImportService.getById(id)
      const data = resp as any
      setSelectedImport(data)
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nhập hàng mới</DialogTitle>
              <DialogDescription>Tạo phiếu nhập hàng mới</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="import-reason">Lý do nhập</Label>
                  <Input
                    id="import-reason"
                    placeholder="Nhập hàng định kỳ"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier">Nhà cung cấp</Label>
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
                </div>
                <div className="grid gap-2">
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
                <Label>Nguyên liệu nhập</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm font-medium">
                    <span>Nguyên liệu</span>
                    <span>Số lượng</span>
                    <span>Thành tiền</span>
                  </div>
                  {selectedIngredients.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-3 gap-2 items-center">
                      <Select
                        value={item.ingredient_id || ""}
                        onValueChange={(value) => {
                          const newIngredients = [...selectedIngredients]
                          newIngredients[index] = { ...item, ingredient_id: value }
                          setSelectedIngredients(newIngredients)
                        }}
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
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity !== undefined ? item.quantity : ""}
                        onChange={(e) => {
                          const newIngredients = [...selectedIngredients]
                          const quantity = Number(e.target.value) || 0
                          newIngredients[index] = { ...item, quantity }
                          setSelectedIngredients(newIngredients)
                        }}
                      />
                      <Input
                        type="number"
                        min="0"
                        value={item.total_price !== undefined ? item.total_price : ""}
                        onChange={(e) => {
                          const newIngredients = [...selectedIngredients]
                          const total_price = Number(e.target.value) || 0
                          newIngredients[index] = { ...item, total_price }
                          setSelectedIngredients(newIngredients)
                          setTotalImportPrice(newIngredients.reduce((sum, i) => sum + Number(i.total_price || 0), 0))
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedIngredients([
                        ...selectedIngredients,
                        { id: crypto.randomUUID(), quantity: 0, total_price: 0, ingredient_id: "" }
                      ])
                    }}
                  >
                    + Thêm nguyên liệu
                  </Button>
                </div>
                <div className="text-right font-medium">
                  Tổng cộng: {totalImportPrice.toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateImport}>Tạo phiếu nhập</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isDetailDialogOpen && !isLoadingDetail} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          {isLoadingDetail ? (
            <div>Loading...</div>
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
                    <div>
                      {(selectedImport?.total_price || 0).toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                </div>
                {selectedImport?.supplier && (
                  <div className="grid grid-cols-1 gap-2">
                    <Label>Nhà cung cấp:</Label>
                    <div className="text-sm">
                      <span className="font-medium">Tên: {selectedImport.supplier.name}</span>
                      {selectedImport.supplier.contact && <div>SĐT: {selectedImport.supplier.contact}</div>}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2">
                  <Label>Nhân viên:</Label>
                  <div className="text-sm">
                    <span className="font-medium">{selectedImport?.employee?.user.full_name || "Không có nhân viên"}</span>
                  </div>
                </div>
                <div>
                  <Label>Danh sách nguyên liệu</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên nguyên liệu</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedImport?.ingredients?.length ? (
                        selectedImport.ingredients.map((ingredientItem) => (
                          <TableRow key={ingredientItem.ingredient.id}>
                            <TableCell>{ingredientItem.ingredient.name || "-"}</TableCell>
                            <TableCell>{ingredientItem.quantity || 0}</TableCell>
                            <TableCell>{ingredientItem.ingredient.unit || "-"}</TableCell>
                            <TableCell>{(ingredientItem.total_price || 0).toLocaleString("vi-VN")}đ</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4}>Không có nguyên liệu</TableCell>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phiếu nhập #{selectedImport?.id}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImport}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phiếu nhập</DialogTitle>
            <DialogDescription>Cập nhật thông tin phiếu nhập hàng #{selectedImport?.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-reason">Lý do nhập</Label>
                <Input
                  id="edit-reason"
                  placeholder="Nhập hàng định kỳ"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-supplier">Nhà cung cấp</Label>
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
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-employee">Nhân viên</Label>
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
              <Label>Nguyên liệu nhập</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 text-sm font-medium">
                  <span>Nguyên liệu</span>
                  <span>Số lượng</span>
                  <span>Thành tiền</span>
                  <span></span>
                </div>
                {selectedIngredients.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_50px] gap-2 items-center">
                    <Select
                      value={item.ingredient_id || ""}
                      onValueChange={(value) => {
                        const newIngredients = [...selectedIngredients]
                        newIngredients[index] = { ...item, ingredient_id: value }
                        setSelectedIngredients(newIngredients)
                      }}
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
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity !== undefined ? item.quantity : ""}
                      onChange={(e) => {
                        const newIngredients = [...selectedIngredients]
                        const quantity = Number(e.target.value) || 0
                        newIngredients[index] = { ...item, quantity }
                        setSelectedIngredients(newIngredients)
                      }}
                    />
                    <Input
                      type="number"
                      min="0"
                      value={item.total_price !== undefined ? item.total_price : ""}
                      onChange={(e) => {
                        const newIngredients = [...selectedIngredients]
                        const total_price = Number(e.target.value) || 0
                        newIngredients[index] = { ...item, total_price }
                        setSelectedIngredients(newIngredients)
                        setTotalImportPrice(newIngredients.reduce((sum, i) => sum + Number(i.total_price || 0), 0))
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newIngredients = selectedIngredients.filter((_, i) => i !== index)
                        setSelectedIngredients(newIngredients)
                        setTotalImportPrice(newIngredients.reduce((sum, i) => sum + Number(i.total_price || 0), 0))
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedIngredients([
                      ...selectedIngredients,
                      { id: crypto.randomUUID(), quantity: 0, total_price: 0, ingredient_id: "" }
                    ])
                  }}
                >
                  + Thêm nguyên liệu
                </Button>
              </div>
              <div className="text-right font-medium">
                Tổng cộng: {totalImportPrice.toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateImport}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {(imports?.items || []).map((importRecord) => (
                <TableRow key={importRecord.id}>
                  <TableCell className="font-medium">#{importRecord.id}</TableCell>
                  <TableCell>{importRecord.reason || "Nhập hàng"}</TableCell>
                  <TableCell>{importRecord.timestamp ? new Date(importRecord.timestamp).toLocaleDateString("vi-VN") : "-"}</TableCell>
                  <TableCell className="font-medium">{(importRecord.total_price || 0).toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>{importRecord.employee?.user?.full_name || "Không có nhân viên"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadImportDetail(importRecord.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(importRecord)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedImport(importRecord)
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

          {imports && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => imports.hasPrevious && loadImports(currentPage - 1)}
                      className={imports.hasPrevious ? '' : 'pointer-events-none opacity-50'}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === '...' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => loadImports(page as number)}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => imports.hasNext && loadImports(currentPage + 1)}
                      className={imports.hasNext ? '' : 'pointer-events-none opacity-50'}
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