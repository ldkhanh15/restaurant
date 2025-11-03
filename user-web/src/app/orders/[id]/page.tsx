"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Minus,
  X,
  XCircle,
  CreditCard,
  Receipt,
  Gift,
  MessageCircle,
  Star,
  CheckCircle,
  Clock,
  ChefHat,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { mockDishes } from "@/mock/mockDishes";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import DishSelectionDialog from "@/components/shared/DishSelectionDialog";

// Mock order data with extended fields
const getMockOrder = (id: string) => {
  return {
    id,
    date: "2024-02-15T19:00:00Z",
    status: "preparing" as const,
    table: "Bàn VIP 1",
    table_id: "T-6",
    items: [
      {
        id: "I-1",
        dish_id: "dish-1",
        dish_name: "Cá Hồi Nướng",
        quantity: 2,
        price: 350000,
        status: "preparing" as const,
      },
      {
        id: "I-2",
        dish_id: "dish-3",
        dish_name: "Salad Caesar",
        quantity: 1,
        price: 120000,
        status: "served" as const,
      },
      {
        id: "I-3",
        dish_id: "dish-4",
        dish_name: "Soup Gà Truyền Thống",
        quantity: 1,
        price: 150000,
        status: "pending" as const,
      },
    ],
    subtotal: 970000,
    discount: 50000,
    voucher_discount: 50000,
    tax: 97000,
    total: 1017000,
    paid: 0,
    payment_method: null as string | null,
    voucher_code: null as string | null,
    created_at: "2024-02-15T19:00:00Z",
  };
};

const itemStatusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    icon: Clock,
  },
  preparing: {
    label: "Đang chuẩn bị",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: ChefHat,
  },
  served: {
    label: "Đã phục vụ",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: XCircle,
  },
};

const orderStatusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-500",
  },
  preparing: {
    label: "Đang chuẩn bị",
    color: "bg-blue-500",
  },
  served: {
    label: "Đã hoàn thành",
    color: "bg-green-500",
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-500",
  },
};

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const order = getMockOrder(id);
  const [orderItems, setOrderItems] = useState(order.items);
  const [isAddingDishes, setIsAddingDishes] = useState(false);
  const [voucherCode, setVoucherCode] = useState(order.voucher_code || "");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  const handleAddDish = (dish: (typeof mockDishes)[0]) => {
    const existing = orderItems.find((item) => item.dish_id === dish.id);
    if (existing) {
      setOrderItems(
        orderItems.map((item) =>
          item.dish_id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: `I-${Date.now()}`,
          dish_id: dish.id,
          dish_name: dish.name,
          quantity: 1,
          price: dish.price,
          status: "pending",
        },
      ]);
    }

    toast({
      title: "Đã thêm món",
      description: `${dish.name} đã được thêm vào đơn hàng`,
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleCancelItem = (itemId: string) => {
    const item = orderItems.find((i) => i.id === itemId);
    if (!item) return;

    if (item.status === "pending" && confirm(`Hủy món "${item.dish_name}"?`)) {
      setOrderItems(orderItems.filter((i) => i.id !== itemId));
      toast({
        title: "Đã hủy món",
        description: `${item.dish_name} đã được xóa khỏi đơn hàng`,
      });
    } else {
      toast({
        title: "Không thể hủy",
        description: "Chỉ có thể hủy món đang ở trạng thái chờ xác nhận",
        variant: "destructive",
      });
    }
  };

  const handleRequestSupport = () => {
    toast({
      title: "Đã gọi nhân viên",
      description: "Nhân viên đang đến bàn của bạn...",
    });
  };

  const handleApplyVoucher = () => {
    if (voucherCode.toUpperCase() === "HIWELL20") {
      setIsApplyingVoucher(true);
      toast({
        title: "Áp dụng voucher thành công",
        description: "Giảm 50,000đ cho đơn hàng này",
      });
    } else {
      toast({
        title: "Voucher không hợp lệ",
        description: "Vui lòng kiểm tra lại mã voucher",
        variant: "destructive",
      });
    }
  };

  const handleRequestPayment = () => {
    const total = calculateTotal();
    router.push(
      `/mock-vnpay?txnRef=TXN-${Date.now()}&amount=${total}&orderId=${id}`
    );
  };

  const handleReview = () => {
    router.push(`/reviews/${id}`);
  };

  const calculateTotal = () => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = isApplyingVoucher ? 50000 : 0;
    const tax = Math.round(subtotal * 0.1);
    return subtotal - discount + tax;
  };

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = isApplyingVoucher ? 50000 : 0;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal - discount + tax;
  const canCancelItems = orderItems.filter(
    (i) => i.status === "pending"
  ).length;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-elegant text-4xl font-bold text-primary mb-2">
                Chi Tiết Đơn Hàng
              </h1>
              <p className="text-muted-foreground text-lg">
                Mã đơn: <span className="font-mono font-semibold">{id}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(order.date), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
                {" • "}
                {order.table}
              </p>
            </div>
            <Badge
              className={cn(
                `${
                  orderStatusConfig[order.status].color
                } text-white px-4 py-2 text-base`
              )}
            >
              {orderStatusConfig[order.status].label}
            </Badge>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dish Selection Dialog */}
            <DishSelectionDialog
              open={isAddingDishes}
              onOpenChange={setIsAddingDishes}
              onSelectDish={handleAddDish}
              selectedDishIds={orderItems.map((item) => item.dish_id)}
              title="Chọn Món Thêm"
              description="Chọn món ăn bạn muốn thêm vào đơn hàng"
            />

            {/* Order Items */}
            <Card className="border-2 border-accent/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-elegant text-xl">
                    <ShoppingCart className="h-6 w-6 text-accent" />
                    Món Đã Đặt ({orderItems.length})
                  </CardTitle>
                  <Button
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                    size="sm"
                    onClick={() => setIsAddingDishes(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Món
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {orderItems.map((item, index) => {
                    const dish = mockDishes.find((d) => d.id === item.dish_id);
                    const statusConfig = itemStatusConfig[item.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <Card className="border-2 border-accent/10 hover:border-accent/30 transition-all hover:shadow-lg">
                          <CardContent className="p-5">
                            <div className="flex gap-4">
                              {/* Dish Image */}
                              {dish && (
                                <motion.div
                                  className="relative w-28 h-28 rounded-lg overflow-hidden flex-shrink-0"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <Image
                                    src={
                                      dish.media_urls[0] || "/placeholder.svg"
                                    }
                                    alt={dish.name}
                                    fill
                                    className="object-cover"
                                  />
                                </motion.div>
                              )}

                              {/* Dish Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg text-primary mb-1">
                                      {item.dish_name}
                                    </h4>
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        statusConfig.color
                                      )}
                                    >
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {statusConfig.label}
                                    </Badge>
                                  </div>
                                  {item.status === "pending" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancelItem(item.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleUpdateQuantity(item.id, -1)
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
                                        handleUpdateQuantity(item.id, 1)
                                      }
                                      className="border-accent/20"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {/* Price */}
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">
                                      {item.price.toLocaleString("vi-VN")}đ /món
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

                {orderItems.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Đơn hàng trống</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle>Thao Tác</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleRequestSupport}
                  className="border-accent/20 hover:bg-accent/10"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Gọi Nhân Viên
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/complaints?orderId=${id}`)}
                  className="border-accent/20 hover:bg-accent/10"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Khiếu Nại / Góp Ý
                </Button>
                {order.paid === 0 && (
                  <Button
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                    onClick={handleRequestPayment}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Yêu Cầu Thanh Toán
                  </Button>
                )}
                {order.paid > 0 &&
                  orderItems.every((i) => i.status === "served") && (
                    <Button
                      variant="outline"
                      onClick={handleReview}
                      className="border-accent/20 hover:bg-accent/10"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Đánh Giá Bữa Ăn
                    </Button>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="sticky top-24 border-2 border-accent/20 shadow-xl">
              <CardHeader>
                <CardTitle className="font-elegant text-xl">Tổng Kết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính:</span>
                    <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{discount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Thuế (10%):</span>
                    <span>{tax.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-xl">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">
                      {total.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                {/* Voucher Input */}
                <div className="pt-4 border-t">
                  <Label className="text-sm mb-2 block">Mã Giảm Giá</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã..."
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="border-accent/20 focus:border-accent"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyVoucher}
                      disabled={!voucherCode || isApplyingVoucher}
                      className="border-accent/20"
                    >
                      <Gift className="h-4 w-4" />
                    </Button>
                  </div>
                  {isApplyingVoucher && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Đã áp dụng voucher
                    </p>
                  )}
                </div>

                {/* Payment Status */}
                {order.paid > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Đã thanh toán:
                      </span>
                      <span className="text-green-600 font-semibold">
                        {order.paid.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Còn lại:</span>
                      <span className="font-semibold">
                        {(total - order.paid).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                )}

                {/* Invoice Button */}
                {order.paid > 0 && (
                  <Button
                    variant="outline"
                    className="w-full border-accent/20 hover:bg-accent/10"
                    onClick={() => window.print()}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Xem Hóa Đơn
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
