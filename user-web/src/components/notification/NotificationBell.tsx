"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotificationSocket } from "@/hooks";
import { notificationService } from "@/services/notificationService";
import type { Notification as NotificationType } from "@/services/notificationService";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

/**
 * Notification Bell Component
 * Displays notification count and list, handles click to mark as read and redirect
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const notificationSocket = useNotificationSocket();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial notifications
  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const [listRes, countRes] = await Promise.all([
          notificationService.getAll({ limit: 20 }),
          notificationService.getUnreadCount(),
        ]);

        if (listRes.status === "success") {
          // Handle paginated response - API returns { data: { data: [...], pagination: {...} } }
          const responseData = listRes.data;
          const notifs = Array.isArray(responseData.data)
            ? responseData.data
            : Array.isArray(responseData.data?.data)
            ? responseData.data.data
            : Array.isArray(responseData)
            ? responseData
            : [];
          setNotifications(notifs);
        }

        if (countRes.status === "success") {
          setUnreadCount(countRes.data.count);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id]);

  // Listen to realtime notifications
  useEffect(() => {
    if (!notificationSocket.isConnected) return;

    // Listen to new notifications
    notificationSocket.onNewNotification((notification) => {
      const notif: NotificationType = {
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type as any,
        title: notification.title,
        content: notification.message || notification.content || "",
        data: notification.metadata || notification.data,
        is_read: notification.read || false,
        sent_at: notification.created_at,
        status: "sent",
      };
      setNotifications((prev) => [notif, ...prev]);
      if (!notif.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
      toast({
        title: notif.title || "Thông báo mới",
        description: notif.content,
      });
    });

    // Listen to updates (mark as read)
    notificationSocket.onNotificationUpdate((data) => {
      // Handle mark all as read: empty notifications array
      if (
        data.notifications &&
        Array.isArray(data.notifications) &&
        data.notifications.length === 0
      ) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        return;
      }

      // Handle multiple notifications update: { notifications: [...] }
      if (data.notifications && Array.isArray(data.notifications)) {
        setNotifications((prev) =>
          prev.map((n) => {
            const updated = data.notifications.find((u: any) => u.id === n.id);
            return updated ? { ...n, is_read: updated.is_read } : n;
          })
        );
        const markedReadCount = data.notifications.filter(
          (u: any) => u.is_read
        ).length;
        setUnreadCount((prev) => Math.max(0, prev - markedReadCount));
        return;
      }

      // Handle single notification update: { id, is_read }
      if (data.id) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === data.id
              ? {
                  ...n,
                  is_read: data.is_read !== undefined ? data.is_read : true,
                }
              : n
          )
        );
        if (data.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    });

    // Listen to errors
    notificationSocket.onNotificationError((error) => {
      console.error("Notification error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra với thông báo",
        variant: "destructive",
      });
    });
  }, [notificationSocket]);

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read via API and Socket
    if (!notification.is_read) {
      try {
        await notificationService.markAsRead(notification.id);
        notificationSocket.markNotificationsAsRead([notification.id]);

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Redirect based on notification type and data
    const redirectTo = getRedirectPath(notification);
    if (redirectTo) {
      setIsOpen(false);
      router.push(redirectTo);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      notificationSocket.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({
        title: "Đã đánh dấu tất cả là đã đọc",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu tất cả là đã đọc",
        variant: "destructive",
      });
    }
  };

  // Get redirect path based on notification type
  const getRedirectPath = (notification: NotificationType): string | null => {
    const metadata = notification.data;

    switch (notification.type) {
      case "order_created":
      case "order_updated":
      case "order_status_changed":
      case "payment_completed":
        if (metadata?.order_id) {
          return `/orders/${metadata.order_id}`;
        }
        return "/orders";

      case "reservation_created":
      case "reservation_updated":
      case "reservation_confirm":
        if (metadata?.reservation_id) {
          return `/reservations/${metadata.reservation_id}`;
        }
        return "/reservations";

      case "chat_message":
      case "support_request":
        if (metadata?.session_id) {
          // Open chat widget or navigate to chat
          return null; // Chat widget should handle this
        }
        return null;

      case "promotion":
        return "/vouchers";

      default:
        return null;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Thông Báo</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Đang tải...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.is_read ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {notification.title && (
                        <h4 className="font-semibold text-sm mb-1">
                          {notification.title}
                        </h4>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.sent_at
                          ? formatDistanceToNow(
                              new Date(notification.sent_at),
                              {
                                addSuffix: true,
                                locale: vi,
                              }
                            )
                          : ""}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
