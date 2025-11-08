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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  AlertCircle,
  ShoppingCart,
  Calendar,
  CreditCard,
  MessageCircle,
  Settings,
} from "lucide-react";
import { api, Notification, NotificationFilters } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useWebSocketContext } from "@/providers/WebSocketProvider";

const NOTIFICATION_TYPES = [
  {
    value: "order",
    label: "Đơn hàng",
    color: "bg-blue-100 text-blue-800",
    icon: ShoppingCart,
  },
  {
    value: "reservation",
    label: "Đặt bàn",
    color: "bg-green-100 text-green-800",
    icon: Calendar,
  },
  {
    value: "payment",
    label: "Thanh toán",
    color: "bg-yellow-100 text-yellow-800",
    icon: CreditCard,
  },
  {
    value: "chat",
    label: "Chat",
    color: "bg-purple-100 text-purple-800",
    icon: MessageCircle,
  },
  {
    value: "system",
    label: "Hệ thống",
    color: "bg-gray-100 text-gray-800",
    icon: Settings,
  },
];

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  // WebSocket integration
  const { notificationSocket } = useWebSocketContext();
  const {
    isConnected: isWebSocketConnected,
    onNewNotification,
    onNotificationsMarkedRead,
  } = notificationSocket;

  // Load notifications on component mount and when filters change
  useEffect(() => {
    loadNotifications();
  }, [currentPage, typeFilter, statusFilter]);

  // WebSocket event listeners
  useEffect(() => {
    onNewNotification((wsNotification) => {
      // Map WebSocket notification type to API Notification type
      const mapNotificationType = (wsType: string): Notification["type"] => {
        const typeMap: Record<string, Notification["type"]> = {
          order: "order_created",
          reservation: "reservation_created",
          chat: "chat_message",
          payment: "payment_completed",
          payment_requested: "payment_requested",
          system: "other",
        };
        return typeMap[wsType] || "other";
      };

      // Map WebSocket notification format to API Notification format
      const notification: Notification = {
        id: wsNotification.id || crypto.randomUUID(),
        user_id: wsNotification.createdBy || null,
        type: mapNotificationType(wsNotification.type || "system"),
        title: wsNotification.title,
        content: wsNotification.message || wsNotification.title,
        data: wsNotification.metadata,
        is_read: false,
        sent_at: wsNotification.createdAt
          ? new Date(wsNotification.createdAt).toISOString()
          : new Date().toISOString(),
        status: "sent",
      };
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast({
        title: "Thông báo mới",
        description: notification.title,
      });
    });
  }, [onNewNotification, toast]);

  useEffect(() => {
    onNotificationsMarkedRead((status) => {
      // Update notifications that were marked as read
      setNotifications((prev) =>
        prev.map((notification) =>
          status.notificationIds.includes(notification.id)
            ? { ...notification, is_read: true }
            : notification
        )
      );
      // Update unread count
      setUnreadCount((prev) =>
        Math.max(0, prev - status.notificationIds.length)
      );
    });
  }, [onNotificationsMarkedRead]);

  // Filter notifications locally (for search only, other filters are handled by API)
  useEffect(() => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm]);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(
      (notification) => !notification.is_read
    ).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const filters: NotificationFilters = {
        page: currentPage,
        limit: pageSize,
      };

      if (typeFilter !== "all") {
        filters.type = typeFilter;
      }

      if (statusFilter !== "all") {
        filters.is_read = statusFilter === "read";
      }

      const response = await api.notifications.getAll(filters);
      setNotifications(Array.isArray(response.data) ? response.data : []);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalItems(response.pagination.total || 0);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thông báo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      toast({
        title: "Thành công",
        description: "Đã đánh dấu thông báo là đã đọc",
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu thông báo là đã đọc",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo là đã đọc",
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu tất cả thông báo là đã đọc",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.notifications.delete(notificationId);
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
      toast({
        title: "Thành công",
        description: "Đã xóa thông báo",
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa thông báo",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    // Map API notification types to display labels
    const typeMap: Record<string, string> = {
      order_created: "Đơn hàng",
      order_updated: "Đơn hàng",
      order_status_changed: "Đơn hàng",
      reservation_created: "Đặt bàn",
      reservation_updated: "Đặt bàn",
      chat_message: "Chat",
      payment_completed: "Thanh toán",
      payment_requested: "Thanh toán",
      support_request: "Hỗ trợ",
      low_stock: "Hệ thống",
      reservation_confirm: "Đặt bàn",
      promotion: "Khuyến mãi",
      other: "Hệ thống",
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    // Map API notification types to colors
    const colorMap: Record<string, string> = {
      order_created: "bg-blue-100 text-blue-800",
      order_updated: "bg-blue-100 text-blue-800",
      order_status_changed: "bg-blue-100 text-blue-800",
      reservation_created: "bg-green-100 text-green-800",
      reservation_updated: "bg-green-100 text-green-800",
      chat_message: "bg-purple-100 text-purple-800",
      payment_completed: "bg-emerald-100 text-emerald-800",
      payment_requested: "bg-orange-100 text-orange-800",
      support_request: "bg-red-100 text-red-800",
      low_stock: "bg-yellow-100 text-yellow-800",
      reservation_confirm: "bg-green-100 text-green-800",
      promotion: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colorMap[type] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    // Map API notification types to icons
    const iconMap: Record<string, typeof ShoppingCart> = {
      order_created: ShoppingCart,
      order_updated: ShoppingCart,
      order_status_changed: ShoppingCart,
      reservation_created: Calendar,
      reservation_updated: Calendar,
      chat_message: MessageCircle,
      payment_completed: CreditCard,
      payment_requested: CreditCard,
      support_request: AlertCircle,
      low_stock: AlertCircle,
      reservation_confirm: Calendar,
      promotion: Bell,
      other: Settings,
    };
    return iconMap[type] || Bell;
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - notificationDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gold-text">Thông báo</h1>
          <p className="text-muted-foreground">
            Quản lý thông báo hệ thống ({unreadCount} chưa đọc)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {isWebSocketConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm text-muted-foreground">
              {isWebSocketConnected ? "Kết nối" : "Mất kết nối"}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={loadNotifications}
            disabled={isLoading}
            className="luxury-focus"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tổng thông báo
                </p>
                <p className="text-2xl font-bold gold-text">
                  {notifications.length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Chưa đọc
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {unreadCount}
                </p>
              </div>
              <BellRing className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Đã đọc
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.length - unreadCount}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  WebSocket
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {isWebSocketConnected ? "ON" : "OFF"}
                </p>
              </div>
              {isWebSocketConnected ? (
                <Wifi className="h-8 w-8 text-blue-600" />
              ) : (
                <WifiOff className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 luxury-focus"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="unread">Chưa đọc</SelectItem>
                <SelectItem value="read">Đã đọc</SelectItem>
              </SelectContent>
            </Select>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="luxury-focus"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Danh sách thông báo (
            {totalItems > 0 ? totalItems : filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải thông báo...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thông báo</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => {
                    const TypeIcon = getTypeIcon(notification.type);
                    return (
                      <TableRow
                        key={notification.id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {notification.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(notification.type)}>
                            {getTypeLabel(notification.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {notification.is_read ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">
                                  Đã đọc
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-orange-600">
                                  Chưa đọc
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDateTime(notification.sent_at)}</p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(notification.sent_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog
                              open={
                                showNotificationDialog &&
                                selectedNotification?.id === notification.id
                              }
                              onOpenChange={(open) => {
                                setShowNotificationDialog(open);
                                if (!open) setSelectedNotification(null);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedNotification(notification)
                                  }
                                  className="luxury-focus"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <TypeIcon className="h-5 w-5 text-primary" />
                                    Chi tiết thông báo
                                  </DialogTitle>
                                  <DialogDescription>
                                    Thông tin chi tiết về thông báo
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedNotification && (
                                  <div className="space-y-4">
                                    <div>
                                      <h3 className="font-semibold text-lg mb-2">
                                        {selectedNotification.title}
                                      </h3>
                                      <p className="text-muted-foreground mb-4">
                                        {selectedNotification.content}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium">
                                          Loại
                                        </p>
                                        <Badge
                                          className={getTypeColor(
                                            selectedNotification.type
                                          )}
                                        >
                                          {getTypeLabel(
                                            selectedNotification.type
                                          )}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">
                                          Trạng thái
                                        </p>
                                        <div className="flex items-center gap-2">
                                          {selectedNotification.is_read ? (
                                            <>
                                              <CheckCircle className="h-4 w-4 text-green-600" />
                                              <span className="text-sm text-green-600">
                                                Đã đọc
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="h-4 w-4 text-orange-600" />
                                              <span className="text-sm text-orange-600">
                                                Chưa đọc
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">
                                          Thời gian tạo
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatDateTime(
                                            selectedNotification.sent_at
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">
                                          Cập nhật lần cuối
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatDateTime(
                                            selectedNotification.sent_at
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    {selectedNotification.data && (
                                      <div>
                                        <p className="text-sm font-medium mb-2">
                                          Dữ liệu bổ sung
                                        </p>
                                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                                          {JSON.stringify(
                                            selectedNotification.data,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            {!notification.is_read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-green-600 hover:text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
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
                {totalItems} thông báo
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
    </div>
  );
}
