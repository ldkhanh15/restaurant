"use client"

import { useState } from "react"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, Clock, ChefHat, Plus, Minus, ShoppingCart } from "lucide-react"

const dishes = [
  {
    id: "dish-1",
    name: "Cá Hồi Nướng",
    description: "Cá hồi tươi nướng với gia vị đặc biệt, kèm rau củ",
    price: 350000,
    images: ["/grilled-salmon-dish.jpg"],
    is_best_seller: true,
    seasonal: false,
    rating: 4.8,
    reviews_count: 124,
    prep_time: "25-30 phút",
    ingredients: ["Cá hồi Na Uy", "Rau củ tươi", "Gia vị đặc biệt", "Bơ thảo mộc"],
    nutrition: { calories: 420, protein: "35g", carbs: "12g", fat: "28g" },
    allergens: ["Cá", "Sữa"],
    chef_notes:
      "Cá hồi được ướp marinate 24 giờ với gia vị bí mật của nhà hàng, nướng trên than hồng để giữ độ mềm mại và hương vị đặc trưng.",
  },
  {
    id: "dish-2",
    name: "Bánh Chocolate",
    description: "Bánh chocolate đậm đà với kem tươi và dâu tây",
    price: 120000,
    images: ["/chocolate-cake-dessert.jpg"],
    is_best_seller: false,
    seasonal: true,
    rating: 4.9,
    reviews_count: 89,
    prep_time: "15-20 phút",
    ingredients: ["Chocolate Bỉ", "Kem tươi", "Dâu tây", "Bột mì cao cấp"],
    nutrition: { calories: 380, protein: "8g", carbs: "45g", fat: "18g" },
    allergens: ["Gluten", "Sữa", "Trứng"],
    chef_notes:
      "Bánh được làm từ chocolate Bỉ nguyên chất, kết hợp với kem tươi được đánh bông và dâu tây tươi từ Đà Lạt.",
  },
]

export default function DishDetailPage() {
  const { params, navigate, goBack } = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const dish = dishes.find((d) => d.id === params.id)

  if (!dish) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Không tìm thấy món ăn</CardTitle>
            <CardDescription>Món ăn bạn đang tìm không tồn tại.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("menu")} className="w-full">
              Quay lại thực đơn
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={goBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <h1 className="text-xl font-semibold">{dish.name}</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img
                src={dish.images[selectedImage] || "/placeholder.svg"}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
            </div>
            {dish.images.length > 1 && (
              <div className="flex gap-2">
                {dish.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square w-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-primary" : "border-border"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${dish.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dish Details */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {dish.is_best_seller && <Badge className="bg-yellow-500/20 text-yellow-600">Bán chạy nhất</Badge>}
                {dish.seasonal && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-600">
                    Theo mùa
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold mb-4">{dish.name}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{dish.rating}</span>
                  <span className="text-muted-foreground">({dish.reviews_count} đánh giá)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{dish.prep_time}</span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-6">{dish.description}</p>

              <div className="text-3xl font-bold text-primary mb-8">{dish.price.toLocaleString()}đ</div>
            </div>

            {/* Chef's Notes */}
            <div className="bg-card/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <ChefHat className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Ghi chú từ đầu bếp</h3>
              </div>
              <p className="text-muted-foreground">{dish.chef_notes}</p>
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Nguyên liệu chính</h3>
              <div className="grid grid-cols-2 gap-3">
                {dish.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition & Allergens */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin dinh dưỡng</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Calories:</span>
                    <span>{dish.nutrition.calories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span>{dish.nutrition.protein}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbs:</span>
                    <span>{dish.nutrition.carbs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fat:</span>
                    <span>{dish.nutrition.fat}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Chất gây dị ứng</h3>
                <div className="flex flex-wrap gap-2">
                  {dish.allergens.map((allergen, index) => (
                    <Badge key={index} variant="outline" className="bg-red-500/10 text-red-600">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 pt-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button size="lg" className="flex-1">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Thêm vào giỏ - {(dish.price * quantity).toLocaleString()}đ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
