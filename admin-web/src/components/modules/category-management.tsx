"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "react-toastify"
import { categoryService } from "@/services/categoryService"
import { dishService } from "@/services/dishService"

interface Dish {
  id: string
  name: string
  description: string
  price: number
  category_id: string
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
  ingredient_id: string
  dish_id: string
  quantity: number
}

interface Category {
  id: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CategoryManagementProps {
  dishes: Dish[]
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
}

export function CategoryManagement({ dishes, categories, setCategories }: CategoryManagementProps) {
  const [categorySearchTerm, setCategorySearchTerm] = useState("")
  const [showInactiveCategories, setShowInactiveCategories] = useState(false)
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewCategoryDialogOpen, setIsViewCategoryDialogOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    description: "",
    is_active: true,
    created_at: "",
    updated_at: "",
  })
  const [viewCategory, setViewCategory] = useState<Category | null>(null)
  const [categoryDishes, setCategoryDishes] = useState<Dish[]>([])
  const [isLoadingDishes, setIsLoadingDishes] = useState(false)

  const getCategoryDishes = async (categoryId: string) => {
    setIsLoadingDishes(true)
    try {
      const response = await dishService.getDishesByCategoryId(categoryId)
      if (response) {
        setCategoryDishes(response as any)
      } else {
        setCategoryDishes([])
      }
    } catch (error) {
      console.error('Error fetching category dishes:', error)
      toast.error('Không thể lấy danh sách món ăn')
      setCategoryDishes([])
    } finally {
      setIsLoadingDishes(false)
    }
  }

  const getCategories = async () => {
    try {
      const categoriesResponse = await categoryService.getAllNoPaging()
      if (!categoriesResponse) {
        toast.error("Lấy danh mục thất bại")
        return
      }
      setCategories(categoriesResponse as any)
    } catch (error) {
      toast.error("Lấy danh mục thất bại")
    }
  }

  useEffect(() => {
    getCategories()
  }, [])

  const filteredCategories = categories.filter((cat) => {
    const matchSearch = cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
    const matchStatus = showInactiveCategories ? true : cat.is_active
    return matchSearch && matchStatus
  })

  const openCreateCategory = () => {
    setCategoryForm({
      id: "",
      name: "",
      description: "",
      is_active: true,
      created_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    })
    setIsCreateCategoryDialogOpen(true)
  }

  const handleCreateCategory = async () => {
    const name = categoryForm.name.trim()
    const description = categoryForm.description.trim()
    if (!name || !description) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    const newCategory: Category = {
      id: uuidv4() as string,
      name,
      description: categoryForm.description.trim(),
      is_active: !!categoryForm.is_active,
      created_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    }
    const responseCat = await categoryService.create(newCategory)
    if (!responseCat) {
      toast.error("Tạo danh mục thất bại")
      return
    }
    toast.success("Tạo danh mục thành công")
    setCategories((prev) => [...prev, newCategory])
    setIsCreateCategoryDialogOpen(false)
  }

  const handleEditCategory = (cat: Category) => {
    setCategoryForm({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      is_active: cat.is_active,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCategory = async () => {
    const name = categoryForm.name.trim()
    const description = categoryForm.description.trim()
    if (!name || !description) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    const response = await categoryService.update(categoryForm.id, {
      name,
      description,
      is_active: categoryForm.is_active,
    })
    if (!response) {
      toast.error("Cập nhật danh mục thất bại")
      return
    }
    toast.success("Cập nhật danh mục thành công")
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryForm.id
          ? {
              ...c,
              name,
              description: categoryForm.description.trim(),
              is_active: !!categoryForm.is_active,
              updated_at: new Date().toISOString().split("T")[0],
            }
          : c
      )
    )
    setIsEditDialogOpen(false)
  }

  const handleDeleteCategory = async (id: string) => {
    const response = await categoryService.remove(id)
    if (!response) {
      toast.error("Xóa danh mục thất bại")
      return
    }
    toast.success("Xóa danh mục thành công")
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const handleViewCategory = (cat: Category) => {
    setViewCategory(cat)
    setIsViewCategoryDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              value={categorySearchTerm}
              onChange={(e) => setCategorySearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant={showInactiveCategories ? "default" : "outline"}
            onClick={() => setShowInactiveCategories(!showInactiveCategories)}
          >
            {showInactiveCategories ? "Ẩn không hoạt động" : "Hiện không hoạt động"}
          </Button>
        </div>

        <div>
          <Button onClick={openCreateCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
          <CardDescription>Quản lý danh mục món ăn ({filteredCategories.length} danh mục)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id} className={!category.is_active ? "opacity-50" : ""}>
                  <TableCell>
                    <p className="font-medium">{category.name}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground line-clamp-1">
                    {category.description}
                  </TableCell>
                  <TableCell>
                    {category.is_active ? (
                      <Badge variant="secondary">Hoạt động</Badge>
                    ) : (
                      <Badge variant="outline">Tạm dừng</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={async () => {
                          setViewCategory(category)
                          setIsViewCategoryDialogOpen(true)
                          await getCategoryDishes(category.id)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id.toString())}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm danh mục món ăn mới</DialogTitle>
            <DialogDescription>Tạo danh mục mới cho thực đơn</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category-name">Tên danh mục</Label>
                <Input
                  id="category-name"
                  placeholder="Nhập tên danh mục"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">Mô tả</Label>
              <Textarea
                id="category-description"
                placeholder="Mô tả danh mục"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active-category"
                checked={categoryForm.is_active}
                onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: !!checked })}
              />
              <Label htmlFor="is_active-category">Hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCreateCategoryDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateCategory}>Tạo danh mục</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa danh mục</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin danh mục</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category-name">Tên danh mục</Label>
                <Input
                  id="edit-category-name"
                  placeholder="Nhập tên danh mục"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-description">Mô tả</Label>
              <Textarea
                id="edit-category-description"
                placeholder="Mô tả danh mục"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active-category"
                checked={categoryForm.is_active}
                onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: !!checked })}
              />
              <Label htmlFor="edit-is_active-category">Hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleUpdateCategory}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewCategoryDialogOpen} onOpenChange={setIsViewCategoryDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Chi tiết danh mục</DialogTitle>
            <DialogDescription>Thông tin danh mục và các món ăn thuộc danh mục này</DialogDescription>
          </DialogHeader>

          {viewCategory && (
            <div className="flex flex-col flex-grow min-h-0">
              <div className="grid gap-6 py-4">
                <div className="grid gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tên danh mục</Label>
                    <p className="text-lg font-semibold mt-1">{viewCategory.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Mô tả</Label>
                    <p className="text-sm text-muted-foreground mt-1">{viewCategory.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Trạng thái</Label>
                    <div className="mt-1">
                      {viewCategory.is_active ? (
                        <Badge variant="secondary">Hoạt động</Badge>
                      ) : (
                        <Badge variant="outline">Tạm dừng</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Món ăn thuộc danh mục ({categoryDishes.length})</Label>
                  </div>

                  <div className="rounded-md border">
                    {isLoadingDishes ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Đang tải danh sách món ăn...</p>
                      </div>
                    ) : categoryDishes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Chưa có món ăn nào thuộc danh mục này.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead className="w-[200px]">Tên món ăn</TableHead>
                              <TableHead className="w-[250px]">Mô tả</TableHead>
                              <TableHead className="w-[120px]">Giá</TableHead>
                              <TableHead>Trạng thái</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryDishes.map((dish) => (
                              <TableRow key={dish.id}>
                                <TableCell className="font-medium">{dish.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground line-clamp-2">
                                  {dish.description}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {dish.price.toLocaleString("vi-VN")}đ
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 flex-wrap">
                                    {dish.is_best_seller && (
                                      <Badge variant="secondary" className="text-xs">Bán chạy</Badge>
                                    )}
                                    {dish.seasonal && (
                                      <Badge variant="outline" className="text-xs">Theo mùa</Badge>
                                    )}
                                    <Badge 
                                      variant={dish.active ? "secondary" : "outline"} 
                                      className="text-xs"
                                    >
                                      {dish.active ? "Hoạt động" : "Tạm dừng"}
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button onClick={() => setIsViewCategoryDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}