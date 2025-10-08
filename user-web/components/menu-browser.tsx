"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Star, ShoppingCart, Search, Plus, Minus, Eye, Clock, ChefHat } from "lucide-react"
import OrderPlacement from "./order-placement"

const categories = [
  { id: "cat-1", name: "Khai Vị", description: "Món khai vị tinh tế" },
  { id: "cat-2", name: "Món Chính", description: "Các món chính đặc sắc" },
  { id: "cat-3", name: "Tráng Miệng", description: "Món tráng miệng ngọt ngào" },
  { id: "cat-4", name: "Đồ Uống", description: "Thức uống cao cấp" },
  { id: "cat-5", name: "Món Chay", description: "Món chay thanh đạm" },
]

const dishes = [
  {
    id: "dish-1",
    name: "Cá Hồi Nướng",
    description: "Cá hồi tươi nướng với gia vị đặc biệt, kèm rau củ và khoai tây nghiền",
    price: 350000,
    media_urls: ["/grilled-salmon-dish.jpg"],
    is_best_seller: true,
    seasonal: false,
    category_id: "cat-2",
    prep_time: 25,
    ingredients: ["Cá hồi Na Uy", "Gia vị đặc biệt", "Rau củ tươi", "Khoai tây"],
    allergens: ["Cá"],
    nutrition: { calories: 420, protein: 35, carbs: 15, fat: 25 },
    reviews: [
      {
        id: "r1",
        customer: "Nguyễn Thị Lan",
        rating: 5,
        comment: "Cá hồi tươi ngon, nướng vừa tới!",
        date: "2024-01-15",
      },
      { id: "r2", customer: "Trần Văn Nam", rating: 4, comment: "Món ăn ngon, trình bày đẹp", date: "2024-01-12" },
      { id: "r3", customer: "Lê Thị Hoa", rating: 5, comment: "Tuyệt vời! Sẽ quay lại", date: "2024-01-10" },
    ],
  },
  {
    id: "dish-2",
    name: "Bánh Chocolate",
    description: "Bánh chocolate đậm đà với kem tươi và dâu tây, trang trí tinh tế",
    price: 120000,
    media_urls: ["/chocolate-cake-dessert.jpg"],
    is_best_seller: false,
    seasonal: true,
    category_id: "cat-3",
    prep_time: 15,
    ingredients: ["Chocolate Bỉ", "Kem tươi", "Dâu tây", "Bột mì cao cấp"],
    allergens: ["Gluten", "Sữa", "Trứng"],
    nutrition: { calories: 380, protein: 8, carbs: 45, fat: 18 },
    reviews: [
      { id: "r4", customer: "Phạm Minh Tuấn", rating: 5, comment: "Bánh chocolate tuyệt vời!", date: "2024-01-14" },
      { id: "r5", customer: "Nguyễn Văn Đức", rating: 4, comment: "Ngọt vừa phải, rất ngon", date: "2024-01-11" },
    ],
  },
  {
    id: "dish-3",
    name: "Bò Beefsteak",
    description: "Thịt bò Úc cao cấp nướng tại bàn, kèm khoai tây và salad",
    price: 450000,
    media_urls: ["/premium-beef-steak.jpg"],
    is_best_seller: true,
    seasonal: false,
    category_id: "cat-2",
    prep_time: 30,
    ingredients: ["Thịt bò Úc", "Khoai tây", "Salad tươi", "Sốt đặc biệt"],
    allergens: [],
    nutrition: { calories: 520, protein: 45, carbs: 20, fat: 30 },
    reviews: [
      {
        id: "r6",
        customer: "Trần Thị Mai",
        rating: 5,
        comment: "Thịt bò tuyệt hảo, nướng hoàn hảo!",
        date: "2024-01-13",
      },
    ],
  },
  {
    id: "dish-4",
    name: "Salad Caesar",
    description: "Salad Caesar truyền thống với sốt đặc biệt và bánh mì nướng",
    price: 180000,
    media_urls: ["/caesar-salad.png"],
    is_best_seller: false,
    seasonal: false,
    category_id: "cat-1",
    prep_time: 10,
    ingredients: ["Rau cải rom", "Croutons", "Sốt Caesar", "Bánh mì nướng"],
    allergens: ["Gluten"],
    nutrition: { calories: 280, protein: 15, carbs: 25, fat: 10 },
    reviews: [
      {
        id: "r7",
        customer: "Hoàng Thị Hạnh",
        rating: 4,
        comment: "Salad rất ngon, sốt rất đặc biệt",
        date: "2024-01-09",
      },
      {
        id: "r8",
        customer: "Vũ Văn Minh",
        rating: 5,
        comment: "Tuyệt vời! Một món ăn không thể bỏ qua",
        date: "2024-01-08",
      },
    ],
  },
  {
    id: "dish-5",
    name: "Tôm Hùm Nướng",
    description: "Tôm hùm tươi nướng bơ tỏi, kèm cơm và rau củ",
    price: 680000,
    media_urls: ["/grilled-lobster.jpg"],
    is_best_seller: true,
    seasonal: false,
    category_id: "cat-2",
    prep_time: 40,
    ingredients: ["Tôm hùm tươi", "Bơ tỏi", "Cơm trắng", "Rau củ"],
    allergens: ["Tôm"],
    nutrition: { calories: 650, protein: 50, carbs: 10, fat: 40 },
    reviews: [
      {
        id: "r9",
        customer: "Lê Thị Mai",
        rating: 5,
        comment: "Tôm hùm tươi ngon, món ăn tuyệt vời!",
        date: "2024-01-17",
      },
      { id: "r10", customer: "Phạm Văn Nam", rating: 4, comment: "Món ăn ngon, giá cả hợp lý", date: "2024-01-16" },
    ],
  },
  {
    id: "dish-6",
    name: "Rượu Vang Đỏ",
    description: "Rượu vang đỏ Pháp cao cấp, hương vị đậm đà",
    price: 850000,
    media_urls: ["/red-wine-bottle.png"],
    is_best_seller: false,
    seasonal: false,
    category_id: "cat-4",
    prep_time: 5,
    ingredients: ["Rượu vang đỏ Pháp"],
    allergens: [],
    nutrition: { calories: 120, protein: 0, carbs: 0, fat: 0 },
    reviews: [
      { id: "r11", customer: "Nguyễn Thị Lan", rating: 5, comment: "Rượu vang đỏ tuyệt vời!", date: "2024-01-14" },
      { id: "r12", customer: "Trần Văn Nam", rating: 4, comment: "Hương vị đậm đà, rất ngon", date: "2024-01-13" },
    ],
  },
  {
    id: "dish-7",
    name: "Đậu Hũ Sốt Nấm",
    description: "Đậu hũ non sốt nấm hương, món chay thanh đạm bổ dưỡng",
    price: 150000,
    media_urls: ["/tofu-mushroom-sauce.jpg"],
    is_best_seller: false,
    seasonal: true,
    category_id: "cat-5",
    prep_time: 20,
    ingredients: ["Đậu hũ non", "Nấm hương", "Kem tươi"],
    allergens: ["Gluten"],
    nutrition: { calories: 300, protein: 10, carbs: 30, fat: 15 },
    reviews: [
      { id: "r13", customer: "Lê Thị Hoa", rating: 5, comment: "Đậu hũ ngon, sốt nấm rất hấp dẫn", date: "2024-01-12" },
    ],
  },
  {
    id: "dish-8",
    name: "Tiramisu",
    description: "Tiramisu Ý truyền thống với cà phê espresso và mascarpone",
    price: 140000,
    media_urls: ["/classic-tiramisu.png"],
    is_best_seller: false,
    seasonal: false,
    category_id: "cat-3",
    prep_time: 30,
    ingredients: ["Bánh quy", "Cà phê espresso", "Mascarpone"],
    allergens: ["Gluten", "Sữa"],
    nutrition: { calories: 400, protein: 5, carbs: 50, fat: 20 },
    reviews: [
      {
        id: "r14",
        customer: "Phạm Minh Tuấn",
        rating: 4,
        comment: "Tiramisu ngon, trang trí đẹp mắt",
        date: "2024-01-11",
      },
    ],
  },
  {
    id: "dish-9",
    name: "Súp Bí Đỏ",
    description: "Súp bí đỏ kem tươi, kèm bánh mì nướng giòn",
    price: 95000,
    media_urls: ["/pumpkin-soup.jpg"],
    is_best_seller: false,
    seasonal: true,
    category_id: "cat-1",
    prep_time: 20,
    ingredients: ["Bí đỏ", "Kem tươi", "Bánh mì nướng"],
    allergens: ["Gluten"],
    nutrition: { calories: 250, protein: 10, carbs: 35, fat: 10 },
    reviews: [
      {
        id: "r15",
        customer: "Nguyễn Văn Đức",
        rating: 5,
        comment: "Súp bí đỏ ngon, món ăn bổ dưỡng",
        date: "2024-01-10",
      },
    ],
  },
  {
    id: "dish-10",
    name: "Cocktail Mojito",
    description: "Cocktail Mojito tươi mát với bạc hà và chanh",
    price: 120000,
    media_urls: ["/mojito-cocktail.jpg"],
    is_best_seller: false,
    seasonal: false,
    category_id: "cat-4",
    prep_time: 10,
    ingredients: ["Bạc hà", "Chanh", "Gia vị"],
    allergens: [],
    nutrition: { calories: 150, protein: 0, carbs: 20, fat: 0 },
    reviews: [
      {
        id: "r16",
        customer: "Trần Thị Mai",
        rating: 4,
        comment: "Cocktail Mojito mát lạnh, hương vị tuyệt vời",
        date: "2024-01-09",
      },
    ],
  },
]

interface CartItem {
  dish_id: string
  quantity: number
  customizations: Record<string, any>
}

export default function MenuBrowser() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "price" | "popularity">("name")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showOrderPlacement, setShowOrderPlacement] = useState(false)

  // Filter and sort dishes
  const filteredAndSortedDishes = useMemo(() => {
    const filtered = dishes.filter((dish) => {
      const matchesCategory = selectedCategory === "all" || dish.category_id === selectedCategory
      const matchesSearch =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })

    // Sort dishes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price
        case "popularity":
          return (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [selectedCategory, searchQuery, sortBy])

  const addToCart = (dishId: string, customizations: Record<string, any> = {}) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.dish_id === dishId)
      if (existingItem) {
        return prev.map((item) =>
          item.dish_id === dishId ? { ...item, quantity: item.quantity + 1, customizations } : item,
        )
      }
      return [...prev, { dish_id: dishId, quantity: 1, customizations }]
    })
  }

  const updateQuantity = (dishId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.dish_id !== dishId))
    } else {
      setCart((prev) => prev.map((item) => (item.dish_id === dishId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const getCartQuantity = (dishId: string) => {
    const item = cart.find((item) => item.dish_id === dishId)
    return item ? item.quantity : 0
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const dish = dishes.find((d) => d.id === item.dish_id)
      return total + (dish ? dish.price * item.quantity : 0)
    }, 0)
  }

  const proceedToOrder = () => {
    if (cart.length > 0) {
      setShowOrderPlacement(true)
    }
  }

  if (showOrderPlacement) {
    return <OrderPlacement initialCart={cart} onOrderComplete={() => setShowOrderPlacement(false)} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Thực Đơn</h1>
          <p className="text-muted-foreground text-lg">
            Khám phá những món ăn tinh tế được chế biến từ nguyên liệu cao cấp
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Chọn danh mục" />
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
            <Select value={sortBy} onValueChange={(value: "name" | "price" | "popularity") => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên món</SelectItem>
                <SelectItem value="price">Giá cả</SelectItem>
                <SelectItem value="popularity">Độ phổ biến</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              Tất cả
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="mb-8 p-4 bg-card border border-border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">Giỏ hàng: {getTotalItems()} món</span>
                <span className="ml-4 text-primary font-bold">{getTotalPrice().toLocaleString("vi-VN")}đ</span>
              </div>
              <Button onClick={proceedToOrder}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Đặt Hàng
              </Button>
            </div>
          </div>
        )}

        {/* Dishes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDishes.map((dish) => {
            const category = categories.find((cat) => cat.id === dish.category_id)
            const cartQuantity = getCartQuantity(dish.id)
            const avgRating = dish.reviews
              ? dish.reviews.reduce((sum, r) => sum + r.rating, 0) / dish.reviews.length
              : 0

            return (
              <Card key={dish.id} className="group hover:shadow-xl transition-all duration-300 border-border bg-card">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={dish.media_urls[0] || "/placeholder.svg"}
                    alt={dish.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {dish.is_best_seller && (
                      <Badge className="bg-yellow-500/90 text-yellow-900 border-0">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Bán Chạy
                      </Badge>
                    )}
                    {dish.seasonal && (
                      <Badge className="bg-green-500/90 text-green-900 border-0">
                        <Clock className="w-3 h-3 mr-1" />
                        Theo Mùa
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {category?.name}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="font-medium">{avgRating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChefHat className="w-3 h-3 text-muted-foreground" />
                        <span>{dish.prep_time}p</span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{dish.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{dish.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-primary">{dish.price.toLocaleString("vi-VN")}đ</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Chi Tiết
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{dish.name}</DialogTitle>
                          <DialogDescription>{dish.description}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Image */}
                          <img
                            src={dish.media_urls[0] || "/placeholder.svg"}
                            alt={dish.name}
                            className="w-full h-64 object-cover rounded-lg"
                          />

                          {/* Details */}
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-3">Thông Tin Món Ăn</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Giá:</span>
                                  <span className="font-medium text-primary">
                                    {dish.price.toLocaleString("vi-VN")}đ
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Thời gian chuẩn bị:</span>
                                  <span>{dish.prep_time} phút</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Danh mục:</span>
                                  <span>{category?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Đánh giá:</span>
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span>
                                      {avgRating.toFixed(1)} ({dish.reviews?.length || 0})
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {dish.nutrition && (
                                <div className="mt-4">
                                  <h5 className="font-medium mb-2">Thông Tin Dinh Dưỡng</h5>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>Calories: {dish.nutrition.calories}</div>
                                    <div>Protein: {dish.nutrition.protein}g</div>
                                    <div>Carbs: {dish.nutrition.carbs}g</div>
                                    <div>Fat: {dish.nutrition.fat}g</div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="font-semibold mb-3">Nguyên Liệu</h4>
                              <ul className="space-y-1 text-sm">
                                {dish.ingredients?.map((ingredient, index) => (
                                  <li key={index} className="flex items-center space-x-2">
                                    <div className="w-1 h-1 bg-primary rounded-full" />
                                    <span>{ingredient}</span>
                                  </li>
                                ))}
                              </ul>

                              {dish.allergens && dish.allergens.length > 0 && (
                                <div className="mt-4">
                                  <h5 className="font-medium mb-2 text-orange-600">Chất Gây Dị Ứng</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {dish.allergens.map((allergen, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs border-orange-300 text-orange-600"
                                      >
                                        {allergen}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {dish.reviews && dish.reviews.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3">Đánh Giá Khách Hàng</h4>
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                {dish.reviews.map((review) => (
                                  <div key={review.id} className="border border-border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">{review.customer}</span>
                                      <div className="flex items-center space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-3 h-3 ${i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(review.date).toLocaleDateString("vi-VN")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {cartQuantity > 0 ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(dish.id, cartQuantity - 1)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold min-w-[2rem] text-center">{cartQuantity}</span>
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(dish.id, cartQuantity + 1)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground">Trong giỏ hàng</span>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={() => addToCart(dish.id)}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Thêm vào giỏ
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* No results */}
        {filteredAndSortedDishes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Không tìm thấy món ăn nào phù hợp với tiêu chí tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  )
}
