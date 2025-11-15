"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellRing,
  CheckCircle,
  CheckCheck,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Eye,
  ArrowRight,
} from "lucide-react";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { notificationService } from "@/services/notificationService";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message?: string;
  content?: string;
  type: string;
  is_read: boolean;
  created_at?: string;
  sent_at?: string;
  data?: {
    order_id?: string;
    reservation_id?: string;
    table_id?: string;
    chat_id?: string;
    [key: string]: any;
  };
}

const NOTIFICATION_TYPES: Record<
  string,
  {
    label: string;
    color: string;
    icon: string;
    route?: (data: any) => string | null;
  }
> = {
  order_created: {
    label: "Đơn hàng",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "🛒",
    route: (data: any) => {
      const orderId = data?.order_id;
      return orderId ? `/orders/${orderId}` : "/orders";
    },
  },
  order_updated: {
    label: "Đơn hàng",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "🛒",
    route: (data: any) => {
      const orderId = data?.order_id;
      return orderId ? `/orders/${orderId}` : "/orders";
    },
  },
  order_status_changed: {
    label: "Đơn hàng",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "🛒",
    route: (data: any) => {
      const orderId = data?.order_id;
      return orderId ? `/orders/${orderId}` : "/orders";
    },
  },
  reservation_created: {
    label: "Đặt bàn",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: "📅",
    route: (data: any) => {
      const reservationId = data?.reservation_id;
      return reservationId ? `/reservations/${reservationId}` : "/reservations";
    },
  },
  reservation_updated: {
    label: "Đặt bàn",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: "📅",
    route: (data: any) => {
      const reservationId = data?.reservation_id;
      return reservationId ? `/reservations/${reservationId}` : "/reservations";
    },
  },
  payment_completed: {
    label: "Thanh toán",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: "💳",
    route: (data: any) => {
      const orderId = data?.order_id;
      return orderId ? `/orders/${orderId}` : "/orders";
    },
  },
  payment_requested: {
    label: "Yêu cầu thanh toán",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: "💳",
    route: (data: any) => {
      const orderId = data?.order_id;
      return orderId ? `/orders/${orderId}` : "/orders";
    },
  },
  payment_failed: {
    label: "Thanh toán thất bại",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: "❌",
    route: (data: any) => {
      const orderId = data?.order_id;
      return orderId ? `/orders/${orderId}` : "/orders";
    },
  },
  reservation_confirm: {
    label: "Xác nhận đặt bàn",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: "✅",
    route: (data: any) => {
      const reservationId = data?.reservation_id;
      return reservationId ? `/reservations/${reservationId}` : "/reservations";
    },
  },
  chat_message: {
    label: "Chat",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: "💬",
    route: (data: any) => {
      return data?.chat_id ? `/chat?chat_id=${data.chat_id}` : `/chat`;
    },
  },
  support_request: {
    label: "Hỗ trợ",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: "🆘",
    route: (data: any) => {
      const orderId = data?.order_id;
      return orderId ? `/orders/${orderId}` : "/orders";
    },
  },
  system: {
    label: "Hệ thống",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: "⚙️",
  },
};

export function NotificationWidget() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  // Load notifications on component mount only (not on every open/close)
  useEffect(() => {
    // Try to load from localStorage first for instant display
    try {
      const cached = localStorage.getItem("admin_notifications");
      const cachedTimestamp = localStorage.getItem(
        "admin_notifications_timestamp"
      );
      if (cached && cachedTimestamp) {
        const cachedNotifs = JSON.parse(cached);
        const timestamp = new Date(cachedTimestamp);
        const now = new Date();
        // Use cached data if less than 5 minutes old
        if (now.getTime() - timestamp.getTime() < 5 * 60 * 1000) {
          setNotifications(cachedNotifs);
          setUnreadCount(
            cachedNotifs.filter((n: Notification) => !n.is_read).length
          );
        }
      }
    } catch (e) {
      console.error("Failed to load cached notifications:", e);
    }
    // Then load fresh data from API only once on mount
    loadNotifications();
    // Removed auto-refresh polling to prevent 401 redirect loops
    // Notifications will be updated via WebSocket instead
  }, []); // Empty dependency array - only load on mount

  // Play notification sound
  const playNotificationSound = (type: string) => {
    try {
      // Create audio context for sound alerts
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Different sounds for different notification types
      let frequency = 800; // Default frequency
      if (type.includes("order") || type.includes("payment")) {
        frequency = 1000; // Higher pitch for orders/payments
      } else if (type.includes("support") || type.includes("urgent")) {
        frequency = 1200; // Highest pitch for urgent notifications
      }

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  };

  // Show browser notification with enhanced options
  const showBrowserNotification = (notification: Notification) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      const notificationOptions: NotificationOptions = {
        body:
          notification.message || notification.content || notification.title,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: notification.id, // Prevent duplicate notifications
        requireInteraction:
          notification.type.includes("support") ||
          notification.type.includes("urgent"), // Keep visible for urgent notifications
        silent: false, // Allow sound
        data: notification.data,
      };

      const browserNotification = new Notification(
        notification.title,
        notificationOptions
      );

      // Auto-close after 5 seconds (except urgent notifications)
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      // Handle click to navigate
      browserNotification.onclick = () => {
        window.focus();
        const typeConfig =
          NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
        if (typeConfig.route && notification.data) {
          try {
            const route = typeConfig.route(notification.data);
            if (route) {
              router.push(route);
            }
          } catch (error) {
            console.error("Failed to navigate:", error);
          }
        }
        browserNotification.close();
      };
    } else if (Notification.permission === "default") {
      // Request permission if not yet requested
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          showBrowserNotification(notification);
        }
      });
    }
  };

  // WebSocket event listeners with enhanced notification handling
  useEffect(() => {
    if (!isWebSocketConnected) return;

    const handleNewNotification = (notification: Notification) => {
      // Add to state
      setNotifications((prev) => {
        // Check if notification already exists (prevent duplicates)
        const exists = prev.find((n) => n.id === notification.id);
        if (exists) return prev;
        return [notification, ...prev];
      });
      setUnreadCount((prev) => prev + 1);

      // Play sound for important notifications
      const importantTypes = [
        "order_created",
        "support_request",
        "payment_completed",
        "payment_failed",
      ];
      if (importantTypes.includes(notification.type)) {
        playNotificationSound(notification.type);
      }

      // Show browser notification
      showBrowserNotification(notification);

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message || notification.content,
        variant:
          notification.type.includes("error") ||
          notification.type.includes("failed")
            ? "destructive"
            : "default",
      });
    };

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

    // Request notification permission on mount
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, [
    isWebSocketConnected,
    onNewNotification,
    onNotificationOrder,
    onNotificationReservation,
    onNotificationChat,
    toast,
    router,
  ]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationService.getAllNotifications({
        page: 1,
        limit: 50, // Load more notifications for better persistence
        sortBy: "created_at",
        sortOrder: "DESC",
      });
      if (response.data) {
        const notifs = response.data;
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length);

        // Persist to localStorage for offline access
        try {
          localStorage.setItem("admin_notifications", JSON.stringify(notifs));
          localStorage.setItem(
            "admin_notifications_timestamp",
            new Date().toISOString()
          );
        } catch (e) {
          console.error("Failed to persist notifications:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      // Try to load from localStorage on error
      try {
        const cached = localStorage.getItem("admin_notifications");
        if (cached) {
          const cachedNotifs = JSON.parse(cached);
          setNotifications(cachedNotifs);
          setUnreadCount(
            cachedNotifs.filter((n: Notification) => !n.is_read).length
          );
        }
      } catch (e) {
        console.error("Failed to load cached notifications:", e);
      }
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
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Get route based on notification type and data
    const typeConfig =
      NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;

    // If notification has a route function, use it
    if (typeConfig.route) {
      try {
        const route = typeConfig.route(notification.data || {});
        if (route && route !== "/") {
          setIsOpen(false);
          router.push(route);
          return;
        }
      } catch (error) {
        console.error("Failed to navigate to notification route:", error);
      }
    }

    // Fallback: Try to extract order_id or reservation_id from data
    if (notification.data) {
      const orderId = notification.data.order_id;
      const reservationId = notification.data.reservation_id;

      if (orderId) {
        setIsOpen(false);
        router.push(`/orders/${orderId}`);
        return;
      }

      if (reservationId) {
        setIsOpen(false);
        router.push(`/reservations/${reservationId}`);
        return;
      }
    }
  };

  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "Vừa xong";
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

  // Fix popover positioning when it opens
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    // Use requestAnimationFrame and setTimeout to ensure DOM is fully updated
    const fixPosition = () => {
      // Find the popover wrapper - use a more specific selector
      const popoverContent = document.querySelector(
        '[data-slot="popover-content"][data-state="open"]'
      );
      if (!popoverContent) return;

      const wrapper = popoverContent.closest(
        "[data-radix-popper-content-wrapper]"
      ) as HTMLElement;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const button = document.querySelector(
        '[aria-label="Notifications"]'
      ) as HTMLElement;

      if (!button) return;

      const buttonRect = button.getBoundingClientRect();

      // Check if popover is outside viewport or has invalid transform
      const isOutsideViewport =
        rect.top < 0 ||
        rect.left < 0 ||
        rect.top > window.innerHeight ||
        rect.left > window.innerWidth;

      const hasInvalidTransform =
        wrapper.style.transform?.includes("-200%") || rect.top < 0;

      if (isOutsideViewport || hasInvalidTransform) {
        // Calculate position: below button, aligned to right
        const top = buttonRect.bottom + 8;
        const right = window.innerWidth - buttonRect.right;

        // Apply position directly to wrapper, removing auto values
        wrapper.style.setProperty("position", "fixed", "important");
        wrapper.style.setProperty("top", `${top}px`, "important");
        wrapper.style.setProperty("right", `${right}px`, "important");
        wrapper.style.setProperty("left", "auto", "important");
        wrapper.style.setProperty("bottom", "auto", "important");
        wrapper.style.setProperty("transform", "none", "important");
        wrapper.style.setProperty("z-index", "9999", "important");
      }
    };

    // Try multiple times to catch the popover after Radix updates
    const timeout1 = setTimeout(fixPosition, 0);
    const timeout2 = setTimeout(fixPosition, 10);
    const timeout3 = setTimeout(fixPosition, 50);
    const raf = requestAnimationFrame(() => {
      setTimeout(fixPosition, 0);
    });

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      cancelAnimationFrame(raf);
    };
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10"
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
      <PopoverContent
        className="w-80 sm:w-96 p-0"
        align="end"
        side="bottom"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={8}
        sticky="partial"
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{ zIndex: 9999 }}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Thông báo</h3>
            <div className="flex items-center gap-2">
              {isWebSocketConnected ? (
                <Badge variant="outline" className="text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={loadNotifications}
                disabled={isLoading}
                className="h-7 w-7 p-0"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {unreadCount} thông báo chưa đọc
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Đánh dấu tất cả đã đọc
              </Button>
            </div>
          )}
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
              {notifications.slice(0, 50).map((notification) => {
                const typeConfig = getTypeConfig(notification.type);
                const message =
                  notification.message || notification.content || "";
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.is_read && "bg-muted/30"
                    )}
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
                          {message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(
                            notification.created_at || notification.sent_at
                          )}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setIsOpen(false);
                router.push("/notifications");
              }}
            >
              Xem tất cả thông báo
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
