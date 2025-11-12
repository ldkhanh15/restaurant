"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, ShoppingCart, ArrowLeft, Info, Leaf, User } from "lucide-react";
import { dishService, type Dish } from "@/services/dishService";
import Image from "next/image";
import {
  pageVariants,
  slideInLeft,
  slideInRight,
  containerVariants,
  itemVariants,
  cardVariants,
  buttonVariants,
  viewportOptions,
} from "@/lib/motion-variants";
import { reviewService, type Review } from "@/services/reviewService";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function DishDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [dish, setDish] = useState<Dish | null>(null);
  const [similarDishes, setSimilarDishes] = useState<Dish[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDish = async () => {
      try {
        setLoading(true);
        const dishResponse = await dishService.getById(id);
        const dishData = dishResponse.data;
        setDish(dishData);

        // Fetch similar dishes by category
        if (dishData.category_id) {
          const similarResponse = await dishService.getByCategory(
            dishData.category_id
          );
          const filtered = similarResponse.data
            .filter((d: Dish) => d.id !== id && d.active && !d.deleted_at)
            .slice(0, 4);
          setSimilarDishes(filtered);
        }

        // Fetch reviews for this dish
        await fetchReviews();
      } catch (err) {
        console.error("Error fetching dish:", err);
        setError("Không thể tải thông tin món ăn");
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const reviewResponse = await reviewService.getReviewsByDishId(id);
        const reviewData = reviewResponse.data || [];
        // Filter only dish reviews for this specific dish
        const dishReviews = Array.isArray(reviewData) 
          ? reviewData
              .filter((review: Review) => review.type === 'dish' && review.dish_id === id)
              .sort((a, b) => {
                // Sort by created_at, newest first
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB.getTime() - dateA.getTime();
              })
          : [];
        setReviews(dishReviews);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        // Don't set error for reviews, just log it
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) fetchDish();
  }, [id]);

  const handleAddToCart = () => {
    alert(`Đã thêm ${quantity} "${dish?.name}" vào giỏ hàng`);
  };

  // Helper: Format price safely
  const formatPrice = (price: number | string | null | undefined): string => {
    const num = Number(price);
    return isNaN(num) ? "0" : num.toLocaleString("vi-VN");
  };

  // Helper: Format date safely
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "";
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy", { locale: vi });
    } catch {
      return "";
    }
  };

  // Star Rating Component for Reviews
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center p-8">
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                {error || "Không tìm thấy món ăn"}
              </p>
              <Button onClick={() => router.push("/menu")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại thực đơn
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-muted/50 to-transparent py-6 border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="hover:bg-accent/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <motion.div
            variants={slideInLeft}
            className="relative aspect-square rounded-xl overflow-hidden border-2 border-accent/20 shadow-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {dish.media_urls && dish.media_urls[0] ? (
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-full"
              >
                <Image
                  src={dish.media_urls[0]}
                  alt={dish.name}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-lg">
                  Không có ảnh
                </span>
              </div>
            )}

            {/* Best Seller Badge */}
            {dish.is_best_seller && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                className="absolute top-4 right-4"
              >
                <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Bán chạy
                </Badge>
              </motion.div>
            )}

            {/* Seasonal Badge */}
            {dish.seasonal && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute top-4 left-4"
              >
                <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg">
                  <Leaf className="w-3 h-3 mr-1" />
                  Theo mùa
                </Badge>
              </motion.div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div variants={slideInRight} className="space-y-6">
            <div className="space-y-5">
              <motion.div variants={itemVariants}>
                <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary">
                  {dish.name}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed mt-3">
                  {dish.description}
                </p>
              </motion.div>

              {/* Price */}
              <motion.div
                key={dish.price}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-4xl font-bold text-primary"
              >
                {formatPrice(dish.price)}₫
              </motion.div>

              {/* Category */}
              <motion.div variants={itemVariants}>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {dish.category?.name || "Chưa phân loại"}
                </Badge>
              </motion.div>

              {/* Quantity & Add to Cart */}
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">Số lượng:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-9 w-9 p-0"
                    >
                      −
                    </Button>
                    <motion.span
                      key={quantity}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="w-12 text-center font-semibold"
                    >
                      {quantity}
                    </motion.span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-9 w-9 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Thêm vào giỏ
                </Button>
              </motion.div>

              {/* Info Card */}
              <motion.div variants={itemVariants}>
                <Card className="border-2 border-accent/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-5 w-5 text-accent" />
                      Thông tin chi tiết
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Ingredients */}
                    {dish.ingredients && dish.ingredients.length > 0 ? (
                      <div>
                        <p className="font-semibold mb-2">Nguyên liệu:</p>
                        <div className="space-y-2">
                          {dish.ingredients.map((ing, idx) => (
                            <motion.div
                              key={ing.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex justify-between text-sm bg-muted/50 px-3 py-2 rounded-lg"
                            >
                              <span className="font-medium">{ing.name}</span>
                              <span className="text-muted-foreground">
                                {ing.DishIngredient?.quantity || 0} {ing.unit}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Chưa có nguyên liệu
                      </p>
                    )}

                    {/* Status */}
                    <div className="flex gap-3 text-sm">
                      <Badge
                        variant={dish.active ? "secondary" : "outline"}
                        className={dish.active ? "" : "opacity-70"}
                      >
                        {dish.active ? "Đang phục vụ" : "Tạm dừng"}
                      </Badge>
                      {dish.deleted_at && (
                        <Badge variant="destructive">Đã xóa</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Similar Dishes */}
        {similarDishes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <h2 className="font-elegant text-3xl font-bold text-primary mb-6">
              Món ăn tương tự
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarDishes.map((similar, index) => (
                <motion.div
                  key={similar.id}
                  variants={cardVariants}
                  custom={index}
                  whileHover="hover"
                  whileTap="tap"
                  viewport={viewportOptions}
                  onClick={() => router.push(`/dishes/${similar.id}`)}
                  className="cursor-pointer"
                >
                  <Card className="overflow-hidden border-2 border-accent/10 hover:border-accent/30 transition-all shadow-md hover:shadow-xl">
                    <div className="relative aspect-square">
                      <Image
                        src={similar.media_urls?.[0] || "/placeholder.svg"}
                        alt={similar.name}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-500"
                      />

                      {/* Best Seller Badge */}
                      {similar.is_best_seller && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white text-xs shadow-md">
                          <Star className="w-3 h-3 mr-1" />
                          Bán chạy
                        </Badge>
                      )}

                      {/* Seasonal Badge - ĐÃ SỬA: có absolute + vị trí rõ ràng */}
                      {similar.seasonal && (
                        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg text-xs">
                          <Leaf className="w-3 h-3 mr-1" />
                          Theo mùa
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                        {similar.name}
                      </h3>
                      <p className="text-accent font-bold">
                        {formatPrice(similar.price)}₫
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Reviews Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-elegant text-3xl font-bold text-primary">
              Đánh giá từ khách hàng
            </h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)} />
                  <span className="font-semibold">
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}/5
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-muted-foreground">
                  {reviews.length} đánh giá
                </span>
              </div>
            )}
          </div>
          
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Đang tải đánh giá...</span>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="border border-border/50 rounded-lg p-4 bg-card/50 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-accent/20 to-accent/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {review.user?.username || "Người dùng ẩn danh"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-muted-foreground">
                            ({review.rating}/5)
                          </span>
                        </div>
                      </div>
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </time>
                  </div>
                  
                  {review.comment && (
                    <p className="text-sm text-foreground/80 leading-relaxed ml-13">
                      "{review.comment}"
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground italic text-lg">
                Chưa có đánh giá nào cho món ăn này.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!
              </p>
            </motion.div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
