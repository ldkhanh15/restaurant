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
  setDishes: React.Dispatch<React.SetStateAction<any>>
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
    media_urls: (File | string)[]
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

  // ==== VALIDATION: Kiểm tra trùng tên ngay tại FE (client-side) ====
  const validateForm = async (isEdit: boolean = false, currentDishId?: string): Promise<string | null> => {
    if (!formData.name.trim()) return "Tên món ăn không được để trống"
    if (!formData.description.trim()) return "Mô tả không được để trống"
    if (!formData.category_id) return "Vui lòng chọn danh mục"
    if (formData.price <= 0) return "Giá phải lớn hơn 0"
    if (!isEdit && formData.media_urls.length === 0) return "Vui lòng tải lên hình ảnh"
    if (formData.ingredients.length === 0) return "Phải có ít nhất một nguyên liệu"

    for (const ing of formData.ingredients) {
      if (ing.quantity <= 0) return "Số lượng nguyên liệu phải lớn hơn 0"
    }

    // === KIỂM TRA TRÙNG TÊN NGAY TẠI FE ===
    const inputName = formData.name.trim().toLowerCase()
    const duplicate = dishes.find(dish =>
      dish.id !== currentDishId && // Loại trừ món đang edit
      dish.name.trim().toLowerCase() === inputName &&
      !dish.deleted_at // Bỏ qua món đã xóa
    )

    if (duplicate) return `Tên món ăn đã tồn tại`

    return null
  }

  const validateIngredient = (): string | null => {
    if (!newIngredient.ingredient_id) return "Vui lòng chọn nguyên liệu"
    if (newIngredient.quantity <= 0) return "Số lượng phải lớn hơn 0"
    return null
  }

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
      media_urls: dish.media_urls ?? [],
      ingredients: dish.ingredients.map(ing => ({
        ingredient_id: ing.id,
        quantity: ing.DishIngredient?.quantity || 0
      })),
    })

    setPreviewImage(dish.media_urls?.[0] || null)
  }

  const addIngredient = () => {
    const err = validateIngredient()
    if (err) {
      toast.error(err)
      return
    }
    if (formData.ingredients.some(i => i.ingredient_id === newIngredient.ingredient_id)) {
      toast.error("Nguyên liệu đã được thêm")
      return
    }
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ...newIngredient }],
    })
    setNewIngredient({ ingredient_id: "", quantity: 0 })
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
      setFormData({ ...formData, media_urls: [file] })
    }
  }

  // =================== CREATE ===================
  const handleCreateDish = async () => {
    const validationError = await validateForm(false)
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      const id = uuidv4()
      const file = formData.media_urls?.[0] as File | undefined

      const dishData = {
        id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        category_id: formData.category_id,
        media_file: file,
        is_best_seller: formData.is_best_seller,
        seasonal: formData.seasonal,
        active: formData.active,
      }
      const ingredientData = {
        dish_id: id,
        ingredients: formData.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
        })),
      }

      const formDataToSend = new FormData()
      formDataToSend.append("dishData", JSON.stringify(dishData))
      formDataToSend.append("ingredients", JSON.stringify(ingredientData))
      if (file) formDataToSend.append("media_file", file)

      const responseDish = await dishService.create(formDataToSend)
      if (!responseDish) {
        toast.error("Lỗi khi thêm món ăn")
        return
      }
      if ((responseDish.status as any) === 'existed') {
        toast.error(responseDish.message || 'Tên món ăn đã tồn tại')
        return
      }
      getData()
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Tạo món ăn thành công")
    } catch (error: any) {
      toast.error(error?.message || "Tạo món ăn thất bại")
    }
  }

  // =================== UPDATE ===================
  const handleUpdateDish = async () => {
    if (!selectedDish) return

    const validationError = await validateForm(true, selectedDish.id)
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      const firstMedia = formData.media_urls?.[0]
      let media_file: File | undefined = undefined
      let media_urls: string[] = []

      if (firstMedia instanceof File) {
        media_file = firstMedia
      } else if (typeof firstMedia === "string") {
        media_urls = [firstMedia]
      }

      const updatePayload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        category_id: formData.category_id,
        is_best_seller: formData.is_best_seller,
        seasonal: formData.seasonal,
        active: formData.active,
      }

      if (media_file) updatePayload.media_file = media_file
      else if (media_urls.length > 0) updatePayload.media_urls = media_urls

      await dishService.update(selectedDish.id, updatePayload)
      await dishService.importIngredients({ dishId: selectedDish.id, ingredients: formData.ingredients })

      getData()
      setIsEditDialogOpen(false)
      resetForm()
      toast.success("Cập nhật món ăn thành công")
    } catch (error: any) {
      toast.error(error?.message || "Cập nhật món ăn thất bại")
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
    if (isCreateDialogOpen) resetForm()
  }, [isCreateDialogOpen])

  useEffect(() => {
    if (isEditDialogOpen && selectedDish) populateForm(selectedDish)
  }, [isEditDialogOpen, selectedDish])

  return (
    <div className="space-y-6">
      {/* === HEADER & FILTERS === */}
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

        {/* === CREATE DIALOG === */}
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
              {/* Tên & Giá */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dish-name">Tên món ăn *</Label>
                  <Input
                    id="dish-name"
                    placeholder="Nhập tên món ăn"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dish-price">Giá (VNĐ) *</Label>
                  <Input
                    id="dish-price"
                    type="number"
                    placeholder="0"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min={1}
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div className="grid gap-2">
                <Label htmlFor="dish-description">Mô tả *</Label>
                <Textarea
                  id="dish-description"
                  placeholder="Mô tả món ăn"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Danh mục */}
              <div className="grid gap-2">
                <Label htmlFor="dish-category">Danh mục *</Label>
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

              {/* Hình ảnh */}
              <div className="grid gap-2">
                <Label>Hình ảnh *</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {previewImage && (
                  <div className="mt-2 w-48 h-48 bg-muted rounded-lg overflow-hidden">
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Nguyên liệu */}
              <div className="grid gap-2">
                <Label>Nguyên liệu *</Label>
                <div className="flex gap-4">
                  <Select
                    value={newIngredient.ingredient_id}
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
                    min={0.01}
                  />
                  <Button onClick={addIngredient}>Thêm</Button>
                </div>
                <div className="mt-2 space-y-2">
                  {formData.ingredients.map((ing, index) => {
                    const ingInfo = ingredients.find((i) => i.id === ing.ingredient_id)
                    return (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">
                          {ingInfo?.name || "Không xác định"} - {ing.quantity} {ingInfo?.unit || ""}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => removeIngredient(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Switch */}
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

      {/* === TABLE === */}
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
              {filteredDishes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    Không tìm thấy món ăn nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDishes.map((dish) => (
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
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Hiển thị {filteredDishes.length} trên tổng số {totalDishes} món ăn
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((old) => Math.max(old - 1, 1))}
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
                  onClick={() => setCurrentPage((old) => Math.min(old + 1, totalPages))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === EDIT DIALOG === */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa món ăn</DialogTitle>
            <DialogDescription>Cập nhật thông tin món ăn</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Tên món ăn *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Giá (VNĐ) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Mô tả *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Danh mục *</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Hình ảnh (để trống nếu không đổi)</Label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {previewImage && (
                <div className="mt-2 w-48 h-48 bg-muted rounded-lg overflow-hidden">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Nguyên liệu *</Label>
              <div className="flex gap-4">
                <Select
                  value={newIngredient.ingredient_id}
                  onValueChange={(v) => setNewIngredient({ ...newIngredient, ingredient_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn nguyên liệu" /></SelectTrigger>
                  <SelectContent>
                    {ingredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="any"
                  placeholder="Số lượng"
                  value={newIngredient.quantity || ""}
                  onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                  min={0.01}
                />
                <Button onClick={addIngredient}>Thêm</Button>
              </div>
              <div className="mt-2 space-y-2">
                {formData.ingredients.map((ing, idx) => {
                  const ingInfo = ingredients.find(i => i.id === ing.ingredient_id)
                  return (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {ingInfo?.name} - {ing.quantity} {ingInfo?.unit}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => removeIngredient(idx)}>
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
                  id="edit-best"
                  checked={formData.is_best_seller}
                  onCheckedChange={(c) => setFormData({ ...formData, is_best_seller: c })}
                />
                <Label htmlFor="edit-best">Món bán chạy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-seasonal"
                  checked={formData.seasonal}
                  onCheckedChange={(c) => setFormData({ ...formData, seasonal: c })}
                />
                <Label htmlFor="edit-seasonal">Món theo mùa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.active}
                  onCheckedChange={(c) => setFormData({ ...formData, active: c })}
                />
                <Label htmlFor="edit-active">Hoạt động</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateDish}>Cập nhật món ăn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === VIEW DIALOG === */}
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
                    selectedDish.ingredients.map((ing, i) => (
                      <div key={i} className="text-sm">
                        {ing.name} - {ing.DishIngredient?.quantity || 0} {ing.unit}
                      </div>
                    ))
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