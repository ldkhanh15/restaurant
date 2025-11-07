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
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import DishSelectionDialog, {
  type SelectableDish,
} from "@/components/shared/DishSelectionDialog";
import {
  slideInRight,
  containerVariants,
  itemVariants,
  cardVariants,
  buttonVariants,
} from "@/lib/motion-variants";

export default function PreorderDishStep() {
  const { draft, updateDraft } = useReservationStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const addDish = (dish: SelectableDish) => {
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
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-2 border-accent/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between"
          >
            <div>
              <CardTitle className="flex items-center gap-2 font-elegant text-2xl">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <ShoppingCart className="h-6 w-6 text-accent" />
                </motion.div>
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
                onSelectDish={addDish}
                selectedDishIds={draft.pre_orders.map((po) => po.dish_id)}
                title="Chọn Món Đặt Trước"
                description="Chọn món bạn muốn đặt trước cho bữa ăn"
              />
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200"
                  size="sm"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Món
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.pre_orders.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
                {draft.pre_orders.map((item, index) => {
                  return (
                    <motion.div
                      key={item.dish_id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: 20, scale: 0.9 }}
                      layout
                      whileHover={{ scale: 1.02, y: -2 }}
                      custom={index}
                    >
                      <Card className="border-2 border-accent/10 hover:border-accent/30 transition-all shadow-md hover:shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Dish Image */}
                            {item.dish_id && (
                              <motion.div
                                className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                              >
                                {/* Image can be loaded from dish service if needed */}
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <ShoppingCart className="h-8 w-8" />
                                </div>
                              </motion.div>
                            )}

                            {/* Dish Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-lg text-primary mb-1 font-elegant">
                                    {item.dish_name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {item.price.toLocaleString("vi-VN")}đ / món
                                  </p>
                                </div>
                                <motion.div
                                  variants={buttonVariants}
                                  whileHover="hover"
                                  whileTap="tap"
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDish(item.dish_id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>

                              <div className="flex items-center justify-between">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-3">
                                  <motion.div
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateQuantity(item.dish_id, -1)
                                      }
                                      disabled={item.quantity <= 1}
                                      className="border-accent/20 hover:bg-accent/10 transition-all duration-200"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                  <motion.span
                                    key={item.quantity}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    className="font-bold text-lg w-8 text-center"
                                  >
                                    {item.quantity}
                                  </motion.span>
                                  <motion.div
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateQuantity(item.dish_id, 1)
                                      }
                                      className="border-accent/20 hover:bg-accent/10 transition-all duration-200"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Tổng:
                                  </p>
                                  <motion.p
                                    key={item.price * item.quantity}
                                    initial={{ scale: 1.1 }}
                                    animate={{ scale: 1 }}
                                    className="font-bold text-xl text-primary"
                                  >
                                    {(
                                      item.price * item.quantity
                                    ).toLocaleString("vi-VN")}
                                    đ
                                  </motion.p>
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
                transition={{ delay: 0.2 }}
                className="pt-4 border-t-2 border-accent/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">Tổng cộng:</span>
                  <motion.span
                    key={totalPrice}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="font-bold text-2xl text-accent"
                  >
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </motion.span>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              </motion.div>
              <p className="text-muted-foreground text-lg">
                Chưa có món nào được chọn
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Nhấn "Thêm Món" để đặt món trước
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
