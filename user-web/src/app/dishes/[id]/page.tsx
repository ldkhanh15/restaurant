"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Clock,
  Users,
  ShoppingCart,
  ArrowLeft,
  Info,
  CheckCircle,
  ThumbsUp,
} from "lucide-react";
import {
  getDishById,
  getDishesByCategory,
  mockDishes,
} from "@/mock/mockDishes";
import { getReviewsByDishId } from "@/mock/mockReviews";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function DishDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const dish = getDishById(id);

  if (!dish) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Không tìm thấy món ăn</p>
            <Button onClick={() => router.push("/menu")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const similarDishes = getDishesByCategory(dish.category_id)
    .filter((d) => d.id !== dish.id)
    .slice(0, 4);

  const reviews = getReviewsByDishId(dish.id);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : dish.rating || 0;

  const handleAddToCart = () => {
    // TODO: Add to cart/order
    alert(`Đã thêm ${quantity} ${dish.name} vào giỏ hàng`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100">
      {/* Header */}
      <div className="bg-gradient-to-b from-muted/50 to-background py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-accent/20 shadow-xl"
          >
            {dish.media_urls && dish.media_urls[0] ? (
              <Image
                src={dish.media_urls[0]}
                alt={dish.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">Không có ảnh</span>
              </div>
            )}
            {dish.is_best_seller && (
              <Badge className="absolute top-4 right-4 bg-gradient-gold text-primary-foreground shadow-lg">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Bán chạy nhất
              </Badge>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-4xl font-bold text-primary mb-4 font-elegant">
                {dish.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {dish.description}
              </p>

              {/* Rating & Stats */}
              <div className="flex items-center gap-6 mb-4 flex-wrap">
                {averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(averageRating)
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-lg">
                      {averageRating.toFixed(1)}
                    </span>
                    {reviews.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({reviews.length} đánh giá)
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {dish.prep_time} phút
                  </span>
                </div>
                <Badge variant="outline" className="border-accent/20">
                  {dish.category_name}
                </Badge>
              </div>

              <div className="text-3xl font-bold text-primary mb-6">
                {dish.price.toLocaleString("vi-VN")}đ
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Số lượng:</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="border-accent/20 hover:bg-accent/10"
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-semibold">
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                    className="border-accent/20 hover:bg-accent/10"
                  >
                    +
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleAddToCart}
                className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-lg"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Thêm vào giỏ hàng
              </Button>
            </div>

            {/* Info */}
            <Card className="border-2 border-accent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-accent" />
                  Thông tin chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dish.ingredients && dish.ingredients.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">Nguyên liệu:</p>
                    <div className="flex flex-wrap gap-2">
                      {dish.ingredients.map((ingredient, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="border-accent/20"
                        >
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {dish.allergens && dish.allergens.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2 text-amber-600">Dị ứng:</p>
                    <div className="flex flex-wrap gap-2">
                      {dish.allergens.map((allergen, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="border-amber-500/50 text-amber-600"
                        >
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {dish.nutrition && (
                  <div>
                    <p className="font-semibold mb-2">Dinh dưỡng:</p>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground block">
                          Calories
                        </span>
                        <span className="font-bold">
                          {dish.nutrition.calories}
                        </span>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground block">
                          Protein
                        </span>
                        <span className="font-bold">
                          {dish.nutrition.protein}g
                        </span>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground block">
                          Carbs
                        </span>
                        <span className="font-bold">
                          {dish.nutrition.carbs}g
                        </span>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground block">Fat</span>
                        <span className="font-bold">{dish.nutrition.fat}g</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Card className="border-2 border-accent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-elegant text-2xl">
                  <Star className="h-6 w-6 text-accent fill-current" />
                  Đánh Giá & Nhận Xét ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                              <Users className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  {review.customer_name}
                                </p>
                                {review.verified && (
                                  <Badge
                                    variant="outline"
                                    className="border-green-500/50 text-green-600 text-xs"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Đã xác thực
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= review.rating
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(review.date), "dd/MM/yyyy", {
                                    locale: vi,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.helpful_count !== undefined && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{review.helpful_count}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                        {index < reviews.length - 1 && <Separator />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Similar Dishes */}
        {similarDishes.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-primary mb-6 font-elegant">
              Món Tương Tự
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarDishes.map((similar) => (
                <motion.div
                  key={similar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dishes/${similar.id}`)}
                >
                  <Card className="hover:shadow-lg transition-all border-2 hover:border-accent/50">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      {similar.media_urls && similar.media_urls[0] ? (
                        <Image
                          src={similar.media_urls[0]}
                          alt={similar.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">
                        {similar.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {similar.description}
                      </p>
                      <p className="font-bold text-primary">
                        {similar.price.toLocaleString("vi-VN")}đ
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
