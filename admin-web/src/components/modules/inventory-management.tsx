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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit, AlertTriangle, Package } from "lucide-react"

interface Ingredient {
  id: number
  name: string
  unit: string
  current_stock: number
  min_stock_level: number
  max_stock_level: number
  unit_price: number
  supplier_id?: number
  supplier_name?: string
  category: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

interface InventoryImport {
  id: number
  reason: string
  total_price: number
  employee_id: number
  employee_name: string
  supplier_id?: number
  supplier_name?: string
  import_date: string
  status: "pending" | "completed" | "cancelled"
  items: ImportItem[]
}

interface ImportItem {
  ingredient_id: number
  ingredient_name: string
  quantity: number
  unit_price: number
  total_price: number
}

const mockIngredients: Ingredient[] = [
  {
    id: 1,
    name: "Thịt bò",
    unit: "kg",
    current_stock: 15,
    min_stock_level: 10,
    max_stock_level: 50,
    unit_price: 350000,
    supplier_id: 1,
    supplier_name: "Công ty Thịt Sạch ABC",
    category: "Thịt",
    expiry_date: "2024-03-25",
    created_at: "2024-01-15",
    updated_at: "2024-03-20",
  },
  {
    id: 2,
    name: "Bánh phở",
    unit: "kg",
    current_stock: 25,
    min_stock_level: 20,
    max_stock_level: 100,
    unit_price: 25000,
    supplier_id: 2,
    supplier_name: "Nhà máy Bánh Phở Hà Nội",
    category: "Tinh bột",
    created_at: "2024-01-15",
    updated_at: "2024-03-19",
  },
  {
    id: 3,
    name: "Hành lá",
    unit: "kg",
    current_stock: 3,
    min_stock_level: 5,
    max_stock_level: 20,
    unit_price: 15000,
    supplier_id: 3,
    supplier_name: "Nông trại Xanh",
    category: "Rau củ",
    expiry_date: "2024-03-22",
    created_at: "2024-01-15",
    updated_at: "2024-03-20",
  },
  {
    id: 4,
    name: "Tôm",
    unit: "kg",
    current_stock: 8,
    min_stock_level: 5,
    max_stock_level: 30,
    unit_price: 450000,
    supplier_id: 4,
    supplier_name: "Hải sản Miền Trung",
    category: "Hải sản",
    expiry_date: "2024-03-21",
    created_at: "2024-02-01",
    updated_at: "2024-03-20",
  },
  {
    id: 5,
    name: "Cà phê",
    unit: "kg",
    current_stock: 12,
    min_stock_level: 8,
    max_stock_level: 40,
    unit_price: 180000,
    supplier_id: 5,
    supplier_name: "Cà phê Buôn Ma Thuột",
    category: "Đồ uống",
    created_at: "2024-02-15",
    updated_at: "2024-03-18",
  },
]

const mockImports: InventoryImport[] = [
  {
    id: 1,
    reason: "Nhập hàng định kỳ",
    total_price: 5500000,
    employee_id: 1,
    employee_name: "Nguyễn Văn A",
    supplier_id: 1,
    supplier_name: "Công ty Thịt Sạch ABC",
    import_date: "2024-03-20",
    status: "completed",
    items: [
      { ingredient_id: 1, ingredient_name: "Thịt bò", quantity: 10, unit_price: 350000, total_price: 3500000 },
      { ingredient_id: 4, ingredient_name: "Tôm", quantity: 5, unit_price: 450000, total_price: 2250000 },
    ],
  },
  {
    id: 2,
    reason: "Bổ sung nguyên liệu thiếu",
    total_price: 800000,
    employee_id: 2,
    employee_name: "Trần Thị B",
    supplier_id: 3,
    supplier_name: "Nông trại Xanh",
    import_date: "2024-03-19",
    status: "pending",
    items: [
      { ingredient_id: 3, ingredient_name: "Hành lá", quantity: 10, unit_price: 15000, total_price: 150000 },
      { ingredient_id: 2, ingredient_name: "Bánh phở", quantity: 25, unit_price: 25000, total_price: 625000 },
    ],
  },
]

export function InventoryManagement() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(mockIngredients)
  const [imports] = useState<InventoryImport[]>(mockImports)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || ingredient.category === categoryFilter

    let matchesStock = true
    if (stockFilter === "low") {
      matchesStock = ingredient.current_stock <= ingredient.min_stock_level
    } else if (stockFilter === "out") {
      matchesStock = ingredient.current_stock === 0
    }

    return matchesSearch && matchesCategory && matchesStock
  })

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.current_stock === 0) {
      return <Badge className="bg-red-100 text-red-800">Hết hàng</Badge>
    } else if (ingredient.current_stock <= ingredient.min_stock_level) {
      return <Badge className="bg-yellow-100 text-yellow-800">Sắp hết</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Đủ hàng</Badge>
    }
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  const categories = [...new Set(ingredients.map((i) => i.category))]
  const lowStockItems = ingredients.filter((i) => i.current_stock <= i.min_stock_level)
  const outOfStockItems = ingredients.filter((i) => i.current_stock === 0)
  const expiringItems = ingredients.filter((i) => isExpiringSoon(i.expiry_date))

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng nguyên liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredients.length}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sắp hết hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringItems.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Kho nguyên liệu</TabsTrigger>
          <TabsTrigger value="imports">Lịch sử nhập hàng</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Header Actions */}
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

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="low">Sắp hết</SelectItem>
                  <SelectItem value="out">Hết hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
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
                        <Input id="import-reason" placeholder="Nhập hàng định kỳ" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="supplier">Nhà cung cấp</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn nhà cung cấp" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Công ty Thịt Sạch ABC</SelectItem>
                            <SelectItem value="2">Nhà máy Bánh Phở Hà Nội</SelectItem>
                            <SelectItem value="3">Nông trại Xanh</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Nguyên liệu nhập</Label>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-4 gap-2 text-sm font-medium">
                          <span>Nguyên liệu</span>
                          <span>Số lượng</span>
                          <span>Đơn giá</span>
                          <span>Thành tiền</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nguyên liệu" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((ingredient) => (
                                <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                                  {ingredient.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input type="number" placeholder="0" />
                          <Input type="number" placeholder="0" />
                          <Input type="number" placeholder="0" disabled />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Tạo phiếu nhập</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm nguyên liệu
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Thêm nguyên liệu mới</DialogTitle>
                    <DialogDescription>Thêm nguyên liệu mới vào kho</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ingredient-name">Tên nguyên liệu</Label>
                      <Input id="ingredient-name" placeholder="Nhập tên nguyên liệu" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="unit">Đơn vị</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn đơn vị" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilogram</SelectItem>
                            <SelectItem value="g">Gram</SelectItem>
                            <SelectItem value="l">Lít</SelectItem>
                            <SelectItem value="ml">Mililít</SelectItem>
                            <SelectItem value="cái">Cái</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Danh mục</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Thịt">Thịt</SelectItem>
                            <SelectItem value="Hải sản">Hải sản</SelectItem>
                            <SelectItem value="Rau củ">Rau củ</SelectItem>
                            <SelectItem value="Tinh bột">Tinh bột</SelectItem>
                            <SelectItem value="Đồ uống">Đồ uống</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="min-stock">Tồn kho tối thiểu</Label>
                        <Input id="min-stock" type="number" placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="unit-price">Đơn giá</Label>
                        <Input id="unit-price" type="number" placeholder="0" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Thêm nguyên liệu</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Alerts */}
          {(lowStockItems.length > 0 || expiringItems.length > 0) && (
            <div className="space-y-2">
              {lowStockItems.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Có {lowStockItems.length} nguyên liệu sắp hết hàng</span>
                </div>
              )}
              {expiringItems.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-orange-800">Có {expiringItems.length} nguyên liệu sắp hết hạn</span>
                </div>
              )}
            </div>
          )}

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách nguyên liệu</CardTitle>
              <CardDescription>Quản lý kho nguyên liệu ({filteredIngredients.length} nguyên liệu)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên nguyên liệu</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Hạn sử dụng</TableHead>
                    <TableHead>Nhà cung cấp</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ingredient.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              ingredient.current_stock <= ingredient.min_stock_level ? "text-red-600 font-medium" : ""
                            }
                          >
                            {ingredient.current_stock}
                          </span>
                          <span className="text-muted-foreground text-sm">/ {ingredient.min_stock_level} min</span>
                        </div>
                      </TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell>{getStockStatus(ingredient)}</TableCell>
                      <TableCell>{ingredient.unit_price.toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>
                        {ingredient.expiry_date ? (
                          <div className={isExpiringSoon(ingredient.expiry_date) ? "text-orange-600" : ""}>
                            {new Date(ingredient.expiry_date).toLocaleDateString("vi-VN")}
                            {isExpiringSoon(ingredient.expiry_date) && (
                              <Badge className="ml-2 bg-orange-100 text-orange-800">Sắp hết hạn</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Không có</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{ingredient.supplier_name || "Chưa có"}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-6">
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
                    <TableHead>Nhà cung cấp</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Ngày nhập</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((importRecord) => (
                    <TableRow key={importRecord.id}>
                      <TableCell className="font-medium">#{importRecord.id}</TableCell>
                      <TableCell>{importRecord.reason}</TableCell>
                      <TableCell>{importRecord.supplier_name || "Nhiều nhà cung cấp"}</TableCell>
                      <TableCell>{importRecord.employee_name}</TableCell>
                      <TableCell>{new Date(importRecord.import_date).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell className="font-medium">{importRecord.total_price.toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            importRecord.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : importRecord.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {importRecord.status === "completed"
                            ? "Hoàn thành"
                            : importRecord.status === "pending"
                              ? "Đang xử lý"
                              : "Đã hủy"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
