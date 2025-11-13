"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  ShoppingCart,
  Search,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  containerVariants,
  itemVariants,
  cardVariants,
  pageVariants,
  buttonVariants,
  viewportOptions,
} from "@/lib/motion-variants";
import { orderService, type Order } from "@/services/orderService";
import { useOrderStore } from "@/store/orderStore";
import { useEnsureAuthenticated } from "@/hooks/useEnsureAuthenticated";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor?: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    color: "text-yellow-700",
    bgColor: "bg-yellow-500",
  },
  dining: {
    label: "Đang phục vụ",
    color: "text-blue-700",
    bgColor: "bg-blue-500",
  },
  preparing: {
    label: "Đang chuẩn bị",
    color: "text-yellow-700",
    bgColor: "bg-yellow-500",
  },
  waiting_payment: {
    label: "Chờ thanh toán",
    color: "text-orange-700",
    bgColor: "bg-orange-500",
  },
  paid: {
    label: "Đã thanh toán",
    color: "text-green-700",
    bgColor: "bg-green-500",
  },
  cancelled: {
    label: "Đã hủy",
    color: "text-red-700",
    bgColor: "bg-red-500",
  },
  completed: {
    label: "Hoàn thành",
    color: "text-green-700",
    bgColor: "bg-green-500",
  },
};

export default function OrdersPage() {
  const router = useRouter();
  // Allow guest access for walk-in customers
  const { user, isLoading: authLoading } = useEnsureAuthenticated({
    optional: true,
  });
  const orderSocket = useOrderSocket();
  const {
    orders,
    isLoading,
    error,
    setOrders,
    setLoading,
    setError,
    updateOrderInList,
  } = useOrderStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load orders on mount - support both authenticated and guest users
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        let ordersData: any[] = [];

        if (user?.id) {
          // Load orders for authenticated user
          const response = await orderService.getMyOrders({
            page: 1,
            limit: 50,
          });

          if (response.status === "success") {
            ordersData = Array.isArray(response.data.data)
              ? response.data.data
              : Array.isArray(response.data)
              ? response.data
              : [];
          }
        } else {
          // For guest users, load orders from localStorage (walk-in customers)
          const savedOrderId = localStorage.getItem("current_order_id");
          const savedTableId = localStorage.getItem("current_table_id");

          if (savedOrderId) {
            try {
              const orderResponse = await orderService.getOrderById(
                savedOrderId
              );
              if (orderResponse.status === "success" && orderResponse.data) {
                ordersData = [orderResponse.data];
              }
            } catch (err) {
              // Order might not exist or expired, clear localStorage
              localStorage.removeItem("current_order_id");
              localStorage.removeItem("current_table_id");
            }
          }
        }

        setOrders(ordersData);
      } catch (err: any) {
        console.error("Failed to load orders:", err);
        setError(err.message || "Không thể tải danh sách đơn hàng");
        toast({
          title: "Lỗi",
          description: err.message || "Không thể tải danh sách đơn hàng",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user?.id, authLoading, setOrders, setLoading, setError]);

  // Listen to real-time order updates
  useEffect(() => {
    if (!orderSocket.isConnected) return;

    // Listen to order updates
    const handleOrderUpdated = (order: any) => {
      console.log("[Orders] Order updated:", order);
      const totalAmount =
        typeof order.total_amount === "number"
          ? order.total_amount
          : typeof order.total === "number"
          ? order.total
          : 0;
      const finalAmount =
        typeof order.final_amount === "number"
          ? order.final_amount
          : totalAmount;
      updateOrderInList(order.id, {
        status: order.status as any,
        updated_at: order.updated_at,
        total_amount: totalAmount,
        final_amount: finalAmount,
      });
      toast({
        title: "Cập nhật đơn hàng",
        description: `Đơn hàng ${order.id} đã được cập nhật`,
      });
    };

    // Listen to status changes
    const handleStatusChanged = (order: any) => {
      console.log("[Orders] Order status changed:", order);
      updateOrderInList(order.id, {
        status: order.status as any,
        updated_at: order.updated_at,
      });
      toast({
        title: "Trạng thái thay đổi",
        description: `Đơn hàng ${order.id} đã chuyển sang "${
          statusConfig[order.status]?.label || order.status
        }"`,
      });
    };

    // Listen to new orders
    const handleOrderCreated = (order: any) => {
      console.log("[Orders] New order created:", order);
      // For authenticated users, check user_id. For guests, check if order matches saved order
      const savedOrderId = localStorage.getItem("current_order_id");
      const isMyOrder = user?.id
        ? order.user_id === user.id || order.customer_id === user.id
        : savedOrderId === order.id;

      if (isMyOrder) {
        const totalAmount =
          typeof order.total_amount === "number"
            ? order.total_amount
            : typeof order.total === "number"
            ? order.total
            : 0;
        const finalAmount =
          typeof order.final_amount === "number"
            ? order.final_amount
            : totalAmount;
        // Convert socket Order to service Order format
        const newOrder: Order = {
          id: order.id,
          user_id: order.user_id,
          customer_id: order.customer_id,
          table_id: order.table_id,
          status: order.status as any,
          payment_status: "pending",
          total_amount: totalAmount,
          final_amount: finalAmount,
          created_at: order.created_at,
          updated_at: order.updated_at,
          ...order,
        };
        setOrders((prev: Order[]) => [newOrder, ...prev]);
        toast({
          title: "Đơn hàng mới",
          description: `Đơn hàng ${order.id.slice(0, 8)} đã được tạo`,
          variant: "success",
        });
      }
    };

    // Listen to payment completion
    const handlePaymentCompleted = (order: any) => {
      console.log("[Orders] Payment completed:", order);
      const savedOrderId = localStorage.getItem("current_order_id");
      const isMyOrder = user?.id
        ? order.user_id === user.id || order.customer_id === user.id
        : savedOrderId === order.id;

      if (isMyOrder) {
        updateOrderInList(order.id, {
          status: "paid" as any,
          payment_status: "paid" as any,
          updated_at: order.updated_at,
        });
        toast({
          title: "Thanh toán thành công",
          description: `Đơn hàng ${order.id.slice(0, 8)} đã được thanh toán`,
          variant: "success",
        });
      }
    };

    // Listen to order item events - update order totals
    const handleItemCreated = (data: any) => {
      console.log("[Orders] Order item created:", data);
      if (data.orderId && data.order) {
        updateOrderInList(data.orderId, {
          total_amount:
            data.order.total_amount ??
            data.order.final_amount ??
            data.order.total ??
            0,
          final_amount:
            data.order.final_amount ??
            data.order.total_amount ??
            data.order.total ??
            0,
          updated_at: data.updatedAt,
        });
      }
    };

    const handleItemQuantityChanged = (data: any) => {
      console.log("[Orders] Order item quantity changed:", data);
      if (data.orderId && data.order) {
        updateOrderInList(data.orderId, {
          total_amount:
            data.order.total_amount ??
            data.order.final_amount ??
            data.order.total ??
            0,
          final_amount:
            data.order.final_amount ??
            data.order.total_amount ??
            data.order.total ??
            0,
          updated_at: data.updatedAt,
        });
      }
    };

    const handleItemDeleted = (data: any) => {
      console.log("[Orders] Order item deleted:", data);
      if (data.orderId && data.order) {
        updateOrderInList(data.orderId, {
          total_amount:
            data.order.total_amount ??
            data.order.final_amount ??
            data.order.total ??
            0,
          final_amount:
            data.order.final_amount ??
            data.order.total_amount ??
            data.order.total ??
            0,
          updated_at: data.updatedAt,
        });
      }
    };

    const handleItemStatusChanged = (data: any) => {
      console.log("[Orders] Order item status changed:", data);
      if (data.orderId && data.order) {
        updateOrderInList(data.orderId, {
          total_amount:
            data.order.total_amount ??
            data.order.final_amount ??
            data.order.total ??
            0,
          final_amount:
            data.order.final_amount ??
            data.order.total_amount ??
            data.order.total ??
            0,
          updated_at: data.updatedAt,
        });
      }
    };

    // Register all listeners
    orderSocket.onOrderUpdated(handleOrderUpdated);
    orderSocket.onOrderStatusChanged(handleStatusChanged);
    orderSocket.onOrderCreated(handleOrderCreated);
    orderSocket.onPaymentCompleted(handlePaymentCompleted);
    orderSocket.onOrderItemCreated(handleItemCreated);
    orderSocket.onOrderItemQuantityChanged(handleItemQuantityChanged);
    orderSocket.onOrderItemDeleted(handleItemDeleted);
    orderSocket.onOrderItemStatusChanged(handleItemStatusChanged);

    // Cleanup function
    return () => {
      // Note: Socket listeners are managed by the hook, but we can add cleanup if needed
    };
  }, [
    orderSocket.isConnected,
    orderSocket,
    user?.id,
    updateOrderInList,
    setOrders,
  ]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.table?.table_number &&
        order.table.table_number
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Allow guest users to view their walk-in orders
  // No need to redirect - they can see orders from localStorage

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-8"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-elegant text-4xl md:text-5xl font-bold text-primary mb-2"
          >
            Đơn Hàng Của Tôi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Xem và quản lý tất cả đơn hàng của bạn
          </motion.p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6 border-2 border-accent/20 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col md:flex-row gap-4"
              >
                <motion.div
                  variants={itemVariants}
                  className="relative flex-1"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm đơn hàng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-accent/20 focus:border-accent transition-all duration-200"
                  />
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                >
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48 border-accent/20 focus:border-accent transition-all duration-200">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Đang tải...</span>
          </motion.div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-600">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Orders List */}
        {!isLoading && !error && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => {
                  const status =
                    statusConfig[order.status] || statusConfig["pending"];
                  return (
                    <motion.div
                      key={order.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      whileHover="hover"
                      whileTap="tap"
                      custom={index}
                      viewport={viewportOptions}
                      layout
                    >
                      <Card
                        className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 shadow-lg bg-gradient-to-br from-white to-cream-50/50 overflow-hidden group"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardContent className="p-6 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <motion.h3
                                  whileHover={{ scale: 1.05 }}
                                  className="font-bold text-xl font-elegant bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                                >
                                  Đơn #{order.id.slice(0, 8).toUpperCase()}
                                </motion.h3>
                                <motion.div
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                  }}
                                >
                                  <Badge
                                    className={`${
                                      status.bgColor || "bg-gray-500"
                                    } text-white shadow-lg px-3 py-1 text-xs font-semibold border-2 border-white/20`}
                                  >
                                    {status.label}
                                  </Badge>
                                </motion.div>
                              </div>
                              <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-wrap items-center gap-4 text-sm"
                              >
                                <motion.div
                                  variants={itemVariants}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/20"
                                >
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-gray-700">
                                    {format(
                                      new Date(order.created_at),
                                      "dd/MM/yyyy HH:mm",
                                      { locale: vi }
                                    )}
                                  </span>
                                </motion.div>
                                <motion.div
                                  variants={itemVariants}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 rounded-full border border-accent/20"
                                >
                                  <ShoppingCart className="h-4 w-4 text-accent" />
                                  <span className="font-medium text-gray-700">
                                    {order.items?.length || 0} món
                                  </span>
                                </motion.div>
                                {order.table?.table_number && (
                                  <motion.div
                                    variants={itemVariants}
                                    className="px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200"
                                  >
                                    <span className="font-medium text-blue-700">
                                      Bàn {order.table.table_number}
                                    </span>
                                  </motion.div>
                                )}
                              </motion.div>
                            </div>
                            <div className="text-right ml-4">
                              <motion.div
                                key={order.final_amount}
                                initial={{ scale: 1.1, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="mb-3"
                              >
                                <p className="text-xs text-muted-foreground mb-1">
                                  Tổng tiền
                                </p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                  {Number(
                                    order.final_amount ||
                                      order.total_amount ||
                                      0
                                  ).toLocaleString("vi-VN")}
                                  <span className="text-lg ml-1">đ</span>
                                </p>
                              </motion.div>
                              <motion.div
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                              >
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/orders/${order.id}`);
                                  }}
                                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all"
                                >
                                  Chi tiết
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border-2 border-dashed border-accent/30 bg-gradient-to-br from-cream-50/50 to-white">
                    <CardContent className="p-16 text-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="mb-6"
                      >
                        <div className="relative inline-block">
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                          <ShoppingCart className="h-20 w-20 mx-auto text-primary/60 relative z-10" />
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-2">
                        {searchQuery || statusFilter !== "all"
                          ? "Không tìm thấy đơn hàng"
                          : "Chưa có đơn hàng nào"}
                      </h3>
                      <p className="text-muted-foreground text-base">
                        {searchQuery || statusFilter !== "all"
                          ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                          : "Hãy đặt món để tạo đơn hàng đầu tiên của bạn"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
