"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Users,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Phone,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { getTableById } from "@/mock/mockTables";
import { mockDishes } from "@/mock/mockDishes";
import { useOrderStore } from "@/store/orderStore";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function TableOrderPage({
  params,
}: {
  params: { tableId: string };
}) {
  const { tableId } = params;
  const router = useRouter();
  // Toast will be implemented properly later
  const showToast = (title: string, description?: string) => {
    // Simple alert for now
    alert(`${title}${description ? `: ${description}` : ""}`);
  };
  const table = getTableById(tableId);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setTableId,
    getTotal,
  } = useOrderStore();

  // Set table ID when component mounts
  useEffect(() => {
    if (table) {
      setTableId(table.id);
    }
  }, [table, setTableId]);

  if (!table) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Không tìm thấy bàn</p>
            <Button onClick={() => router.push("/tables")} variant="outline">
              Quay lại danh sách bàn
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    available: "bg-green-500",
    reserved: "bg-yellow-500",
    occupied: "bg-red-500",
  };

  const statusLabels = {
    available: "Còn trống",
    reserved: "Đã đặt",
    occupied: "Đang dùng",
  };

  const categories = Array.from(new Set(mockDishes.map((d) => d.category_id)));
  const filteredDishes =
    selectedCategory === "all"
      ? mockDishes
      : mockDishes.filter((d) => d.category_id === selectedCategory);

  const handleAddDish = (dish: (typeof mockDishes)[0]) => {
    addItem({
      dish_id: dish.id,
      dish_name: dish.name,
      quantity: 1,
      price: dish.price,
    });
    showToast("Đã thêm món", `${dish.name} đã được thêm vào giỏ hàng`);
  };

  const handleCallWaiter = () => {
    showToast("Đã gọi nhân viên", "Nhân viên đang đến bàn của bạn...");
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      showToast("Giỏ hàng trống", "Vui lòng chọn món trước khi gửi đơn");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    showToast("Đặt món thành công!", "Đơn hàng của bạn đã được gửi đến bếp");

    clearCart();
    router.push(`/orders/${Date.now()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-muted/50 to-background py-6 border-b border-border sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                {table.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {table.floor_name}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {table.capacity} người
                </div>
                <Badge className={cn(statusColors[table.status], "text-white")}>
                  {statusLabels[table.status]}
                </Badge>
              </div>
            </div>
            <Button onClick={handleCallWaiter} variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Gọi nhân viên
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                Tất cả
              </Button>
              {categories.map((catId) => {
                const category = mockDishes.find(
                  (d) => d.category_id === catId
                );
                return (
                  <Button
                    key={catId}
                    variant={selectedCategory === catId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(catId)}
                  >
                    {category?.category_name || catId}
                  </Button>
                );
              })}
            </div>

            {/* Dishes Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredDishes.map((dish, index) => (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all border-2 hover:border-accent/50">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      {dish.media_urls && dish.media_urls[0] ? (
                        <Image
                          src={dish.media_urls[0]}
                          alt={dish.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                      {dish.is_best_seller && (
                        <Badge className="absolute top-2 right-2 bg-gradient-gold">
                          Bán chạy
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">
                        {dish.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {dish.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-primary">
                          {dish.price.toLocaleString("vi-VN")}đ
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleAddDish(dish)}
                          className="bg-gradient-gold text-primary-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24 border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-accent" />
                  Giỏ Hàng ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length > 0 ? (
                  <>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {items.map((item) => (
                        <div
                          key={item.dish_id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {item.dish_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.price.toLocaleString("vi-VN")}đ
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(
                                  item.dish_id,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(item.dish_id, item.quantity + 1)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(item.dish_id)}
                              className="ml-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between font-semibold">
                        <span>Tổng cộng:</span>
                        <span className="text-primary text-lg">
                          {getTotal().toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <Button
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-gold text-primary-foreground"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Gửi đơn hàng
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Giỏ hàng trống</p>
                    <p className="text-xs mt-2">Chọn món để thêm vào giỏ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
