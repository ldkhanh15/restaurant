"use client";

import { io, Socket } from "socket.io-client";

class WebSocketService {
  private chatSocket: Socket | null = null;
  private orderSocket: Socket | null = null;
  private notificationSocket: Socket | null = null;
  private reservationSocket: Socket | null = null;

  connect(token?: string) {
    if (
      this.chatSocket &&
      this.orderSocket &&
      this.notificationSocket &&
      this.reservationSocket
    )
      return;

    const auth = token ? { token } : {};

    // Initialize namespaced sockets
    this.chatSocket = io("ws://localhost:8000/chat", {
      auth,
      transports: ["websocket"],
    });
    this.orderSocket = io("ws://localhost:8000/order", {
      auth,
      transports: ["websocket"],
    });
    this.notificationSocket = io("ws://localhost:8000/notifications", {
      auth,
      transports: ["websocket"],
    });
    this.reservationSocket = io("ws://localhost:8000/reservation", {
      auth,
      transports: ["websocket"],
    });

    // Setup connection event listeners for each socket
    if (this.chatSocket) {
      this.chatSocket.on("connect", () => {
        console.log("WebSocket connected to chat namespace");
      });
      this.chatSocket.on("disconnect", () => {
        console.log("WebSocket disconnected from chat namespace");
      });
      this.chatSocket.on("connect_error", (error) => {
        console.error("WebSocket connection error for chat namespace:", error);
      });
    }

    if (this.orderSocket) {
      this.orderSocket.on("connect", () => {
        console.log("WebSocket connected to order namespace");
      });
      this.orderSocket.on("disconnect", () => {
        console.log("WebSocket disconnected from order namespace");
      });
      this.orderSocket.on("connect_error", (error) => {
        console.error("WebSocket connection error for order namespace:", error);
      });
    }

    if (this.notificationSocket) {
      this.notificationSocket.on("connect", () => {
        console.log("WebSocket connected to notifications namespace");
      });
      this.notificationSocket.on("disconnect", () => {
        console.log("WebSocket disconnected from notifications namespace");
      });
      this.notificationSocket.on("connect_error", (error) => {
        console.error(
          "WebSocket connection error for notifications namespace:",
          error
        );
      });
    }

    if (this.reservationSocket) {
      this.reservationSocket.on("connect", () => {
        console.log("WebSocket connected to reservation namespace");
      });
      this.reservationSocket.on("disconnect", () => {
        console.log("WebSocket disconnected from reservation namespace");
      });
      this.reservationSocket.on("connect_error", (error) => {
        console.error(
          "WebSocket connection error for reservation namespace:",
          error
        );
      });
    }
  }

  disconnect() {
    if (this.chatSocket) {
      this.chatSocket.disconnect();
      this.chatSocket = null;
    }
    if (this.orderSocket) {
      this.orderSocket.disconnect();
      this.orderSocket = null;
    }
    if (this.notificationSocket) {
      this.notificationSocket.disconnect();
      this.notificationSocket = null;
    }
    if (this.reservationSocket) {
      this.reservationSocket.disconnect();
      this.reservationSocket = null;
    }
  }

  // Chat WebSocket methods
  joinChatSession(sessionId: string) {
    if (this.chatSocket) {
      this.chatSocket.emit("joinSession", sessionId);
    }
  }

  sendChatMessage(payload: any) {
    if (this.chatSocket) {
      this.chatSocket.emit("newMessage", payload);
    }
  }

  sendTyping(payload: { session_id: string; from: string }) {
    if (this.chatSocket) {
      this.chatSocket.emit("typing", payload);
    }
  }

  onChatMessageReceived(callback: (message: any) => void) {
    if (this.chatSocket) {
      this.chatSocket.on("messageReceived", callback);
    }
  }

  onChatTyping(callback: (data: { session_id: string; from: string }) => void) {
    if (this.chatSocket) {
      this.chatSocket.on("typing", callback);
    }
  }

  onSessionClosed(callback: (payload: any) => void) {
    if (this.chatSocket) {
      this.chatSocket.on("sessionClosed", callback);
    }
  }

  // Order WebSocket methods
  joinOrder(orderId: string) {
    if (this.orderSocket) {
      this.orderSocket.emit("joinOrder", orderId);
    }
  }

  joinTable(tableId: string) {
    if (this.orderSocket) {
      this.orderSocket.emit("joinTable", tableId);
    }
  }

  onOrderCreated(callback: (order: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("orderCreated", callback);
    }
  }

  onOrderUpdated(callback: (order: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("orderUpdated", callback);
    }
  }

  onOrderStatusChanged(callback: (order: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("orderStatusChanged", callback);
    }
  }

  onOrderItemStatusChanged(
    callback: (data: {
      orderId: string;
      itemId: string;
      status: string;
    }) => void
  ) {
    if (this.orderSocket) {
      this.orderSocket.on("orderItemStatusChanged", callback);
    }
  }

  onTableChanged(callback: (data: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("tableChanged", callback);
    }
  }

  onPaymentRequested(callback: (order: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("paymentRequested", callback);
    }
  }

  onPaymentCompleted(callback: (order: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("paymentCompleted", callback);
    }
  }

  onVoucherApplied(callback: (order: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("voucherApplied", callback);
    }
  }

  onVoucherRemoved(callback: (order: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("voucherRemoved", callback);
    }
  }

  onOrderSplit(callback: (data: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("orderSplit", callback);
    }
  }

  onOrderMerged(callback: (data: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("orderMerged", callback);
    }
  }

  onSupportRequested(callback: (order: any) => void) {
    if (this.orderSocket) {
      this.orderSocket.on("supportRequested", callback);
    }
  }

  // Reservation WebSocket methods
  joinReservation(reservationId: string) {
    if (this.reservationSocket) {
      this.reservationSocket.emit("joinReservation", reservationId);
    }
  }

  joinTableReservation(tableId: string) {
    if (this.reservationSocket) {
      this.reservationSocket.emit("joinTable", tableId);
    }
  }

  onReservationCreated(callback: (reservation: any) => void) {
    if (this.reservationSocket) {
      this.reservationSocket.on("reservationCreated", callback);
    }
  }

  onReservationUpdated(callback: (reservation: any) => void) {
    if (this.reservationSocket) {
      this.reservationSocket.on("reservationUpdated", callback);
    }
  }

  onReservationStatusChanged(callback: (reservation: any) => void) {
    if (this.reservationSocket) {
      this.reservationSocket.on("reservationStatusChanged", callback);
    }
  }

  onReservationCancelled(callback: (reservation: any) => void) {
    if (this.reservationSocket) {
      this.reservationSocket.on("reservationCancelled", callback);
    }
  }

  onReservationCheckedIn(callback: (reservation: any) => void) {
    if (this.reservationSocket) {
      this.reservationSocket.on("reservationCheckedIn", callback);
    }
  }

  onTableStatusChanged(
    callback: (data: { tableId: string; status: string }) => void
  ) {
    if (this.reservationSocket) {
      this.reservationSocket.on("tableStatusChanged", callback);
    }
  }

  onDepositPaymentCompleted(callback: (reservation: any) => void) {
    if (this.reservationSocket) {
      this.reservationSocket.on("depositPaymentCompleted", callback);
    }
  }

  // Notification WebSocket methods
  joinStaffRoom() {
    if (this.notificationSocket) {
      this.notificationSocket.emit("joinStaffRoom");
    }
  }

  joinUserRoom(userId: string) {
    if (this.notificationSocket) {
      this.notificationSocket.emit("joinUserRoom", userId);
    }
  }

  leaveUserRoom(userId: string) {
    if (this.notificationSocket) {
      this.notificationSocket.emit("leaveUserRoom", userId);
    }
  }

  onNewNotification(callback: (notification: any) => void) {
    if (this.notificationSocket) {
      this.notificationSocket.on("newNotification", callback);
    }
  }

  onNotificationRead(callback: (notification: any) => void) {
    if (this.notificationSocket) {
      this.notificationSocket.on("notificationRead", callback);
    }
  }

  // Cleanup methods
  removeChatListeners() {
    if (this.chatSocket) {
      this.chatSocket.removeAllListeners();
    }
  }

  removeOrderListeners() {
    if (this.orderSocket) {
      this.orderSocket.removeAllListeners();
    }
  }

  removeNotificationListeners() {
    if (this.notificationSocket) {
      this.notificationSocket.removeAllListeners();
    }
  }

  removeReservationListeners() {
    if (this.reservationSocket) {
      this.reservationSocket.removeAllListeners();
    }
  }

  isConnected(): boolean {
    return (
      (this.chatSocket?.connected || false) &&
      (this.orderSocket?.connected || false) &&
      (this.notificationSocket?.connected || false) &&
      (this.reservationSocket?.connected || false)
    );
  }

  // Utility methods
  getConnectionStatus() {
    return {
      chat: this.chatSocket?.connected || false,
      order: this.orderSocket?.connected || false,
      notification: this.notificationSocket?.connected || false,
      reservation: this.reservationSocket?.connected || false,
    };
  }
}

export const websocketService = new WebSocketService();
