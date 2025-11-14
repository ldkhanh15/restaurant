"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, AlertCircle, ArrowLeft, Send } from "lucide-react";
import { orderService } from "@/services/orderService";
import type { Order, OrderItem } from "@/services/orderService";
import { reviewService } from "@/services/reviewService";
import type { Review, CreateReviewData } from "@/services/reviewService";
import { toast } from "sonner";

interface DishReview {
  dish_id: string;
  order_item_id: string;
  rating: number;
  comment: string;
}

export default function ReviewPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;
  const router = useRouter();

  // Data states
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Review states
  const [overallRating, setOverallRating] = useState(0);
  const [overallComment, setOverallComment] = useState("");
  const [dishReviews, setDishReviews] = useState<Record<string, DishReview>>(
    {}
  );

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await orderService.getOrderById(orderId);
        const orderData = response.data;

        if (!orderData) {
          throw new Error("Không tìm thấy đơn hàng");
        }

        setOrder(orderData);

        // Initialize dish reviews for each order item
        if (orderData.items && orderData.items.length > 0) {
          const initialDishReviews: Record<string, DishReview> = {};
          orderData.items.forEach((item) => {
            if (item.dish) {
              initialDishReviews[item.id] = {
                dish_id: item.dish.id,
                order_item_id: item.id,
                rating: 0,
                comment: "",
              };
            }
          });
          setDishReviews(initialDishReviews);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin đơn hàng"
        );
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  // Star rating component
  const StarRating = ({
    rating,
    onRatingChange,
    size = "medium",
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    size?: "small" | "medium" | "large";
  }) => {
    const sizeClasses = {
      small: "h-5 w-5",
      medium: "h-6 w-6",
      large: "h-8 w-8",
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="focus:outline-none focus:ring-2 focus:ring-accent rounded"
          >
            <Star
              className={`${sizeClasses[size]} transition-colors ${
                star <= rating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300 hover:text-gray-400"
              }`}
            />
          </motion.button>
        ))}
      </div>
    );
  };

  // Update dish review
  const updateDishReview = (
    itemId: string,
    field: "rating" | "comment",
    value: number | string
  ) => {
    setDishReviews((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // Submit reviews
  const handleSubmitReviews = async () => {
    try {
      setSubmitting(true);

      // Validate overall rating
      if (overallRating === 0) {
        toast.error("Vui lòng đánh giá tổng thể cho đơn hàng");
        return;
      }

      const reviewsToCreate: CreateReviewData[] = [];

      // Add overall review for the order/table
      reviewsToCreate.push({
        order_id: orderId,
        table_id: order?.table_id,
        type: "table",
        rating: overallRating,
        comment: overallComment || undefined,
      });

      // Add individual dish reviews
      Object.values(dishReviews).forEach((dishReview) => {
        if (dishReview.rating > 0) {
          // Only submit reviews that have ratings
          reviewsToCreate.push({
            order_id: orderId,
            order_item_id: dishReview.order_item_id,
            dish_id: dishReview.dish_id,
            type: "dish",
            rating: dishReview.rating,
            comment: dishReview.comment || undefined,
          });
        }
      });

      if (reviewsToCreate.length === 0) {
        toast.error("Vui lòng đánh giá ít nhất một món ăn");
        return;
      }

      // Submit all reviews
      const promises = reviewsToCreate.map((reviewData) =>
        reviewService.create(reviewData)
      );

      await Promise.all(promises);

      toast.success("Gửi đánh giá thành công!");
      console.log("Submitted reviews:", reviewsToCreate);

      // Navigate back to orders
      setTimeout(() => {
        router.push("/orders");
      }, 1000);
    } catch (err) {
      console.error("Error submitting reviews:", err);
      console.error("Error submitting reviews:", err);
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid = overallRating > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-muted-foreground">
            Đang tải thông tin đơn hàng...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-medium mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={() => router.push("/orders")} variant="outline">
              Quay lại danh sách đơn hàng
            </Button>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Không tìm thấy đơn hàng</p>
          <Button
            onClick={() => router.push("/orders")}
            className="mt-4"
            variant="outline"
          >
            Quay lại danh sách đơn hàng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/orders")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Đánh Giá Bữa Ăn
              </h1>
              <p className="text-muted-foreground">
                Đơn hàng #{orderId.slice(0, 8)} • Bàn{" "}
                {order.table?.table_number || "N/A"}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Overall Review Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-accent/20 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-accent to-accent/80 rounded-full flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  Đánh Giá Tổng Thể
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Đánh giá chung về trải nghiệm bữa ăn của bạn
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Số sao đánh giá *
                  </Label>
                  <StarRating
                    rating={overallRating}
                    onRatingChange={setOverallRating}
                    size="large"
                  />
                  {overallRating > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {overallRating === 1 && "Rất không hài lòng"}
                      {overallRating === 2 && "Không hài lòng"}
                      {overallRating === 3 && "Bình thường"}
                      {overallRating === 4 && "Hài lòng"}
                      {overallRating === 5 && "Rất hài lòng"}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="overall-comment"
                    className="text-base font-medium mb-3 block"
                  >
                    Nhận xét tổng thể
                  </Label>
                  <Textarea
                    id="overall-comment"
                    value={overallComment}
                    onChange={(e) => setOverallComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm chung về dịch vụ, không gian, nhân viên..."
                    rows={4}
                    className="resize-none border-accent/20 focus:border-accent"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Individual Dishes Review */}
          {order.items && order.items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-accent/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle>Đánh Giá Từng Món Ăn</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Đánh giá chi tiết cho từng món bạn đã gọi
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {order.items.map(
                      (item, index) =>
                        item.dish && (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="p-4 border border-border rounded-lg bg-card/50"
                          >
                            <div className="flex items-start gap-4">
                              {/* Dish Image */}
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {item.dish.media_urls &&
                                item.dish.media_urls.length > 0 ? (
                                  <img
                                    src={item.dish.media_urls[0]}
                                    alt={item.dish.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                    No Image
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 space-y-4">
                                {/* Dish Info */}
                                <div>
                                  <h4 className="font-semibold text-lg">
                                    {item.dish.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Số lượng: {item.quantity} • Giá:{" "}
                                    {item.price.toLocaleString("vi-VN")}đ
                                  </p>
                                  {item.dish.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {item.dish.description}
                                    </p>
                                  )}
                                </div>

                                {/* Rating */}
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">
                                    Đánh giá món này
                                  </Label>
                                  <StarRating
                                    rating={dishReviews[item.id]?.rating || 0}
                                    onRatingChange={(rating) =>
                                      updateDishReview(
                                        item.id,
                                        "rating",
                                        rating
                                      )
                                    }
                                    size="medium"
                                  />
                                </div>

                                {/* Comment */}
                                <div>
                                  <Label
                                    htmlFor={`comment-${item.id}`}
                                    className="text-sm font-medium mb-2 block"
                                  >
                                    Nhận xét về món này
                                  </Label>
                                  <Textarea
                                    id={`comment-${item.id}`}
                                    value={dishReviews[item.id]?.comment || ""}
                                    onChange={(e) =>
                                      updateDishReview(
                                        item.id,
                                        "comment",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Chia sẻ cảm nhận về vị, hình thức, nhiệt độ..."
                                    rows={3}
                                    className="resize-none text-sm border-accent/20 focus:border-accent"
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center pt-4"
          >
            <Button
              onClick={handleSubmitReviews}
              disabled={!isFormValid || submitting}
              className="w-full max-w-md h-12 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Gửi Đánh Giá
                </>
              )}
            </Button>

            {!isFormValid && (
              <p className="text-sm text-muted-foreground mt-3">
                * Vui lòng đánh giá tổng thể để có thể gửi
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
