"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wifi,
  WifiOff,
  MessageSquare,
  ShoppingCart,
  Calendar,
  Bell,
  Send,
  RefreshCw,
} from "lucide-react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { useOrderWebSocket } from "@/hooks/useOrderWebSocket";
import { useReservationWebSocket } from "@/hooks/useReservationWebSocket";
import { useNotificationWebSocket } from "@/hooks/useNotificationWebSocket";
import { useAuthStore } from "@/store/authStore";

export default function WebSocketCustomerTestPage() {
  const { user } = useAuthStore();
  const { adminSocket, customerSocket } = useWebSocket();

  // WebSocket hooks
  const chatWS = useChatWebSocket();
  const orderWS = useOrderWebSocket();
  const reservationWS = useReservationWebSocket();
  const notificationWS = useNotificationWebSocket();

  // Test states
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [orderEvents, setOrderEvents] = useState<any[]>([]);
  const [reservationEvents, setReservationEvents] = useState<any[]>([]);
  const [notificationEvents, setNotificationEvents] = useState<any[]>([]);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

  // Add connection log
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("vi-VN");
    setConnectionLogs((prev) => [
      `[${timestamp}] ${message}`,
      ...prev.slice(0, 49),
    ]);
    console.log(`[WebSocket Test] ${message}`);
  };

  // Monitor connection status
  useEffect(() => {
    addLog(`Admin Socket: ${adminSocket ? "Connected" : "Disconnected"}`);
    addLog(`Customer Socket: ${customerSocket ? "Connected" : "Disconnected"}`);
    addLog(`Chat WS: ${chatWS.isConnected ? "Connected" : "Disconnected"}`);
    addLog(`Order WS: ${orderWS.isConnected ? "Connected" : "Disconnected"}`);
    addLog(
      `Reservation WS: ${
        reservationWS.isConnected ? "Connected" : "Disconnected"
      }`
    );
    addLog(
      `Notification WS: ${
        notificationWS.isConnected ? "Connected" : "Disconnected"
      }`
    );
    addLog(
      `User: ${
        user
          ? JSON.stringify({ id: user.id, role: user.role })
          : "Not logged in"
      }`
    );
  }, [
    adminSocket,
    customerSocket,
    chatWS.isConnected,
    orderWS.isConnected,
    reservationWS.isConnected,
    notificationWS.isConnected,
    user,
  ]);

  // Listen to chat events
  useEffect(() => {
    chatWS.onMessageReceived((message) => {
      addLog(`Chat: New message received - ${message.id}`);
      setChatMessages((prev) => [message, ...prev.slice(0, 19)]);
    });

    chatWS.onSessionNew((session) => {
      addLog(`Chat: New session - ${session.id}`);
    });
  }, [chatWS.onMessageReceived, chatWS.onSessionNew]);

  // Listen to order events
  useEffect(() => {
    orderWS.onOrderCreated((order) => {
      addLog(`Order: Created - ${order.id}`);
      setOrderEvents((prev) => [
        { type: "created", data: order, time: new Date() },
        ...prev.slice(0, 19),
      ]);
    });

    orderWS.onOrderUpdated((order) => {
      addLog(`Order: Updated - ${order.id}`);
      setOrderEvents((prev) => [
        { type: "updated", data: order, time: new Date() },
        ...prev.slice(0, 19),
      ]);
    });

    orderWS.onOrderStatusChanged((order) => {
      addLog(`Order: Status changed - ${order.id} to ${order.status}`);
      setOrderEvents((prev) => [
        { type: "status_changed", data: order, time: new Date() },
        ...prev.slice(0, 19),
      ]);
    });

    orderWS.onPaymentCompleted((order) => {
      addLog(`Order: Payment completed - ${order.id}`);
      setOrderEvents((prev) => [
        { type: "payment_completed", data: order, time: new Date() },
        ...prev.slice(0, 19),
      ]);
    });
  }, [
    orderWS.onOrderCreated,
    orderWS.onOrderUpdated,
    orderWS.onOrderStatusChanged,
    orderWS.onPaymentCompleted,
  ]);

  // Listen to reservation events
  useEffect(() => {
    reservationWS.onReservationCreated((reservation) => {
      addLog(`Reservation: Created - ${reservation.id}`);
      setReservationEvents((prev) => [
        { type: "created", data: reservation, time: new Date() },
        ...prev.slice(0, 19),
      ]);
    });

    reservationWS.onReservationUpdated((reservation) => {
      addLog(`Reservation: Updated - ${reservation.id}`);
      setReservationEvents((prev) => [
        { type: "updated", data: reservation, time: new Date() },
        ...prev.slice(0, 19),
      ]);
    });

    reservationWS.onReservationStatusChanged((reservation) => {
      addLog(`Reservation: Status changed - ${reservation.id}`);
      setReservationEvents((prev) => [
        { type: "status_changed", data: reservation, time: new Date() },
        ...prev.slice(0, 19),
      ]);
    });
  }, [
    reservationWS.onReservationCreated,
    reservationWS.onReservationUpdated,
    reservationWS.onReservationStatusChanged,
  ]);

  // Listen to notification events
  useEffect(() => {
    notificationWS.onNewNotification((notification) => {
      addLog(`Notification: New - ${notification.type}`);
      setNotificationEvents((prev) => [notification, ...prev.slice(0, 19)]);
    });
  }, [notificationWS.onNewNotification]);

  // Send test chat message
  const sendTestChatMessage = () => {
    if (chatMessage.trim() && chatWS.isConnected) {
      // Assuming we have a test session ID
      const testSessionId = "test-session-123";
      chatWS.sendMessage(testSessionId, chatMessage);
      addLog(`Chat: Sent message - "${chatMessage}"`);
      setChatMessage("");
    } else {
      addLog("Chat: Cannot send - not connected or empty message");
    }
  };

  const getConnectionStatus = () => {
    const connections = [
      chatWS.isConnected,
      orderWS.isConnected,
      reservationWS.isConnected,
      notificationWS.isConnected,
    ];
    const connected = connections.filter(Boolean).length;
    return {
      connected,
      total: connections.length,
      percentage: Math.round((connected / connections.length) * 100),
    };
  };

  const status = getConnectionStatus();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-amber-200 pb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
          WebSocket Customer Test Page
        </h1>
        <p className="text-gray-600 mt-2">
          Test trang WebSocket dành cho Customer - Kiểm tra kết nối và sự kiện
          realtime
        </p>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-100 shadow-lg bg-gradient-to-br from-white to-emerald-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700/80 uppercase tracking-wide">
                  Connection Status
                </p>
                <p className="text-3xl font-bold text-emerald-700">
                  {status.connected}/{status.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {status.percentage}% connected
                </p>
              </div>
              <div
                className={`h-14 w-14 rounded-full ${
                  status.connected === status.total
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                    : "bg-gradient-to-br from-orange-400 to-orange-500"
                } flex items-center justify-center shadow-md`}
              >
                {status.connected === status.total ? (
                  <Wifi className="h-7 w-7 text-white" />
                ) : (
                  <WifiOff className="h-7 w-7 text-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700/80 uppercase tracking-wide">
                  Chat
                </p>
                <Badge
                  className={
                    chatWS.isConnected ? "bg-emerald-500" : "bg-red-500"
                  }
                >
                  {chatWS.isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {chatMessages.length} messages
                </p>
              </div>
              <MessageSquare className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-lg bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700/80 uppercase tracking-wide">
                  Orders
                </p>
                <Badge
                  className={
                    orderWS.isConnected ? "bg-emerald-500" : "bg-red-500"
                  }
                >
                  {orderWS.isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {orderEvents.length} events
                </p>
              </div>
              <ShoppingCart className="h-10 w-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700/80 uppercase tracking-wide">
                  Reservations
                </p>
                <Badge
                  className={
                    reservationWS.isConnected ? "bg-emerald-500" : "bg-red-500"
                  }
                >
                  {reservationWS.isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {reservationEvents.length} events
                </p>
              </div>
              <Calendar className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Card className="border-amber-100 shadow-lg bg-white">
        <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
          <CardTitle className="text-amber-900">User Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-gray-500 uppercase">User ID</Label>
              <p className="font-semibold text-gray-900">
                {user?.id || "Not logged in"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500 uppercase">
                Username
              </Label>
              <p className="font-semibold text-gray-900">
                {user?.username || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500 uppercase">Role</Label>
              <Badge className="bg-amber-500">{user?.role || "N/A"}</Badge>
            </div>
            <div>
              <Label className="text-xs text-gray-500 uppercase">Email</Label>
              <p className="font-semibold text-gray-900">
                {user?.email || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different modules */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-amber-50">
          <TabsTrigger value="logs">Connection Logs</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Connection Logs */}
        <TabsContent value="logs">
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
              <div className="flex justify-between items-center">
                <CardTitle className="text-amber-900">
                  Connection Logs
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConnectionLogs([])}
                  className="border-amber-300 hover:bg-amber-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-1 font-mono text-sm">
                  {connectionLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No logs yet...
                    </p>
                  ) : (
                    connectionLogs.map((log, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-50 rounded border-l-4 border-amber-500 hover:bg-amber-50 transition-colors"
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="border-blue-100 shadow-lg">
            <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50/30 to-white">
              <CardTitle className="text-blue-900">Chat Events</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a test message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendTestChatMessage();
                  }}
                  className="border-blue-200"
                />
                <Button
                  onClick={sendTestChatMessage}
                  disabled={!chatWS.isConnected || !chatMessage.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No chat messages yet...
                    </p>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <pre className="text-xs">
                          {JSON.stringify(msg, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card className="border-amber-100 shadow-lg">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
              <CardTitle className="text-amber-900">
                Order Events ({orderEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {orderEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No order events yet...
                    </p>
                  ) : (
                    orderEvents.map((event, index) => (
                      <div
                        key={index}
                        className="p-3 bg-amber-50 rounded-lg border border-amber-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-amber-500">{event.type}</Badge>
                          <span className="text-xs text-gray-500">
                            {event.time.toLocaleTimeString("vi-VN")}
                          </span>
                        </div>
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations">
          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50/30 to-white">
              <CardTitle className="text-purple-900">
                Reservation Events ({reservationEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {reservationEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No reservation events yet...
                    </p>
                  ) : (
                    reservationEvents.map((event, index) => (
                      <div
                        key={index}
                        className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-purple-500">{event.type}</Badge>
                          <span className="text-xs text-gray-500">
                            {event.time.toLocaleTimeString("vi-VN")}
                          </span>
                        </div>
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-red-100 shadow-lg">
            <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-50/30 to-white">
              <CardTitle className="text-red-900">
                Notification Events ({notificationEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {notificationEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No notifications yet...
                    </p>
                  ) : (
                    notificationEvents.map((notification, index) => (
                      <div
                        key={index}
                        className="p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-red-500">
                            {notification.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              notification.timestamp || Date.now()
                            ).toLocaleTimeString("vi-VN")}
                          </span>
                        </div>
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(notification, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Socket Details */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50/30 to-white">
          <CardTitle className="text-gray-900">
            Socket Connection Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Admin Socket</h3>
              <p className="text-sm">
                Connected:{" "}
                <Badge
                  className={adminSocket ? "bg-emerald-500" : "bg-red-500"}
                >
                  {adminSocket ? "Yes" : "No"}
                </Badge>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ID: {adminSocket?.id || "N/A"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Customer Socket
              </h3>
              <p className="text-sm">
                Connected:{" "}
                <Badge
                  className={customerSocket ? "bg-emerald-500" : "bg-red-500"}
                >
                  {customerSocket ? "Yes" : "No"}
                </Badge>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ID: {customerSocket?.id || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
