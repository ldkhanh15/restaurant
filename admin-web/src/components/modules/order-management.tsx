"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react";
import { useOrderWebSocket } from "@/hooks/useWebSocket";
import { orderService } from "@/services/orderService";
import { useToast } from "@/components/ui/use-toast";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  table_id?: string;
  table_name?: string;
  customer_name?: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  dish_name: string;
  quantity: number;
  price: number;
  status: string;
}

interface OrderManagementProps {
  className?: string;
}

const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Chờ xử lý",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "confirmed",
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "preparing",
    label: "Đang chuẩn bị",
    color: "bg-orange-100 text-orange-800",
  },
  { value: "ready", label: "Sẵn sàng", color: "bg-green-100 text-green-800" },
  {
    value: "served",
    label: "Đã phục vụ",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "completed",
    label: "Hoàn thành",
    color: "bg-gray-100 text-gray-800",
  },
  { value: "cancelled", label: "Đã hủy", color: "bg-red-100 text-red-800" },
];

const ITEM_STATUSES = [
  { value: "pending", label: "Chờ", color: "bg-yellow-100 text-yellow-800" },
  {
    value: "preparing",
    label: "Đang làm",
    color: "bg-orange-100 text-orange-800",
  },
  { value: "ready", label: "Sẵn sàng", color: "bg-green-100 text-green-800" },
  { value: "served", label: "Đã lên", color: "bg-purple-100 text-purple-800" },
];

function OrderManagement({ className }: OrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { toast } = useToast();

  // WebSocket integration
  const {
    isConnected: isWebSocketConnected,
    joinOrder,
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
    onOrderItemStatusChanged,
    onPaymentRequested,
    onPaymentCompleted,
  } = useOrderWebSocket();

  // Load orders on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  // WebSocket event listeners
  useEffect(() => {
    if (!isWebSocketConnected) return;

    const handleOrderCreated = (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
      setLastUpdate(new Date());
      toast({
        title: "Đơn hàng mới",
        description: `Đơn hàng #${newOrder.order_number} đã được tạo`,
      });
    };

    const handleOrderUpdated = (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      setLastUpdate(new Date());

      if (selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
      }
    };

    const handleOrderStatusChanged = (order: Order) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: order.status } : o
        )
      );
      setLastUpdate(new Date());

      toast({
        title: "Trạng thái đơn hàng thay đổi",
        description: `Đơn hàng #${
          order.order_number
        } chuyển sang ${getStatusLabel(order.status)}`,
      });
    };

    const handleItemStatusChanged = (data: {
      orderId: string;
      itemId: string;
      status: string;
    }) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === data.orderId) {
            return {
              ...order,
              items: order.items.map((item) =>
                item.id === data.itemId
                  ? { ...item, status: data.status }
                  : item
              ),
            };
          }
          return order;
        })
      );
      setLastUpdate(new Date());
    };

    const handlePaymentRequested = (order: Order) => {
      toast({
        title: "Yêu cầu thanh toán",
        description: `Đơn hàng #${order.order_number} yêu cầu thanh toán`,
      });
    };

    const handlePaymentCompleted = (order: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "completed" } : o))
      );
      setLastUpdate(new Date());

      toast({
        title: "Thanh toán thành công",
        description: `Đơn hàng #${order.order_number} đã thanh toán`,
      });
    };

    onOrderCreated(handleOrderCreated);
    onOrderUpdated(handleOrderUpdated);
    onOrderStatusChanged(handleOrderStatusChanged);
    onOrderItemStatusChanged(handleItemStatusChanged);
    onPaymentRequested(handlePaymentRequested);
    onPaymentCompleted(handlePaymentCompleted);

    return () => {
      // Cleanup listeners
    };
  }, [
    isWebSocketConnected,
    selectedOrder,
    toast,
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
    onOrderItemStatusChanged,
    onPaymentRequested,
    onPaymentCompleted,
  ]);

  // Filter orders when search term or status filter changes
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    console.log(filtered);
    console.log(orders);
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.getAllOrders({
        page: 1,
        limit: 100,
        sortBy: "created_at",
        sortOrder: "DESC",
      });

      if (response.data?.data) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái đơn hàng thành công",
      });
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng",
        variant: "destructive",
      });
    }
  };

  const updateItemStatus = async (
    orderId: string,
    itemId: string,
    newStatus: string
  ) => {
    try {
      await orderService.updateOrderItemStatus(orderId, itemId, newStatus);
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái món ăn thành công",
      });
    } catch (error) {
      console.error("Failed to update item status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái món ăn",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    return ORDER_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return (
      ORDER_STATUSES.find((s) => s.value === status)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getItemStatusLabel = (status: string) => {
    return ITEM_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getItemStatusColor = (status: string) => {
    return (
      ITEM_STATUSES.find((s) => s.value === status)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <div className={`w-full ${className}`}>
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Quản lý đơn hàng
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* WebSocket Connection Status */}
              <Badge variant={isWebSocketConnected ? "default" : "destructive"}>
                {isWebSocketConnected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Kết nối
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Mất kết nối
                  </>
                )}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={loadOrders}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>
            </div>
      </div>

          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm đơn hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

          <div className="text-sm text-gray-500">
            Cập nhật lần cuối: {lastUpdate.toLocaleTimeString("vi-VN")}
          </div>
        </CardHeader>

            <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Danh sách đơn hàng</TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedOrder}>
                Chi tiết đơn hàng
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Đang tải đơn hàng...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không có đơn hàng nào</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedOrder?.id === order.id
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                #{order.order_number}
                              </h3>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Bàn:</span>{" "}
                                {order.table_name || "Chưa chọn bàn"}
                              </div>
                              <div>
                                <span className="font-medium">Khách hàng:</span>{" "}
                                {order.customer_name || "Khách vãng lai"}
                              </div>
                              <div>
                                <span className="font-medium">Tổng tiền:</span>{" "}
                                {formatCurrency(order.total_amount)}
                              </div>
                        <div>
                                <span className="font-medium">Thời gian:</span>{" "}
                                {formatDateTime(order.created_at)}
                              </div>
                            </div>
                        </div>
                          <div className="flex flex-col gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              updateOrderStatus(order.id, value)
                            }
                          >
                              <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_STATUSES.map((status) => (
                                  <SelectItem
                                    key={status.value}
                                    value={status.value}
                                  >
                                    {status.label}
                              </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        </div>
            </CardContent>
          </Card>
                  ))
                )}
              </div>
        </TabsContent>

            <TabsContent value="details" className="mt-4">
              {selectedOrder && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Chi tiết đơn hàng #{selectedOrder.order_number}
                        </CardTitle>
                  </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="font-medium">Trạng thái:</span>
                        <Badge
                            className={`ml-2 ${getStatusColor(
                              selectedOrder.status
                            )}`}
                          >
                            {getStatusLabel(selectedOrder.status)}
                        </Badge>
                      </div>
                <div>
                          <span className="font-medium">Tổng tiền:</span>{" "}
                          {formatCurrency(selectedOrder.total_amount)}
                </div>
                <div>
                          <span className="font-medium">Bàn:</span>{" "}
                          {selectedOrder.table_name || "Chưa chọn bàn"}
                </div>
                <div>
                          <span className="font-medium">Khách hàng:</span>{" "}
                          {selectedOrder.customer_name || "Khách vãng lai"}
                </div>
                <div>
                          <span className="font-medium">Thời gian tạo:</span>{" "}
                          {formatDateTime(selectedOrder.created_at)}
                  </div>
                </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Danh sách món ăn</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedOrder?.items?.map((item) => (
                    <div
                      key={item.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium">{item.dish_name}</h4>
                              <div className="text-sm text-gray-600">
                                Số lượng: {item.quantity} | Giá:{" "}
                                {formatCurrency(item.price)}
                              </div>
                      </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getItemStatusColor(item.status)}
                              >
                                {getItemStatusLabel(item.status)}
                              </Badge>
                              <Select
                                value={item.status}
                                onValueChange={(value) =>
                                  updateItemStatus(
                                    selectedOrder.id,
                                    item.id,
                                    value
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ITEM_STATUSES.map((status) => (
                                    <SelectItem
                                      key={status.value}
                                      value={status.value}
                                    >
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                      </div>
                    </div>
                  ))}
                </div>
                    </CardContent>
                  </Card>
            </div>
          )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default OrderManagement;
export { OrderManagement };
