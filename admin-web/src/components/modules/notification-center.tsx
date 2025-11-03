"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { notificationService } from "@/services/notificationService";
import { useToast } from "@/components/ui/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationCenterProps {
  className?: string;
}

const NOTIFICATION_TYPES = [
  {
    value: "order",
    label: "Đơn hàng",
    color: "bg-blue-100 text-blue-800",
    icon: "🛒",
  },
  {
    value: "reservation",
    label: "Đặt bàn",
    color: "bg-green-100 text-green-800",
    icon: "📅",
  },
  {
    value: "payment",
    label: "Thanh toán",
    color: "bg-yellow-100 text-yellow-800",
    icon: "💳",
  },
  {
    value: "chat",
    label: "Chat",
    color: "bg-purple-100 text-purple-800",
    icon: "💬",
  },
  {
    value: "system",
    label: "Hệ thống",
    color: "bg-gray-100 text-gray-800",
    icon: "⚙️",
  },
];

function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { toast } = useToast();

  // WebSocket integration
  const { notificationSocket } = useWebSocketContext();
  const {
    isConnected: isWebSocketConnected,
    onNewNotification,
    onNotificationOrder,
    onNotificationReservation,
    onNotificationChat,
  } = notificationSocket;

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // WebSocket event listeners
  useEffect(() => {
    if (!isWebSocketConnected) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setLastUpdate(new Date());

      // Show browser notification if permission is granted
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        });
      }

      toast({
        title: "Thông báo mới",
        description: notification.title,
      });
    };

    // Listen to all notification types
    onNewNotification((notification: any) =>
      handleNewNotification(notification as Notification)
    );
    onNotificationOrder((notification: any) =>
      handleNewNotification(notification as Notification)
    );
    onNotificationReservation((notification: any) =>
      handleNewNotification(notification as Notification)
    );
    onNotificationChat((notification: any) =>
      handleNewNotification(notification as Notification)
    );

    return () => {
      // Cleanup listeners
    };
  }, [
    isWebSocketConnected,
    onNewNotification,
    onNotificationOrder,
    onNotificationReservation,
    onNotificationChat,
    toast,
  ]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationService.getAllNotifications({
        page: 1,
        limit: 50,
        sortBy: "created_at",
        sortOrder: "DESC",
      });

      if (response.data?.data?.data) {
        setNotifications(response.data.data.data);
        setUnreadCount(
          response.data.data.data.filter((n: Notification) => !n.is_read).length
        );
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông báo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu đã đọc",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo là đã đọc",
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu tất cả đã đọc",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === notificationId);
        return notification && !notification.is_read
          ? Math.max(0, prev - 1)
          : prev;
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
    return NOTIFICATION_TYPES.find((t) => t.value === type)?.icon || "📢";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Vừa xong";
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Trung tâm thông báo
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
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
                onClick={loadNotifications}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>

              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Cập nhật lần cuối: {lastUpdate.toLocaleTimeString("vi-VN")}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
              <TabsTrigger value="all">
                Tất cả ({notifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread" className="mt-4">
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Đang tải thông báo...</p>
                  </div>
                ) : unreadNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BellRing className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không có thông báo chưa đọc</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unreadNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className="border-l-4 border-l-blue-500 bg-blue-50"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">
                                  {getTypeIcon(notification.type)}
                                </span>
                                <Badge
                                  className={getTypeColor(notification.type)}
                                >
                                  {getTypeLabel(notification.type)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatRelativeTime(notification.created_at)}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-gray-700 text-sm">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Đang tải thông báo...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không có thông báo nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`${
                          notification.is_read
                            ? "bg-gray-50"
                            : "border-l-4 border-l-blue-500 bg-blue-50"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">
                                  {getTypeIcon(notification.type)}
                                </span>
                                <Badge
                                  className={getTypeColor(notification.type)}
                                >
                                  {getTypeLabel(notification.type)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatRelativeTime(notification.created_at)}
                                </span>
                                {notification.is_read ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Đã đọc
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-50 text-yellow-700"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    Chưa đọc
                                  </Badge>
                                )}
                              </div>
                              <h4
                                className={`font-semibold mb-1 ${
                                  notification.is_read
                                    ? "text-gray-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <p
                                className={`text-sm ${
                                  notification.is_read
                                    ? "text-gray-500"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDateTime(notification.created_at)}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-4">
                              {!notification.is_read && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationCenter;
export { NotificationCenter };
