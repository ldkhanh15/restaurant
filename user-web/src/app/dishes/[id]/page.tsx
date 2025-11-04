"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  pageVariants,
  slideInLeft,
  slideInRight,
  containerVariants,
  itemVariants,
  cardVariants,
  buttonVariants,
  scaleInVariants,
  viewportOptions,
} from "@/lib/motion-variants";

export default function DishDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const dish = getDishById(id);

  if (!dish) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center"
      >
        <Card className="border-2 border-accent/20 shadow-xl">
          <CardContent className="p-12 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-muted-foreground mb-4"
            >
              Không tìm thấy món ăn
            </motion.p>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button onClick={() => router.push("/menu")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại menu
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
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
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-muted/50 to-background py-8 border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 border-accent/20 hover:bg-accent/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            animate="visible"
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-accent/20 shadow-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {dish.media_urls && dish.media_urls[0] ? (
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <Image
                  src={dish.media_urls[0]}
                  alt={dish.name}
                  fill
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">Không có ảnh</span>
              </div>
            )}
            {dish.is_best_seller && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                className="absolute top-4 right-4"
              >
                <Badge className="bg-gradient-gold text-primary-foreground shadow-xl">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Bán chạy nhất
                </Badge>
              </motion.div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary mb-4">
                  {dish.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                  {dish.description}
                </p>

                {/* Rating & Stats */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-6 mb-4 flex-wrap"
                >
                  {averageRating > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.div
                            key={star}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: star * 0.1 }}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= Math.round(averageRating)
                                  ? "text-yellow-500 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          </motion.div>
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
                    </motion.div>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">
                      {dish.prep_time} phút
                    </span>
                  </motion.div>
                  <Badge
                    variant="outline"
                    className="border-accent/20 bg-accent/5"
                  >
                    {dish.category_name}
                  </Badge>
                </motion.div>

                <motion.div
                  key={dish.price}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-bold text-primary mb-6"
                >
                  {dish.price.toLocaleString("vi-VN")}đ
                </motion.div>
              </motion.div>

              {/* Quantity & Add to Cart */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Số lượng:</span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="border-accent/20 hover:bg-accent/10"
                      >
                        -
                      </Button>
                    </motion.div>
                    <motion.span
                      key={quantity}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="w-12 text-center font-semibold"
                    >
                      {quantity}
                    </motion.span>
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQuantity(quantity + 1)}
                        className="border-accent/20 hover:bg-accent/10"
                      >
                        +
                      </Button>
                    </motion.div>
                  </div>
                </div>
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-xl hover:shadow-2xl transition-all duration-200"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Thêm vào giỏ hàng
                  </Button>
                </motion.div>
              </motion.div>

              {/* Info */}
              <motion.div variants={itemVariants}>
                <Card className="border-2 border-accent/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-elegant">
                      <Info className="h-5 w-5 text-accent" />
                      Thông tin chi tiết
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {dish.ingredients && dish.ingredients.length > 0 && (
                        <motion.div variants={itemVariants}>
                          <p className="font-semibold mb-2">Nguyên liệu:</p>
                          <div className="flex flex-wrap gap-2">
                            {dish.ingredients.map((ingredient, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.1 }}
                              >
                                <Badge
                                  variant="outline"
                                  className="border-accent/20 bg-accent/5"
                                >
                                  {ingredient}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {dish.allergens && dish.allergens.length > 0 && (
                        <motion.div variants={itemVariants}>
                          <p className="font-semibold mb-2 text-amber-600">
                            Dị ứng:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dish.allergens.map((allergen, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.1 }}
                              >
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/50 text-amber-600 bg-amber-50"
                                >
                                  {allergen}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {dish.nutrition && (
                        <motion.div variants={itemVariants}>
                          <p className="font-semibold mb-2">Dinh dưỡng:</p>
                          <motion.div
                            variants={containerVariants}
                            className="grid grid-cols-4 gap-2 text-sm"
                          >
                            {[
                              {
                                label: "Calories",
                                value: dish.nutrition.calories,
                              },
                              {
                                label: "Protein",
                                value: `${dish.nutrition.protein}g`,
                              },
                              {
                                label: "Carbs",
                                value: `${dish.nutrition.carbs}g`,
                              },
                              { label: "Fat", value: `${dish.nutrition.fat}g` },
                            ].map((item, idx) => (
                              <motion.div
                                key={item.label}
                                variants={itemVariants}
                                whileHover={{ scale: 1.05 }}
                                className="text-center p-3 bg-muted/50 rounded-lg"
                              >
                                <span className="text-muted-foreground block">
                                  {item.label}
                                </span>
                                <span className="font-bold">{item.value}</span>
                              </motion.div>
                            ))}
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Similar Dishes */}
        {similarDishes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <h2 className="font-elegant text-3xl font-bold text-primary mb-6">
              Món Tương Tự
            </h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {similarDishes.map((similarDish, index) => (
                <motion.div
                  key={similarDish.id}
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  custom={index}
                  viewport={viewportOptions}
                >
                  <Card
                    className="cursor-pointer border-2 border-accent/10 hover:border-accent/30 transition-all shadow-md hover:shadow-xl overflow-hidden"
                    onClick={() => router.push(`/dishes/${similarDish.id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={similarDish.media_urls[0] || "/placeholder.svg"}
                        alt={similarDish.name}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">
                        {similarDish.name}
                      </h3>
                      <p className="text-sm text-accent font-bold">
                        {similarDish.price.toLocaleString("vi-VN")}đ
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
