"use client"

import { useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Search, Plus, Edit, Trash2, Eye, Star, Leaf, X } from "lucide-react"
import { ImageIcon } from "lucide-react"
import { dishService } from "@/services/dishService"
import { categoryService } from "@/services/categoryService"
import { ingredientService } from "@/services/ingredientService"
import { toast } from "react-toastify"
import { v4 as uuidv4 } from "uuid"

interface Ingredient {
  id: string
  name: string
  unit: string
  barcode?: string
  rfid?: string
  min_stock_level: number
  current_stock: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  DishIngredient?: {
    quantity: number
  }
}

interface Dish {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  category: {
    id: string
    name: string
  }
  media_urls?: string[]
  is_best_seller: boolean
  seasonal: boolean
  active: boolean
  created_at: string
  deleted_at?: string
  ingredients: Ingredient[]
}

interface Category {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DishManagementProps {
  dishes: Dish[]
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  ingredients: Ingredient[]
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>
}

interface PaginationData {
  currentPage: number
  totalPages: number
  total: number
  itemsPerPage: number
}

interface ApiResponse<T> {
  status: string
  data: {
    data: T[]
    pagination: PaginationData
  }
}

export function DishManagement({ dishes, setDishes, categories, setCategories, ingredients, setIngredients }: DishManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDishes, setTotalDishes] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const limit = 10

  const [formData, setFormData] = useState<{
    name: string
    description: string
    price: number
    category_id: string
    is_best_seller: boolean
    seasonal: boolean
    active: boolean
    media_urls: (File | string)[]  // File mới hoặc URL cũ
    ingredients: { ingredient_id: string; quantity: number }[]
  }>({
    name: "",
    description: "",
    price: 0,
    category_id: "",
    is_best_seller: false,
    seasonal: false,
    active: true,
    media_urls: [],
    ingredients: [],
  })

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [newIngredient, setNewIngredient] = useState({ ingredient_id: "", quantity: 0 })

  const getData = async () => {
    setIsLoading(true)
    try {
      const resDish = await dishService.getAll({
        page: currentPage,
        limit,
        sortBy: 'created_at',
        sortOrder: 'ASC'
      })
      const [resCat, resIng] = await Promise.all([
        categoryService.getAll(),
        ingredientService.getAllNoPaging()
      ])

      if (!resDish || !resCat) {
        toast.error("Lấy dữ liệu thất bại")
        return
      }
      setDishes(resDish.data)
      setTotalPages(resDish.pagination.totalPages)
      setTotalDishes(resDish.pagination.total)
      setCategories(resCat.data)
      setIngredients(resIng as any)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Lỗi khi lấy dữ liệu")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getData()
  }, [currentPage])

  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch =
      dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || dish.category_id === categoryFilter
    const matchesActive = showInactive ? true : dish.active && !dish.deleted_at
    return matchesSearch && matchesCategory && matchesActive
  })

  const handleToggleActive = async (dishId: string) => {
    try {
      const dish = dishes.find(d => d.id === dishId)
      if (!dish) return

      await dishService.update(dishId, { active: !dish.active })
      setDishes(dishes.map((d) =>
        d.id === dishId ? { ...d, active: !d.active } : d
      ))
      toast.success("Cập nhật trạng thái món ăn thành công")
    } catch (error) {
      toast.error("Cập nhật trạng thái thất bại")
    }
  }

  const handleToggleBestSeller = async (dishId: string) => {
    try {
      const dish = dishes.find(d => d.id === dishId)
      if (!dish) return

      await dishService.update(dishId, { is_best_seller: !dish.is_best_seller })
      setDishes(dishes.map((d) =>
        d.id === dishId ? { ...d, is_best_seller: !d.is_best_seller } : d
      ))
      toast.success("Cập nhật trạng thái bán chạy thành công")
    } catch (error) {
      toast.error("Cập nhật trạng thái bán chạy thất bại")
    }
  }

  const handleDeleteDish = async (dishId: string) => {
    try {
      await dishService.remove(dishId)
      setDishes(dishes.map((dish) =>
        dish.id === dishId ? {
          ...dish,
          deleted_at: new Date().toISOString().split("T")[0],
          active: false
        } : dish
      ))
      toast.success("Xóa món ăn thành công")
    } catch (error) {
      toast.error("Xóa món ăn thất bại")
    }
  }

  const populateForm = (dish: Dish) => {
    setFormData({
      name: dish.name || "",
      description: dish.description || "",
      price: dish.price || 0,
      category_id: dish.category_id || "",
      is_best_seller: !!dish.is_best_seller,
      seasonal: !!dish.seasonal,
      active: !!dish.active,
      media_urls: dish.media_urls ?? [], // giữ URL cũ
      ingredients: dish.ingredients.map(ing => ({
        ingredient_id: ing.id,
        quantity: ing.DishIngredient?.quantity || 0
      })),
    })

    setPreviewImage(dish.media_urls?.[0] || null)
  }

  const addIngredient = () => {
    if (newIngredient.ingredient_id && newIngredient.quantity > 0) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, { ...newIngredient }],
      })
      setNewIngredient({ ingredient_id: "", quantity: 0 })
    }
  }

  const removeIngredient = (index: number) => {
    const updatedIngredients = formData.ingredients.filter((_, i) => i !== index)
    setFormData({ ...formData, ingredients: updatedIngredients })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewImage(url)
      setFormData({ ...formData, media_urls: [file] }) // lưu file
    }
  }

  const handleCreateDish = async () => {
    try {
      const id = uuidv4()
      const file = formData.media_urls[0] as File | undefined

      const formDataToSend = new FormData()
      formDataToSend.append("id", id)
      formDataToSend.append("name", formData.name)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("price", formData.price.toString())
      formDataToSend.append("category_id", formData.category_id)
      formDataToSend.append("is_best_seller", formData.is_best_seller.toString())
      formDataToSend.append("seasonal", formData.seasonal.toString())
      formDataToSend.append("active", formData.active.toString())

      if (file) {
        formDataToSend.append("image", file) // gửi file ảnh
      }

      formData.ingredients.forEach((ing, index) => {
        formDataToSend.append(`ingredients[${index}][ingredient_id]`, ing.ingredient_id)
        formDataToSend.append(`ingredients[${index}][quantity]`, ing.quantity.toString())
      })

      const response = await dishService.create(formDataToSend)

      if (!response || response.data.status === 'existed') {
        toast.error(response?.data.message || "Lỗi khi thêm món ăn")
        return
      }

      getData()
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Tạo món ăn thành công")
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || "Tạo món ăn thất bại")
    }
  }

  const handleUpdateDish = async () => {
    if (!selectedDish) return

    try {
      const formDataToSend = new FormData()
      const currentImage = formData.media_urls[0]

      formDataToSend.append("name", formData.name)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("price", formData.price.toString())
      formDataToSend.append("category_id", formData.category_id)
      formDataToSend.append("is_best_seller", formData.is_best_seller.toString())
      formDataToSend.append("seasonal", formData.seasonal.toString())
      formDataToSend.append("active", formData.active.toString())

      // Gửi file mới nếu có
      if (currentImage && currentImage instanceof File) {
        formDataToSend.append("image", currentImage)
      }
      // Gửi URL cũ nếu không thay đổi ảnh
      else if (typeof currentImage === "string") {
        formDataToSend.append("existing_image_url", currentImage)
      }

      formData.ingredients.forEach((ing, index) => {
        formDataToSend.append(`ingredients[${index}][ingredient_id]`, ing.ingredient_id)
        formDataToSend.append(`ingredients[${index}][quantity]`, ing.quantity.toString())
      })

      await dishService.update(selectedDish.id, formDataToSend)

      getData()
      setIsEditDialogOpen(false)
      resetForm()
      toast.success("Cập nhật món ăn thành công")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cập nhật món ăn thất bại")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category_id: "",
      is_best_seller: false,
      seasonal: false,
      active: true,
      media_urls: [],
      ingredients: [],
    })
    setPreviewImage(null)
    setNewIngredient({ ingredient_id: "", quantity: 0 })
  }

  useEffect(() => {
    if (isCreateDialogOpen) {
      resetForm()
    }
  }, [isCreateDialogOpen])

  useEffect(() => {
    if (isEditDialogOpen && selectedDish) {
      populateForm(selectedDish)
    }
  }, [isEditDialogOpen, selectedDish])

  return (
    <div className="space-y-6">
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
                <SelectItem key={category.id} value={category.id}>
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
                  <Input
                    id="dish-name"
                    placeholder="Nhập tên món ăn"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dish-price">Giá (VNĐ)</Label>
                  <Input
                    id="dish-price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dish-description">Mô tả</Label>
                <Textarea
                  id="dish-description"
                  placeholder="Mô tả món ăn"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dish-category">Danh mục</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Hình ảnh</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {previewImage && (
                  <div className="mt-2 w-48 h-48 bg-muted rounded-lg overflow-hidden">
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Nguyên liệu</Label>
                <div className="flex gap-4">
                  <Select
                    onValueChange={(value) => setNewIngredient({ ...newIngredient, ingredient_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nguyên liệu" />
                    </SelectTrigger>
                    <SelectContent>
                      {(ingredients || []).map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Số lượng"
                    value={newIngredient.quantity || ""}
                    onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                  <Button onClick={addIngredient}>Thêm</Button>
                </div>
                <div className="mt-2 space-y-2">
                  {formData.ingredients.map((ing, index) => {
                    const ingInfo = ingredients.find((i) => i.id === ing.ingredient_id)
                    return (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">{ingInfo?.name || "Nguyên liệu không xác định"} - {ing.quantity} {ingInfo?.unit || ""}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeIngredient(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="best-seller"
                    checked={formData.is_best_seller}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_best_seller: checked })}
                  />
                  <Label htmlFor="best-seller">Món bán chạy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="seasonal"
                    checked={formData.seasonal}
                    onCheckedChange={(checked) => setFormData({ ...formData, seasonal: checked })}
                  />
                  <Label htmlFor="seasonal">Món theo mùa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Hoạt động</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateDish}>Tạo món ăn</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                    <Badge variant="outline">{dish.category?.name || ""}</Badge>
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
          {!isLoading && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Hiển thị {filteredDishes.length} trên tổng số {totalDishes} món ăn
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((old) => Math.max(old - 1, 1));
                  }}
                  disabled={currentPage === 1 || isLoading}
                >
                  Trang trước
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">Trang</span>
                  <span className="text-sm font-medium">{currentPage}</span>
                  <span className="text-sm font-medium">trên</span>
                  <span className="text-sm font-medium">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((old) => Math.min(old + 1, totalPages));
                  }}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa món ăn</DialogTitle>
            <DialogDescription>Cập nhật thông tin món ăn</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dish-name">Tên món ăn</Label>
                <Input
                  id="dish-name"
                  placeholder="Nhập tên món ăn"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dish-price">Giá (VNĐ)</Label>
                <Input
                  id="dish-price"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dish-description">Mô tả</Label>
              <Textarea
                id="dish-description"
                placeholder="Mô tả món ăn"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dish-category">Danh mục</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Hình ảnh</Label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {previewImage && (
                <div className="mt-2 w-48 h-48 bg-muted rounded-lg overflow-hidden">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Nguyên liệu</Label>
              <div className="flex gap-4">
                <Select
                  onValueChange={(value) => setNewIngredient({ ...newIngredient, ingredient_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nguyên liệu" />
                  </SelectTrigger>
                  <SelectContent>
                    {(ingredients || []).map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="any"
                  placeholder="Số lượng"
                  value={newIngredient.quantity || ""}
                  onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
                <Button onClick={addIngredient}>Thêm</Button>
              </div>
              <div className="mt-2 space-y-2">
                {formData.ingredients.map((ing, index) => {
                  const ingInfo = ingredients.find((i) => i.id === ing.ingredient_id)
                  return (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">{ingInfo?.name || "Nguyên liệu không xác định"} - {ing.quantity} {ingInfo?.unit || ""}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeIngredient(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="best-seller"
                  checked={formData.is_best_seller}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_best_seller: checked })}
                />
                <Label htmlFor="best-seller">Món bán chạy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="seasonal"
                  checked={formData.seasonal}
                  onCheckedChange={(checked) => setFormData({ ...formData, seasonal: checked })}
                />
                <Label htmlFor="seasonal">Món theo mùa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Hoạt động</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateDish}>Cập nhật món ăn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                      <Badge variant="outline">{selectedDish.category?.name || ""}</Badge>
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
                  {selectedDish.ingredients && selectedDish.ingredients.length > 0 ? (
                    selectedDish.ingredients.map((ingredient, index) => {
                      return (
                        <div key={index} className="text-sm">
                          {ingredient.name} - {ingredient.DishIngredient?.quantity || 0} {ingredient.unit}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có nguyên liệu</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}