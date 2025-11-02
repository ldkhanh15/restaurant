"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Upload, X } from "lucide-react";

export default function ReviewPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;
  const router = useRouter();
  const [overallRating, setOverallRating] = useState(0);
  const [dishRatings, setDishRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const mockDishes = [
    { id: "D-1", name: "Cá Hồi Nướng" },
    { id: "D-2", name: "Salad Caesar" },
  ];

  const handleSubmit = async () => {
    // API call to submit review
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push("/orders");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl">Đánh Giá Bữa Ăn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Rating */}
              <div>
                <Label>Đánh Giá Tổng Thể</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setOverallRating(rating)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          rating <= overallRating
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Dish Ratings */}
              <div className="space-y-4">
                <Label>Đánh Giá Từng Món</Label>
                {mockDishes.map((dish) => (
                  <div key={dish.id} className="space-y-2">
                    <p className="font-medium">{dish.name}</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() =>
                            setDishRatings({
                              ...dishRatings,
                              [dish.id]: rating,
                            })
                          }
                        >
                          <Star
                            className={`h-6 w-6 ${
                              rating <= (dishRatings[dish.id] || 0)
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment */}
              <div>
                <Label htmlFor="comment">Nhận Xét</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  rows={5}
                  className="mt-2 border-accent/20 focus:border-accent"
                />
              </div>

              {/* Photos */}
              <div>
                <Label>Ảnh (Tùy chọn)</Label>
                <div className="mt-2 flex gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative w-24 h-24 border rounded-lg"
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() =>
                          setPhotos(photos.filter((_, i) => i !== index))
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </label>
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-gold text-primary-foreground"
                disabled={overallRating === 0}
              >
                Gửi Đánh Giá
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
