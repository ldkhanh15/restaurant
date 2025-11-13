"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  ArrowLeft,
  UtensilsCrossed,
  CreditCard,
  Gift,
  Wallet,
} from "lucide-react";
import { tableService, type TableAttributes } from "@/services/tableService";
import { dishService, type Dish } from "@/services/dishService";
import { orderService, type Order } from "@/services/orderService";
import guestOrderService, {
  type GuestOrder,
} from "@/services/guestOrderService";
import { useCartStore } from "@/store/cartStore";
import { useTableSocket } from "@/hooks/useTableSocket";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function TableOrderPage() {
  const params = useParams();
  const tableId = params.id as string;
  const router = useRouter();
  const [table, setTable] = useState<TableAttributes | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<Order | GuestOrder | null>(
    null
  );
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [showMenu, setShowMenu] = useState(false); // Toggle between order view and menu
  const [voucherCode, setVoucherCode] = useState("");
  const [isVoucherProcessing, setIsVoucherProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"vnpay" | "cash">("vnpay");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // WebSocket for real-time updates
  const {
    isConnected,
    tableStatus,
    currentOrder: socketOrder,
  } = useTableSocket(tableId);

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setTableId: setTableIdInStore,
    getTotal,
  } = useCartStore();

  // Load table, dishes, and check for existing order
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load table info
        const tableResponse = await tableService.getById(tableId);
        if (tableResponse.status === "success" && tableResponse.data) {
          setTable(tableResponse.data);
          setTableIdInStore(tableResponse.data.id);
        }

        // Load dishes
        const dishesResponse = await dishService.getAll({ all: true });
        // Handle different response formats
        let dishesData: Dish[] = [];
        if (dishesResponse) {
          // Format 1: { data: { data: [...], pagination: {...} } }
          if (
            dishesResponse.data?.data &&
            Array.isArray(dishesResponse.data.data)
          ) {
            dishesData = dishesResponse.data.data;
          }
          // Format 2: { data: [...] }
          else if (Array.isArray(dishesResponse.data)) {
            dishesData = dishesResponse.data;
          }
          // Format 3: { items: [...] }
          else if (Array.isArray(dishesResponse.items)) {
            dishesData = dishesResponse.items;
          }
          // Format 4: Direct array
          else if (Array.isArray(dishesResponse)) {
            dishesData = dishesResponse;
          }
        }
        setDishes(dishesData);

        // Extract categories
        const uniqueCategories = Array.from(
          new Set(dishesData.map((d: Dish) => d.category_id))
        );
        setCategories(uniqueCategories);

        // Check for existing active order on this table using guest API
        setIsLoadingOrder(true);
        try {
          const orderResponse = await guestOrderService.getCurrentOrder(
            tableId
          );
          if (orderResponse.status === "success" && orderResponse.data) {
            setCurrentOrder(orderResponse.data);
            localStorage.setItem("current_order_id", orderResponse.data.id);
            localStorage.setItem("current_table_id", tableId);
          }
        } catch (err: any) {
          // No active order found - that's okay, we'll create one when user adds items
          console.log("No active order found for table:", err.message);
        } finally {
          setIsLoadingOrder(false);
        }
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (tableId) {
      loadData();
    }
  }, [tableId, setTableIdInStore]);

  // Update table status from WebSocket
  useEffect(() => {
    if (tableStatus && table) {
      setTable({ ...table, status: tableStatus as any });
    }
  }, [tableStatus, table]);

  // Update current order from WebSocket
  useEffect(() => {
    if (socketOrder) {
      setCurrentOrder(socketOrder);
      localStorage.setItem("current_order_id", socketOrder.id);
      localStorage.setItem("current_table_id", tableId);
    }
  }, [socketOrder, tableId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Không tìm thấy bàn</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Về trang chủ
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
    cleaning: "bg-blue-500",
  };

  const statusLabels = {
    available: "Còn trống",
    reserved: "Đã đặt",
    occupied: "Đang dùng",
    cleaning: "Đang dọn dẹp",
  };

  const filteredDishes = Array.isArray(dishes)
    ? selectedCategory === "all"
      ? dishes
      : dishes.filter((d) => d.category_id === selectedCategory)
    : [];

  const handleAddDish = (dish: Dish) => {
    addItem({
      dish_id: dish.id,
      dish_name: dish.name,
      quantity: 1,
      price: dish.price,
    });
    toast({
      title: "Đã thêm món",
      description: `${dish.name} đã được thêm vào giỏ hàng`,
      variant: "success",
    });
  };

  const handleCallWaiter = async () => {
    if (!currentOrder) {
      toast({
        title: "Chưa có đơn hàng",
        description: "Vui lòng tạo đơn hàng trước",
        variant: "warning",
      });
      return;
    }

    try {
      await guestOrderService.requestSupport(tableId);
      toast({
        title: "Đã gọi nhân viên",
        description: "Nhân viên đang đến bàn của bạn...",
        variant: "info",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gọi nhân viên",
        variant: "destructive",
      });
    }
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng chọn món trước khi gửi đơn",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use guest order service to add items
      // This will create order if not exists, or add to existing order
      for (const item of items) {
        const response = await guestOrderService.addItem(tableId, {
          dish_id: item.dish_id,
          quantity: item.quantity,
        });

        // Update current order from response
        if (response.status === "success" && response.data) {
          setCurrentOrder(response.data);
          localStorage.setItem("current_order_id", response.data.id);
          localStorage.setItem("current_table_id", tableId);
        }
      }

      toast({
        title: "Đã thêm món vào đơn hàng",
        description: "Các món đã được thêm vào đơn hàng",
        variant: "success",
      });
      clearCart();

      // Refresh order to get latest data
      if (currentOrder) {
        const orderResponse = await guestOrderService.getCurrentOrder(tableId);
        if (orderResponse.status === "success" && orderResponse.data) {
          setCurrentOrder(orderResponse.data);
          setShowMenu(false); // Switch to order view
        }
      }
    } catch (error: any) {
      console.error("Error submitting order:", error);
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Không thể thêm món vào đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If table has an active order, show order view instead of menu (unless showMenu is true)
  if (currentOrder && !isLoadingOrder && !showMenu) {
    const itemStatusConfig: Record<string, { label: string; color: string }> = {
      pending: {
        label: "Chờ xác nhận",
        color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/50",
      },
      preparing: {
        label: "Đang chuẩn bị",
        color: "bg-blue-500/20 text-blue-700 border-blue-500/50",
      },
      ready: {
        label: "Sẵn sàng",
        color: "bg-green-500/20 text-green-700 border-green-500/50",
      },
      completed: {
        label: "Hoàn thành",
        color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/50",
      },
      cancelled: {
        label: "Đã hủy",
        color: "bg-red-500/20 text-red-700 border-red-500/50",
      },
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-cream-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/tables/${tableId}`)}
                className="border-accent/20 hover:bg-accent/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                  Bàn {table.table_number}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <p className="text-lg">
                    Mã đơn:{" "}
                    <span className="font-mono font-semibold text-primary">
                      {currentOrder.id.slice(0, 8).toUpperCase()}
                    </span>
                  </p>
                  {isConnected && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                      Đã kết nối
                    </Badge>
                  )}
                </div>
              </div>
              <Badge
                className={cn(
                  "text-white px-6 py-3 text-base font-semibold shadow-lg",
                  currentOrder.status === "dining"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                    : "bg-gradient-to-r from-gray-500 to-gray-600"
                )}
              >
                {currentOrder.status === "dining"
                  ? "Đang dùng bữa"
                  : currentOrder.status}
              </Badge>
            </div>
          </motion.div>

          {/* Order Info Cards - Enhanced */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Tổng tiền
                </p>
                <p className="text-3xl font-bold text-primary">
                  {Number(
                    currentOrder.final_amount || currentOrder.total_amount || 0
                  ).toLocaleString("vi-VN")}
                  <span className="text-lg ml-1">đ</span>
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-500/20 shadow-lg bg-gradient-to-br from-blue-500/5 to-background">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Số món
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {currentOrder.items?.length || 0}
                  <span className="text-lg ml-1">món</span>
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-500/20 shadow-lg bg-gradient-to-br from-green-500/5 to-background">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Trạng thái
                </p>
                <p className="text-lg font-semibold text-green-600">
                  {currentOrder.payment_status === "paid"
                    ? "Đã thanh toán"
                    : "Chưa thanh toán"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Items - Enhanced */}
          <Card className="shadow-xl border-2 border-border/50">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <CardTitle className="text-2xl flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
                Danh sách món đã đặt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {currentOrder.items && currentOrder.items.length > 0 ? (
                <div className="space-y-4">
                  {currentOrder.items.map((item: any, index: number) => {
                    const statusInfo = itemStatusConfig[item.status] || {
                      label: item.status,
                      color: "bg-gray-500/20 text-gray-700 border-gray-500/50",
                    };
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-5 border-2 rounded-xl hover:shadow-lg transition-all bg-gradient-to-r from-background to-muted/30"
                      >
                        <div className="flex-1 flex items-center gap-4">
                          {item.dish?.media_urls?.[0] && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={item.dish.media_urls[0]}
                                alt={item.dish.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-lg mb-1">
                              {item.dish?.name || "Món ăn"}
                            </p>
                            <div className="flex items-center gap-3">
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} x{" "}
                                {Number(
                                  item.price || item.dish?.price || 0
                                ).toLocaleString("vi-VN")}
                                đ
                              </p>
                              <Badge
                                className={cn(
                                  "text-xs font-medium border",
                                  statusInfo.color
                                )}
                              >
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-primary">
                            {(
                              Number(item.quantity) *
                              Number(item.price || item.dish?.price || 0)
                            ).toLocaleString("vi-VN")}
                            <span className="text-sm ml-1">đ</span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg text-muted-foreground font-medium">
                    Chưa có món trong đơn hàng
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Hãy chọn món để bắt đầu
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions - Enhanced */}
          <div className="mt-8 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={() => setShowMenu(true)}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Thêm món
              </Button>
              <Button
                onClick={() => router.push(`/orders/${currentOrder.id}`)}
                size="lg"
                variant="outline"
                className="border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 shadow-md hover:shadow-lg transition-all"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Xem chi tiết
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleCallWaiter}
                className="border-2 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 shadow-md hover:shadow-lg transition-all"
              >
                <Phone className="h-5 w-5 mr-2" />
                Gọi nhân viên
              </Button>
            </div>
            {/* Voucher Section */}
            {currentOrder && currentOrder.status === "dining" && (
              <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-600" />
                    Mã giảm giá
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentOrder.voucher ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-purple-700">
                          {currentOrder.voucher.code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          -{Number(currentOrder.voucher_discount_amount || 0).toLocaleString("vi-VN")}đ
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setIsVoucherProcessing(true);
                          try {
                            const response = await guestOrderService.removeVoucher(tableId);
                            if (response.status === "success") {
                              setCurrentOrder(response.data);
                              toast({
                                title: "Đã xóa voucher",
                                description: "Voucher đã được xóa khỏi đơn hàng",
                                variant: "success",
                              });
                            }
                          } catch (error: any) {
                            toast({
                              title: "Lỗi",
                              description: error.response?.data?.message || "Không thể xóa voucher",
                              variant: "destructive",
                            });
                          } finally {
                            setIsVoucherProcessing(false);
                          }
                        }}
                        disabled={isVoucherProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button
                        onClick={async () => {
                          if (!voucherCode.trim()) {
                            toast({
                              title: "Thiếu mã voucher",
                              description: "Vui lòng nhập mã giảm giá",
                              variant: "warning",
                            });
                            return;
                          }
                          setIsVoucherProcessing(true);
                          try {
                            const response = await guestOrderService.applyVoucher(
                              tableId,
                              voucherCode.trim()
                            );
                            if (response.status === "success") {
                              setCurrentOrder(response.data);
                              setVoucherCode("");
                              toast({
                                title: "Áp dụng voucher thành công",
                                description: "Voucher đã được áp dụng vào đơn hàng",
                                variant: "success",
                              });
                            }
                          } catch (error: any) {
                            toast({
                              title: "Lỗi",
                              description: error.response?.data?.message || "Không thể áp dụng voucher",
                              variant: "destructive",
                            });
                          } finally {
                            setIsVoucherProcessing(false);
                          }
                        }}
                        disabled={isVoucherProcessing || !voucherCode.trim()}
                      >
                        {isVoucherProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Áp dụng
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Button */}
            {currentOrder && currentOrder.status === "dining" && (
              <Button
                onClick={() => setShowPaymentDialog(true)}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all text-lg font-semibold py-6"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Yêu cầu thanh toán
              </Button>
            )}

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Chọn phương thức thanh toán</DialogTitle>
                  <DialogDescription>
                    Vui lòng chọn hình thức thanh toán cho đơn hàng
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={(value) =>
                      setSelectedPaymentMethod(value as "vnpay" | "cash")
                    }
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="vnpay" id="vnpay" />
                      <Label htmlFor="vnpay" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">VNPAY</span>
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Thanh toán trực tuyến qua cổng VNPAY
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Tiền mặt</span>
                          <Wallet className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Thanh toán trực tiếp tại bàn
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentDialog(false)}
                    disabled={isProcessingPayment}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={async () => {
                      setIsProcessingPayment(true);
                      try {
                        const hasFailedPayment = currentOrder?.payment_status === "failed";
                        let response;

                        if (selectedPaymentMethod === "vnpay") {
                          if (hasFailedPayment) {
                            response = await guestOrderService.requestPaymentRetry(
                              tableId,
                              "vnpay"
                            );
                          } else {
                            response = await guestOrderService.requestPayment(tableId, {
                              method: "vnpay",
                            });
                          }

                          if (response.status === "success" && response.data.redirect_url) {
                            window.location.href = response.data.redirect_url;
                            return;
                          }
                        } else {
                          // Cash payment
                          response = await guestOrderService.requestCashPayment(tableId);
                          if (response.status === "success") {
                            toast({
                              title: "Đã gửi yêu cầu thanh toán tiền mặt",
                              description: "Nhân viên sẽ đến bàn của bạn",
                              variant: "success",
                            });
                            setShowPaymentDialog(false);
                            // Refresh order
                            const orderResponse = await guestOrderService.getCurrentOrder(tableId);
                            if (orderResponse.status === "success") {
                              setCurrentOrder(orderResponse.data);
                            }
                            return;
                          }
                        }

                        toast({
                          title: "Lỗi",
                          description: "Không thể xử lý thanh toán. Vui lòng thử lại.",
                          variant: "destructive",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Lỗi",
                          description:
                            error.response?.data?.message ||
                            "Không thể yêu cầu thanh toán",
                          variant: "destructive",
                        });
                      } finally {
                        setIsProcessingPayment(false);
                      }
                    }}
                    disabled={isProcessingPayment}
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        {selectedPaymentMethod === "vnpay" ? (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Thanh toán VNPAY
                          </>
                        ) : (
                          <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Yêu cầu thanh toán tiền mặt
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-cream-50">
      {/* Header - Enhanced */}
      <div className="bg-gradient-to-b from-primary/10 via-background to-background py-8 border-b-2 border-primary/20 sticky top-0 z-40 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3">
                Bàn {table.table_number}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full border border-primary/20">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {table.location?.floor || "Tầng 1"}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full border border-primary/20">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {table.capacity} người
                  </span>
                </div>
                <Badge
                  className={cn(
                    statusColors[table.status] || "bg-gray-500",
                    "text-white px-4 py-1.5 text-sm font-semibold shadow-md"
                  )}
                >
                  {statusLabels[table.status] || table.status}
                </Badge>
                {isConnected && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600 bg-green-50 px-4 py-1.5 text-sm font-semibold"
                  >
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                    Đã kết nối
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={handleCallWaiter}
              variant="outline"
              size="lg"
              className="border-2 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 shadow-md hover:shadow-lg transition-all"
            >
              <Phone className="h-5 w-5 mr-2" />
              Gọi nhân viên
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Show back to order button if order exists */}
        {currentOrder && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Chọn món để thêm vào đơn hàng
              </h2>
              <p className="text-sm text-muted-foreground">
                Đơn hàng: {currentOrder.id.slice(0, 8)} -{" "}
                {currentOrder.items?.length || 0} món
              </p>
            </div>
            <Button onClick={() => setShowMenu(false)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại đơn hàng
            </Button>
          </div>
        )}
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
                const category = dishes.find(
                  (d) => d.category_id === catId
                )?.category;
                return (
                  <Button
                    key={catId}
                    variant={selectedCategory === catId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(catId)}
                  >
                    {category?.name || "Danh mục"}
                  </Button>
                );
              })}
            </div>

            {/* Dishes Grid - Enhanced */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDishes.map((dish, index) => (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="hover:shadow-2xl transition-all border-2 hover:border-primary/50 overflow-hidden group bg-gradient-to-br from-background to-muted/30">
                    <div className="aspect-square relative overflow-hidden">
                      {dish.media_urls && dish.media_urls[0] ? (
                        <Image
                          src={dish.media_urls[0]}
                          alt={dish.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {dish.is_best_seller && (
                        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg border-0">
                          ⭐ Bán chạy
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleAddDish(dish)}
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-white shadow-xl"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Thêm
                      </Button>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {dish.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                        {dish.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xl text-primary">
                          {dish.price.toLocaleString("vi-VN")}
                          <span className="text-sm ml-1">đ</span>
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleAddDish(dish)}
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-md hover:shadow-lg"
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

          {/* Cart Sidebar - Enhanced */}
          <div className="space-y-6">
            <Card className="sticky top-24 border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  Giỏ Hàng
                  <Badge className="ml-auto bg-primary text-white">
                    {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {items.length > 0 ? (
                  <>
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                      {items.map((item, index) => (
                        <motion.div
                          key={item.dish_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-all bg-gradient-to-r from-background to-muted/20"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-base mb-1">
                              {item.dish_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
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
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center font-bold text-base">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(item.dish_id, item.quantity + 1)
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(item.dish_id)}
                              className="ml-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="font-semibold text-lg">
                          Tổng cộng:
                        </span>
                        <span className="text-primary text-2xl font-bold">
                          {getTotal().toLocaleString("vi-VN")}
                          <span className="text-base ml-1">đ</span>
                        </span>
                      </div>
                      <Button
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        size="lg"
                        className="w-full bg-gradient-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:via-primary hover:to-primary/90 text-white shadow-xl hover:shadow-2xl transition-all text-base font-semibold py-6"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Gửi đơn hàng
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <ShoppingCart className="h-20 w-20 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-base font-medium text-muted-foreground mb-2">
                      Giỏ hàng trống
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chọn món để thêm vào giỏ
                    </p>
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
