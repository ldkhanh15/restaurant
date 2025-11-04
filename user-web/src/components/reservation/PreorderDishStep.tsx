"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart, X } from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import { mockDishes } from "@/mock/mockDishes";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import DishSelectionDialog from "@/components/shared/DishSelectionDialog";

export default function PreorderDishStep() {
  const { draft, updateDraft } = useReservationStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const addDish = (dish: (typeof mockDishes)[0]) => {
    const existingIndex = draft.pre_orders.findIndex(
      (item) => item.dish_id === dish.id
    );

    if (existingIndex >= 0) {
      const updated = [...draft.pre_orders];
      updated[existingIndex].quantity += 1;
      updateDraft({ pre_orders: updated });
    } else {
      updateDraft({
        pre_orders: [
          ...draft.pre_orders,
          {
            dish_id: dish.id,
            dish_name: dish.name,
            quantity: 1,
            price: dish.price,
          },
        ],
      });
    }
    toast({
      title: "Đã thêm món",
      description: `${dish.name} đã được thêm vào danh sách đặt trước`,
    });
  };

  const removeDish = (dishId: string) => {
    const dish = draft.pre_orders.find((item) => item.dish_id === dishId);
    if (dish && confirm(`Xóa ${dish.dish_name} khỏi danh sách?`)) {
      updateDraft({
        pre_orders: draft.pre_orders.filter((item) => item.dish_id !== dishId),
      });
    }
  };

  const updateQuantity = (dishId: string, delta: number) => {
    const updated = draft.pre_orders
      .map((item) => {
        if (item.dish_id === dishId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
      .filter(Boolean) as typeof draft.pre_orders;

    updateDraft({ pre_orders: updated });
  };

  const totalPrice = draft.pre_orders.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-accent/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-elegant text-xl">
                <ShoppingCart className="h-6 w-6 text-accent" />
                Đặt Món Trước (Tùy chọn)
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Chọn món bạn muốn đặt trước để tiết kiệm thời gian
              </CardDescription>
            </div>
            <div>
              <DishSelectionDialog
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                onSelectDish={(dish) => {
                  addDish(dish);
                }}
                selectedDishIds={draft.pre_orders.map((po) => po.dish_id)}
                title="Chọn Món Đặt Trước"
                description="Chọn món bạn muốn đặt trước cho bữa ăn"
              />
              <Button
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm Món
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.pre_orders.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {draft.pre_orders.map((item, index) => {
                  const dish = mockDishes.find((d) => d.id === item.dish_id);
                  return (
                    <motion.div
                      key={item.dish_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <Card className="border-2 border-accent/10 hover:border-accent/30 transition-all">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Dish Image */}
                            {dish && (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={dish.media_urls[0] || "/placeholder.svg"}
                                  alt={dish.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}

                            {/* Dish Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-lg text-primary mb-1">
                                    {item.dish_name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {item.price.toLocaleString("vi-VN")}đ / món
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDish(item.dish_id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateQuantity(item.dish_id, -1)
                                    }
                                    disabled={item.quantity <= 1}
                                    className="border-accent/20"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-bold text-lg w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateQuantity(item.dish_id, 1)
                                    }
                                    className="border-accent/20"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Tổng:
                                  </p>
                                  <p className="font-bold text-xl text-primary">
                                    {(
                                      item.price * item.quantity
                                    ).toLocaleString("vi-VN")}
                                    đ
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Total */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t-2 border-accent/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">Tổng cộng:</span>
                  <span className="font-bold text-2xl text-accent">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg">
                Chưa có món nào được chọn
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Nhấn "Thêm Món" để đặt món trước
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
