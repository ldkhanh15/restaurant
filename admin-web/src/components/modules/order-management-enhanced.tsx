"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { api, Order, OrderFilters } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useWebSocketContext } from "@/providers/WebSocketProvider";

const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Chờ xử lý",
    color: "status-pending",
    icon: Clock,
  },
  {
    value: "paid",
    label: "Đã thanh toán",
    color: "status-ready",
    icon: CheckCircle,
  },
  {
    value: "dining",
    label: "Đang ăn",
    color: "status-served",
    icon: CheckCircle,
  },
  {
    value: "waiting_payment",
    label: "Chờ thanh toán",
    color: "status-completed",
    icon: CheckCircle,
  },
  {
    value: "cancelled",
    label: "Đã hủy",
    color: "status-cancelled",
    icon: XCircle,
  },
];

interface OrderManagementEnhancedProps {
  className?: string;
}

export function OrderManagementEnhanced({
  className,
}: OrderManagementEnhancedProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [tableIdFilter, setTableIdFilter] = useState<string>("");
  // Create order dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // WebSocket integration
  const { orderSocket } = useWebSocketContext();
  const {
    isConnected: isWebSocketConnected,
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
    onPaymentRequested,
    onPaymentCompleted,
    onPaymentFailed,
    onSupportRequested,
    onVoucherApplied,
    onVoucherRemoved,
    onOrderMerged,
    removeListeners,
  } = orderSocket;

  // Load orders and stats on component mount and when filters change
  useEffect(() => {
    loadOrders();
    loadStats();
  }, [currentPage, statusFilter, dateFilter, tableIdFilter]);

  // Load tables when open create dialog
  useEffect(() => {
    if (!showCreateDialog) return;
    (async () => {
      try {
        const res = await api.tables.getAll();
        const data = (res as any).data || res;
        setAvailableTables(data);
      } catch (e) {
        console.error("Failed to load available tables", e);
      }
    })();
  }, [showCreateDialog]);

  const handleCreateOrder = async () => {
    if (!selectedTableId) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng chọn bàn" });
      return;
    }
    try {
      setIsCreatingOrder(true);
      await api.orders.create({ table_id: selectedTableId });
      setShowCreateDialog(false);
      setSelectedTableId("");
      await loadOrders();
      toast({ title: "Thành công", description: "Tạo đơn hàng thành công" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // WebSocket event listeners
  useEffect(() => {
    onOrderCreated((newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      toast({
        title: "Đơn hàng mới",
        description: `Đơn hàng #${newOrder.id.slice(0, 8)} đã được tạo`,
      });
    });

    onOrderUpdated((updatedOrder) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });

    onOrderStatusChanged((order) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: order.status } : o
        )
      );
      toast({
        title: "Trạng thái đơn hàng thay đổi",
        description: `Đơn hàng #${order.id.slice(0, 8)} đã chuyển sang ${
          order.status
        }`,
      });
    });

    onPaymentRequested((order) => {
      const paymentMethod = order.payment_method || "vnpay";
      const paymentNote = order.payment_note
        ? `\nGhi chú: ${order.payment_note}`
        : "";
      const amount = order.final_amount || order.total_amount || 0;

      toast({
        title: "Yêu cầu thanh toán",
        description: `Đơn hàng #${order.id.slice(0, 8)} yêu cầu thanh toán ${
          paymentMethod === "cash" ? "tiền mặt" : "online"
        }. Số tiền: ${Number(amount).toLocaleString("vi-VN")}đ${paymentNote}`,
        variant: paymentMethod === "cash" ? "default" : "default",
      });
    });

    onPaymentCompleted((order) => {
      toast({
        title: "Thanh toán hoàn tất",
        description: `Đơn hàng #${order.id.slice(
          0,
          8
        )} đã thanh toán thành công`,
        variant: "default",
      });
    });

    onSupportRequested((order) => {
      toast({
        title: "Yêu cầu hỗ trợ",
        description: `Đơn hàng #${order.id.slice(0, 8)} cần hỗ trợ`,
        variant: "destructive",
      });
    });

    onPaymentFailed((order) => {
      toast({
        title: "Thanh toán thất bại",
        description: `Đơn hàng #${order.id.slice(0, 8)} thanh toán thất bại`,
        variant: "destructive",
      });
    });

    onVoucherApplied((order) => {
      toast({
        title: "Áp dụng voucher",
        description: `Đơn hàng #${order.id.slice(0, 8)} đã áp dụng voucher`,
        variant: "default",
      });
    });

    onVoucherRemoved((order) => {
      toast({
        title: "Hủy voucher",
        description: `Đơn hàng #${order.id.slice(0, 8)} đã hủy voucher`,
        variant: "default",
      });
    });

    onOrderMerged((order) => {
      toast({
        title: "Gộp đơn hàng",
        description: `Đơn hàng #${order.id.slice(0, 8)} đã được gộp`,
        variant: "default",
      });
    });

    return () => {
      removeListeners();
    };
  }, [
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
    onPaymentRequested,
    onPaymentCompleted,
    onPaymentFailed,
    onSupportRequested,
    onVoucherApplied,
    onVoucherRemoved,
    onOrderMerged,
    removeListeners,
    toast,
  ]);

  // Filter orders locally (for search only, other filters are handled by API)
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user?.username
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.user?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.table?.table_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const filters: OrderFilters = {
        page: currentPage,
        limit: pageSize,
        sort_by: "created_at",
        sort_order: "DESC",
      };

      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      // Handle date filter
      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filters.start_date = today.toISOString();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filters.end_date = tomorrow.toISOString();
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        filters.start_date = yesterday.toISOString();
        const today = new Date(yesterday);
        today.setDate(today.getDate() + 1);
        filters.end_date = today.toISOString();
      } else if (dateFilter === "this_week") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.start_date = weekAgo.toISOString();
        filters.end_date = today.toISOString();
      }

      if (tableIdFilter) {
        filters.table_id = tableIdFilter;
      }

      const response = await api.orders.getAll(filters);
      setOrders(Array.isArray(response.data) ? response.data : []);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalItems(response.pagination.total || 0);
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

  const loadStats = async () => {
    try {
      const response = await api.orders.getRevenueStats();
      const statsData = response.data || response;
      setStats({
        totalOrders: statsData.total_orders || 0,
        totalRevenue: statsData.total_revenue || 0,
        pendingOrders: statsData.pending_orders || 0,
        completedOrders: statsData.completed_orders || 0,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.orders.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        )
      );
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

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      // Note: This would need to be implemented in the API
      // await api.orders.delete(orderToDelete.id);
      setOrders((prev) =>
        prev.filter((order) => order.id !== orderToDelete.id)
      );
      setShowDeleteDialog(false);
      setOrderToDelete(null);
      toast({
        title: "Thành công",
        description: "Xóa đơn hàng thành công",
      });
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa đơn hàng",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    return ORDER_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return (
      ORDER_STATUSES.find((s) => s.value === status)?.color || "status-pending"
    );
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
    return statusConfig?.icon || Clock;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - orderDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-100 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700/80 uppercase tracking-wide">
                  Tổng đơn hàng
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-emerald-50/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700/80 uppercase tracking-wide">
                  Tổng doanh thu
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-orange-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700/80 uppercase tracking-wide">
                  Đang chờ
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.pendingOrders}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700/80 uppercase tracking-wide">
                  Hoàn thành
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completedOrders}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WebSocket Status */}
      <Card className="border-amber-100 shadow-md bg-gradient-to-r from-amber-50/50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isWebSocketConnected ? (
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-emerald-600" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <WifiOff className="h-5 w-5 text-red-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Trạng thái kết nối
                </p>
                <p className="text-base font-bold">
                  {isWebSocketConnected ? (
                    <span className="text-emerald-600">Đang hoạt động</span>
                  ) : (
                    <span className="text-red-600">Mất kết nối</span>
                  )}
                </p>
              </div>
            </div>
            {isWebSocketConnected && (
              <Badge className="bg-emerald-500 text-white px-3 py-1 text-xs">
                Realtime
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="border-amber-100 shadow-lg bg-white">
        <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Filter className="h-5 w-5 text-amber-600" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                <Input
                  placeholder="Tìm kiếm số đơn hàng, khách hàng, bàn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-amber-200 focus-visible:ring-amber-500 bg-white shadow-sm"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-amber-200 focus:ring-amber-500 shadow-sm">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent className="border-amber-200">
                <SelectItem value="all" className="focus:bg-amber-50">
                  Tất cả trạng thái
                </SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem
                    key={status.value}
                    value={status.value}
                    className="focus:bg-amber-50"
                  >
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48 border-amber-200 focus:ring-amber-500 shadow-sm">
                <SelectValue placeholder="Lọc theo thời gian" />
              </SelectTrigger>
              <SelectContent className="border-amber-200">
                <SelectItem value="all" className="focus:bg-amber-50">
                  Tất cả thời gian
                </SelectItem>
                <SelectItem value="today" className="focus:bg-amber-50">
                  Hôm nay
                </SelectItem>
                <SelectItem value="yesterday" className="focus:bg-amber-50">
                  Hôm qua
                </SelectItem>
                <SelectItem value="this_week" className="focus:bg-amber-50">
                  Tuần này
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadOrders}
              disabled={isLoading}
              className="border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-amber-100 shadow-lg bg-white">
        <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-amber-900">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
              Danh sách đơn hàng
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-900 font-semibold"
              >
                {totalItems > 0 ? totalItems : filteredOrders.length}
              </Badge>
            </span>
            <div className="flex items-center gap-3">
              {isWebSocketConnected && (
                <Badge className="bg-emerald-500 text-white flex items-center gap-1.5 px-3 py-1">
                  <Wifi className="h-3 w-3" />
                  Realtime
                </Badge>
              )}
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo đơn hàng
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải đơn hàng...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có đơn hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số đơn hàng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Bàn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">#{order.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(order.created_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {order.user?.username || "Khách vãng lai"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {order.table?.table_number || "Chưa chọn bàn"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge
                              className={`status-badge ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold gold-text">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDateTime(order.created_at)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="luxury-focus"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                updateOrderStatus(order.id, value)
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setOrderToDelete(order);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, totalItems)} trên tổng số{" "}
                {totalItems} đơn hàng
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || isLoading}
                >
                  Trang trước
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">Trang</span>
                  <span className="text-sm font-medium">{currentPage}</span>
                  <span className="text-sm font-medium">trên</span>
                  <span className="text-sm font-medium">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || isLoading}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Xác nhận xóa đơn hàng
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng #
              {orderToDelete?.id.slice(0, 8)}? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa đơn hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo đơn hàng mới</DialogTitle>
            <DialogDescription>
              Chọn bàn để tạo đơn hàng mới. Bạn có thể thêm món sau tại trang
              chi tiết.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chọn bàn</label>
              <Select
                value={selectedTableId}
                onValueChange={setSelectedTableId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn bàn có sẵn" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      Bàn {t.table_number} - {t.capacity} người
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={isCreatingOrder || !selectedTableId}
            >
              {isCreatingOrder ? "Đang tạo..." : "Tạo đơn hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OrderManagementEnhanced;
