"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, ChefHat, Plus, Minus, ShoppingCart, Package } from "lucide-react";
import dishService from "@/services/dishService";

export default function DishDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [dish, setDish] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const dishId = params.id as string;

  useEffect(() => {
    if (!dishId) return;

    const fetchDish = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dishService.getById(dishId);

        if (!response) {
          throw new Error("Không tìm thấy món ăn");
        }

        const fetchedDish = response.data;

        // Chuẩn hóa media_urls
        const mediaUrls = Array.isArray(fetchedDish.media_urls)
          ? fetchedDish.media_urls
          : fetchedDish.media_urls
          ? [fetchedDish.media_urls]
          : ["/placeholder.svg"];

        setDish({
          ...fetchedDish,
          media_urls: mediaUrls,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchDish();
  }, [dishId]);

  const formatVND = (amount: number) => amount.toLocaleString("vi-VN") + "đ";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Lỗi</CardTitle>
            <CardDescription>{error || "Không tìm thấy món ăn"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/menu")} className="w-full">
              Quay lại thực đơn
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <h1 className="text-xl font-semibold">{dish.name}</h1>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
              <img
                src={dish.media_urls[selectedImage] || "/placeholder.svg"}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
            </div>
            {dish.media_urls.length > 1 && (
              <div className="flex gap-2">
                {dish.media_urls.map((image:any, index:any) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square w-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-primary shadow-md"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
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
                {dish.is_best_seller && (
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-300">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Bán chạy
                  </Badge>
                )}
                {dish.seasonal && (
                  <Badge className="bg-green-500/20 text-green-600 border-green-300">
                    Theo mùa
                  </Badge>
                )}
                {dish.category && (
                  <Badge variant="outline" className="text-muted-foreground">
                    {dish.category.name}
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold mb-4">{dish.name}</h1>

              <p className="text-lg text-muted-foreground mb-6">
                {dish.description || "Món ăn được chế biến từ nguyên liệu tươi ngon nhất."}
              </p>

              <div className="text-3xl font-bold text-primary mb-8">
                {formatVND(dish.price)}
              </div>
            </div>

            {/* Ingredients */}
            {dish.ingredients && dish.ingredients.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Nguyên liệu
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {dish.ingredients.map((ing:any) => {
                    const qty = ing.DishIngredient?.quantity || 0;
                    const unit = ing.unit ? ` ${ing.unit}` : "";
                    return (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between py-2 px-3 bg-card/50 rounded-lg border"
                      >
                        <span className="font-medium">{ing.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {qty > 0 ? `${qty}${unit}` : "Theo khẩu phần"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 pt-6 border-t">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button size="lg" className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Thêm vào giỏ - {formatVND(dish.price * quantity)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}