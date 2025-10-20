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
import { useNotificationWebSocket } from "@/hooks/useWebSocket";
import { api, Notification } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

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

  // WebSocket integration
  const {
    isConnected: isWebSocketConnected,
    joinStaffRoom,
    onNewNotification,
    onNotificationRead,
  } = useNotificationWebSocket();

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // WebSocket event listeners
  useEffect(() => {
    if (isWebSocketConnected) {
      joinStaffRoom();
    }
  }, [isWebSocketConnected, joinStaffRoom]);

  useEffect(() => {
    onNewNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast({
        title: "Thông báo mới",
        description: notification.title,
      });
    });
  }, [onNewNotification, toast]);

  useEffect(() => {
    onNotificationRead((notificationId) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    });
  }, [onNotificationRead]);

  // Filter notifications when search term or filters change
  useEffect(() => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (notification) => notification.type === typeFilter
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "unread") {
        filtered = filtered.filter((notification) => !notification.is_read);
      } else if (statusFilter === "read") {
        filtered = filtered.filter((notification) => notification.is_read);
      }
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, typeFilter, statusFilter]);

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
      const response = await api.notifications.getAll({
        page: 1,
        limit: 100,
      });
      setNotifications(response.data);
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
    return NOTIFICATION_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTypeColor = (type: string) => {
    return (
      NOTIFICATION_TYPES.find((t) => t.value === type)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = NOTIFICATION_TYPES.find((t) => t.value === type);
    return typeConfig?.icon || Bell;
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
            Danh sách thông báo ({filteredNotifications.length})
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
        </CardContent>
      </Card>
    </div>
  );
}
