"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wifi,
  WifiOff,
  MessageSquare,
  ShoppingCart,
  Calendar,
  Bell,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { useOrderWebSocket } from "@/hooks/useOrderWebSocket";
import { useReservationWebSocket } from "@/hooks/useReservationWebSocket";
import { useNotificationWebSocket } from "@/hooks/useNotificationWebSocket";
import { useAuthStore } from "@/store/authStore";

export default function WebSocketAdminTestPage() {
  const { user } = useAuthStore();
  const { adminSocket, customerSocket, isConnected } = useWebSocket();

  // WebSocket hooks
  const chatWS = useChatWebSocket();
  const orderWS = useOrderWebSocket();
  const reservationWS = useReservationWebSocket();
  const notificationWS = useNotificationWebSocket();

  // Event logs
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const [moduleStatus, setModuleStatus] = useState({
    chat: false,
    order: false,
    reservation: false,
    notification: false,
  });

  // Add event log
  const addLog = (module: string, event: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString("vi-VN");
    const log = `[${timestamp}] [${module}] ${event}${
      data ? `: ${JSON.stringify(data).substring(0, 100)}` : ""
    }`;
    setEventLogs((prev) => [log, ...prev.slice(0, 99)]);
  };

  // Monitor connection status
  useEffect(() => {
    const socket = adminSocket || customerSocket;
    if (socket) {
      addLog("SYSTEM", "Socket connected", {
        id: socket.id,
        namespace: socket.nsp,
      });
    } else {
      addLog("SYSTEM", "Socket disconnected");
    }
  }, [adminSocket, customerSocket]);

  // Monitor module status
  useEffect(() => {
    setModuleStatus({
      chat: chatWS.isConnected,
      order: orderWS.isConnected,
      reservation: reservationWS.isConnected,
      notification: notificationWS.isConnected,
    });
  }, [
    chatWS.isConnected,
    orderWS.isConnected,
    reservationWS.isConnected,
    notificationWS.isConnected,
  ]);

  // Listen to all events
  useEffect(() => {
    // Chat events
    chatWS.onMessageReceived((msg) =>
      addLog("CHAT", "Message received", { id: msg.id })
    );
    chatWS.onSessionNew((session) =>
      addLog("CHAT", "Session created", { id: session.id })
    );
    chatWS.onSessionStatusChanged((session) =>
      addLog("CHAT", "Session status changed", {
        id: session.id,
        status: session.status,
      })
    );

    // Order events
    orderWS.onOrderCreated((order) =>
      addLog("ORDER", "Order created", { id: order.id })
    );
    orderWS.onOrderUpdated((order) =>
      addLog("ORDER", "Order updated", { id: order.id })
    );
    orderWS.onOrderStatusChanged((order) =>
      addLog("ORDER", "Order status changed", {
        id: order.id,
        status: order.status,
      })
    );
    orderWS.onPaymentCompleted((order) =>
      addLog("ORDER", "Payment completed", { id: order.id })
    );

    // Reservation events
    reservationWS.onReservationCreated((res) =>
      addLog("RESERVATION", "Reservation created", { id: res.id })
    );
    reservationWS.onReservationUpdated((res) =>
      addLog("RESERVATION", "Reservation updated", { id: res.id })
    );
    reservationWS.onReservationStatusChanged((res) =>
      addLog("RESERVATION", "Reservation status changed", {
        id: res.id,
        status: res.status,
      })
    );

    // Notification events
    notificationWS.onNewNotification((notif) =>
      addLog("NOTIFICATION", "New notification", { type: notif.type })
    );
  }, [
    chatWS.onMessageReceived,
    chatWS.onSessionNew,
    chatWS.onSessionStatusChanged,
    orderWS.onOrderCreated,
    orderWS.onOrderUpdated,
    orderWS.onOrderStatusChanged,
    orderWS.onPaymentCompleted,
    reservationWS.onReservationCreated,
    reservationWS.onReservationUpdated,
    reservationWS.onReservationStatusChanged,
    notificationWS.onNewNotification,
  ]);

  const clearLogs = () => setEventLogs([]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-amber-200 pb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
          WebSocket Admin/Staff Monitor
        </h1>
        <p className="text-gray-600 mt-2">
          Real-time monitoring dashboard for WebSocket connections and events
        </p>
      </div>

      {/* Connection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Main Connection Status */}
        <Card className="border-emerald-100 shadow-lg bg-gradient-to-br from-white to-emerald-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700/80 uppercase tracking-wide">
                  Main Connection
                </p>
                <p className="text-2xl font-bold mt-2">
                  {isConnected ? (
                    <span className="text-emerald-600 flex items-center gap-2">
                      <CheckCircle className="h-6 w-6" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-2">
                      <XCircle className="h-6 w-6" />
                      Disconnected
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Namespace:{" "}
                  {adminSocket
                    ? "/admin"
                    : customerSocket
                    ? "/customer"
                    : "N/A"}
                </p>
              </div>
              <div
                className={`h-14 w-14 rounded-full ${
                  isConnected
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                    : "bg-gradient-to-br from-red-400 to-red-500"
                } flex items-center justify-center shadow-md`}
              >
                {isConnected ? (
                  <Wifi className="h-7 w-7 text-white" />
                ) : (
                  <WifiOff className="h-7 w-7 text-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card className="border-amber-100 shadow-lg bg-gradient-to-br from-white to-amber-50/30 col-span-1 md:col-span-2">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-amber-700/80 uppercase tracking-wide mb-3">
              Current User
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">ID</p>
                <p className="font-semibold text-gray-900 truncate">
                  {user?.id || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="font-semibold text-gray-900 truncate">
                  {user?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Role</p>
                <Badge className="bg-amber-500">{user?.role || "N/A"}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Socket ID</p>
                <p className="font-semibold text-gray-900 text-xs truncate">
                  {adminSocket?.id || customerSocket?.id || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-100 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Chat</p>
                <Badge
                  className={
                    moduleStatus.chat
                      ? "bg-emerald-500 mt-1"
                      : "bg-red-500 mt-1"
                  }
                >
                  {moduleStatus.chat ? "Active" : "Inactive"}
                </Badge>
              </div>
              <MessageSquare
                className={`h-8 w-8 ${
                  moduleStatus.chat ? "text-blue-600" : "text-gray-400"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Orders</p>
                <Badge
                  className={
                    moduleStatus.order
                      ? "bg-emerald-500 mt-1"
                      : "bg-red-500 mt-1"
                  }
                >
                  {moduleStatus.order ? "Active" : "Inactive"}
                </Badge>
              </div>
              <ShoppingCart
                className={`h-8 w-8 ${
                  moduleStatus.order ? "text-amber-600" : "text-gray-400"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Reservations
                </p>
                <Badge
                  className={
                    moduleStatus.reservation
                      ? "bg-emerald-500 mt-1"
                      : "bg-red-500 mt-1"
                  }
                >
                  {moduleStatus.reservation ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Calendar
                className={`h-8 w-8 ${
                  moduleStatus.reservation ? "text-purple-600" : "text-gray-400"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">
                  Notifications
                </p>
                <Badge
                  className={
                    moduleStatus.notification
                      ? "bg-emerald-500 mt-1"
                      : "bg-red-500 mt-1"
                  }
                >
                  {moduleStatus.notification ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Bell
                className={`h-8 w-8 ${
                  moduleStatus.notification ? "text-red-600" : "text-gray-400"
                }`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Logs */}
      <Card className="border-amber-100 shadow-lg bg-white">
        <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-amber-900">
              Real-time Event Logs
            </CardTitle>
            <div className="flex gap-2">
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-900"
              >
                {eventLogs.length} events
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={clearLogs}
                className="border-amber-300 hover:bg-amber-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] p-4">
            <div className="space-y-1 font-mono text-xs">
              {eventLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Waiting for events... Perform actions in other modules to see
                  real-time updates here.
                </p>
              ) : (
                eventLogs.map((log, index) => {
                  const isSystem = log.includes("[SYSTEM]");
                  const isChat = log.includes("[CHAT]");
                  const isOrder = log.includes("[ORDER]");
                  const isReservation = log.includes("[RESERVATION]");
                  const isNotification = log.includes("[NOTIFICATION]");

                  return (
                    <div
                      key={index}
                      className={`p-2 rounded border-l-4 hover:bg-opacity-80 transition-colors ${
                        isSystem
                          ? "bg-gray-50 border-gray-500"
                          : isChat
                          ? "bg-blue-50 border-blue-500"
                          : isOrder
                          ? "bg-amber-50 border-amber-500"
                          : isReservation
                          ? "bg-purple-50 border-purple-500"
                          : isNotification
                          ? "bg-red-50 border-red-500"
                          : "bg-green-50 border-green-500"
                      }`}
                    >
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-100 shadow-md bg-gradient-to-r from-blue-50/30 to-white">
        <CardHeader>
          <CardTitle className="text-blue-900 text-lg">
            📋 Hướng dẫn kiểm tra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              Kiểm tra "Main Connection" phải hiển thị "Connected" (màu xanh)
            </li>
            <li>
              Kiểm tra tất cả 4 modules (Chat, Orders, Reservations,
              Notifications) phải hiển thị "Active"
            </li>
            <li>Mở thêm tab mới và tạo đơn hàng, đặt bàn, hoặc gửi tin nhắn</li>
            <li>
              Xem Event Logs bên dưới để kiểm tra events có được nhận real-time
              không
            </li>
            <li>Nếu có vấn đề, mở Console (F12) để xem logs chi tiết</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
