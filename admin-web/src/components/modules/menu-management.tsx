"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { Switch } from "@/components/ui/switch"
import { Search, Plus, Edit, Trash2, Eye, Star, Leaf } from "lucide-react"
import { ImageIcon } from "lucide-react"

interface Dish {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  category_name: string
  media_urls?: string[]
  is_best_seller: boolean
  seasonal: boolean
  active: boolean
  created_at: string
  deleted_at?: string
  ingredients: DishIngredient[]
}

interface DishIngredient {
  ingredient_id: number
  ingredient_name: string
  quantity: number
  unit: string
}

interface Category {
  id: number
  name: string
  description: string
  active: boolean
}

const mockCategories: Category[] = [
  { id: 1, name: "Khai vị", description: "Các món khai vị truyền thống", active: true },
  { id: 2, name: "Món chính", description: "Các món ăn chính", active: true },
  { id: 3, name: "Tráng miệng", description: "Các món tráng miệng", active: true },
  { id: 4, name: "Đồ uống", description: "Nước uống và cocktail", active: true },
]

const mockDishes: Dish[] = [
  {
    id: 1,
    name: "Phở Bò Tái",
    description: "Phở bò truyền thống với thịt bò tái, nước dùng đậm đà",
    price: 85000,
    category_id: 2,
    category_name: "Món chính",
    media_urls: ["/pho-bo-tai.jpg"],
    is_best_seller: true,
    seasonal: false,
    active: true,
    created_at: "2024-01-15",
    ingredients: [
      { ingredient_id: 1, ingredient_name: "Thịt bò", quantity: 200, unit: "g" },
      { ingredient_id: 2, ingredient_name: "Bánh phở", quantity: 150, unit: "g" },
      { ingredient_id: 3, ingredient_name: "Hành lá", quantity: 20, unit: "g" },
    ],
  },
  {
    id: 2,
    name: "Gỏi Cuốn Tôm",
    description: "Gỏi cuốn tươi với tôm, rau sống và bún",
    price: 45000,
    category_id: 1,
    category_name: "Khai vị",
    media_urls: ["/goi-cuon-tom.jpg"],
    is_best_seller: false,
    seasonal: true,
    active: true,
    created_at: "2024-02-01",
    ingredients: [
      { ingredient_id: 4, ingredient_name: "Tôm", quantity: 100, unit: "g" },
      { ingredient_id: 5, ingredient_name: "Bánh tráng", quantity: 3, unit: "cái" },
      { ingredient_id: 6, ingredient_name: "Rau sống", quantity: 50, unit: "g" },
    ],
  },
  {
    id: 3,
    name: "Chè Ba Màu",
    description: "Chè truyền thống với đậu xanh, đậu đỏ và thạch",
    price: 25000,
    category_id: 3,
    category_name: "Tráng miệng",
    is_best_seller: false,
    seasonal: false,
    active: true,
    created_at: "2024-02-15",
    ingredients: [
      { ingredient_id: 7, ingredient_name: "Đậu xanh", quantity: 50, unit: "g" },
      { ingredient_id: 8, ingredient_name: "Đậu đỏ", quantity: 50, unit: "g" },
      { ingredient_id: 9, ingredient_name: "Thạch", quantity: 30, unit: "g" },
    ],
  },
  {
    id: 4,
    name: "Cà Phê Sữa Đá",
    description: "Cà phê phin truyền thống với sữa đặc",
    price: 30000,
    category_id: 4,
    category_name: "Đồ uống",
    is_best_seller: true,
    seasonal: false,
    active: false,
    created_at: "2024-03-01",
    deleted_at: "2024-03-15",
    ingredients: [
      { ingredient_id: 10, ingredient_name: "Cà phê", quantity: 20, unit: "g" },
      { ingredient_id: 11, ingredient_name: "Sữa đặc", quantity: 30, unit: "ml" },
    ],
  },
]

export function MenuManagement() {
  const [dishes, setDishes] = useState<Dish[]>(mockDishes)
  const [categories] = useState<Category[]>(mockCategories)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch =
      dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || dish.category_id.toString() === categoryFilter
    const matchesActive = showInactive ? true : dish.active && !dish.deleted_at

    return matchesSearch && matchesCategory && matchesActive
  })

  const handleToggleActive = (dishId: number) => {
    setDishes(dishes.map((dish) => (dish.id === dishId ? { ...dish, active: !dish.active } : dish)))
  }

  const handleToggleBestSeller = (dishId: number) => {
    setDishes(dishes.map((dish) => (dish.id === dishId ? { ...dish, is_best_seller: !dish.is_best_seller } : dish)))
  }

  const handleDeleteDish = (dishId: number) => {
    setDishes(
      dishes.map((dish) =>
        dish.id === dishId ? { ...dish, deleted_at: new Date().toISOString().split("T")[0], active: false } : dish,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dishes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dishes">Quản lý món ăn</TabsTrigger>
          <TabsTrigger value="categories">Quản lý danh mục</TabsTrigger>
        </TabsList>

        <TabsContent value="dishes" className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm món ăn..."
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
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant={showInactive ? "default" : "outline"} onClick={() => setShowInactive(!showInactive)}>
                {showInactive ? "Ẩn không hoạt động" : "Hiện không hoạt động"}
              </Button>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm món ăn
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Thêm món ăn mới</DialogTitle>
                  <DialogDescription>Tạo món ăn mới cho thực đơn</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dish-name">Tên món ăn</Label>
                      <Input id="dish-name" placeholder="Nhập tên món ăn" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dish-price">Giá (VNĐ)</Label>
                      <Input id="dish-price" type="number" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dish-description">Mô tả</Label>
                    <Textarea id="dish-description" placeholder="Mô tả món ăn" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dish-category">Danh mục</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch id="best-seller" />
                      <Label htmlFor="best-seller">Món bán chạy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="seasonal" />
                      <Label htmlFor="seasonal">Món theo mùa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="active" defaultChecked />
                      <Label htmlFor="active">Hoạt động</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Tạo món ăn</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Dishes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách món ăn</CardTitle>
              <CardDescription>Quản lý thực đơn nhà hàng ({filteredDishes.length} món ăn)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hình ảnh</TableHead>
                    <TableHead>Tên món</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đặc biệt</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDishes.map((dish) => (
                    <TableRow key={dish.id} className={!dish.active || dish.deleted_at ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          {dish.media_urls && dish.media_urls.length > 0 ? (
                            <img
                              src={dish.media_urls[0] || "/placeholder.svg"}
                              alt={dish.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dish.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{dish.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dish.category_name}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{dish.price.toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {dish.deleted_at ? (
                            <Badge variant="destructive">Đã xóa</Badge>
                          ) : dish.active ? (
                            <Badge variant="secondary">Hoạt động</Badge>
                          ) : (
                            <Badge variant="outline">Tạm dừng</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {dish.is_best_seller && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Bán chạy
                            </Badge>
                          )}
                          {dish.seasonal && (
                            <Badge className="bg-green-100 text-green-800">
                              <Leaf className="h-3 w-3 mr-1" />
                              Theo mùa
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDish(dish)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!dish.deleted_at && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDish(dish)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteDish(dish.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Danh mục món ăn</h3>
              <p className="text-sm text-muted-foreground">Quản lý các danh mục trong thực đơn</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant={category.active ? "secondary" : "outline"}>
                      {category.active ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {dishes.filter((d) => d.category_id === category.id && d.active).length} món ăn
                    </p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Dish Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết món ăn</DialogTitle>
          </DialogHeader>
          {selectedDish && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Tên món ăn</Label>
                    <p className="text-lg font-semibold">{selectedDish.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Mô tả</Label>
                    <p className="text-sm text-muted-foreground">{selectedDish.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Giá</Label>
                      <p className="text-lg font-semibold text-primary">
                        {selectedDish.price.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Danh mục</Label>
                      <Badge variant="outline">{selectedDish.category_name}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedDish.is_best_seller && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Bán chạy
                      </Badge>
                    )}
                    {selectedDish.seasonal && (
                      <Badge className="bg-green-100 text-green-800">
                        <Leaf className="h-3 w-3 mr-1" />
                        Theo mùa
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  {selectedDish.media_urls && selectedDish.media_urls.length > 0 && (
                    <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={selectedDish.media_urls[0] || "/placeholder.svg"}
                        alt={selectedDish.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Nguyên liệu</Label>
                <div className="mt-2 space-y-2">
                  {selectedDish.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">{ingredient.ingredient_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
