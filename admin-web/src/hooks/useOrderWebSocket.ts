"use client";

import { useCallback, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuthStore } from "@/store/authStore";

interface OrderStatus {
  orderId: string;
  status: string;
  updatedAt: Date;
  updatedBy: string;
}

interface OrderItemStatus {
  orderId: string;
  itemId: string;
  status: string;
  updatedAt: Date;
  updatedBy: string;
}

interface OrderNote {
  id: string;
  orderId: string;
  content: string;
  type: "public" | "internal";
  createdAt: Date;
  createdBy: string;
  createdByRole: string;
}

interface UseOrderWebSocketReturn {
  isConnected: boolean;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: string, note?: string) => void;
  updateItemStatus: (
    orderId: string,
    itemId: string,
    status: string,
    note?: string
  ) => void;
  addOrderNote: (
    orderId: string,
    note: string,
    type: "public" | "internal"
  ) => void;
  onOrderCreated: (callback: (order: any) => void) => void;
  onOrderUpdated: (callback: (order: any) => void) => void;
  onOrderStatusChanged: (callback: (order: any) => void) => void;
  onPaymentRequested: (callback: (order: any) => void) => void;
  onPaymentCompleted: (callback: (order: any) => void) => void;
  onPaymentFailed: (callback: (order: any) => void) => void;
  onSupportRequested: (callback: (order: any) => void) => void;
  onVoucherApplied: (callback: (order: any) => void) => void;
  onVoucherRemoved: (callback: (order: any) => void) => void;
  onOrderMerged: (callback: (order: any) => void) => void;
  onOrderItemStatusChanged: (callback: (data: OrderItemStatus) => void) => void;
  onOrderNoteAdded: (callback: (data: OrderNote) => void) => void;
  removeListeners: () => void;
}

export function useOrderWebSocket(): UseOrderWebSocketReturn {
  const { adminSocket, customerSocket, isConnected } = useWebSocket();
  const { user } = useAuthStore();

  const socket =
    user?.role === "admin" || user?.role === "staff"
      ? adminSocket
      : customerSocket;

  // Room management
  const joinOrder = useCallback(
    (orderId: string) => {
      if (socket && isConnected) {
        socket.emit("order:join", orderId);
      }
    },
    [socket, isConnected]
  );

  const leaveOrder = useCallback(
    (orderId: string) => {
      if (socket && isConnected) {
        socket.emit("order:leave", orderId);
      }
    },
    [socket, isConnected]
  );

  // Admin/Staff only functions
  const updateOrderStatus = useCallback(
    (orderId: string, status: string, note?: string) => {
      if (
        socket &&
        isConnected &&
        (user?.role === "admin" || user?.role === "staff")
      ) {
        socket.emit("order:update_status", { orderId, status, note });
      }
    },
    [socket, isConnected, user?.role]
  );

  const updateItemStatus = useCallback(
    (orderId: string, itemId: string, status: string, note?: string) => {
      if (
        socket &&
        isConnected &&
        (user?.role === "admin" || user?.role === "staff")
      ) {
        socket.emit("order:update_item_status", {
          orderId,
          itemId,
          status,
          note,
        });
      }
    },
    [socket, isConnected, user?.role]
  );

  // Functions for both admin and customer
  const addOrderNote = useCallback(
    (orderId: string, note: string, type: "public" | "internal") => {
      if (socket && isConnected) {
        socket.emit("order:add_note", { orderId, note, type });
      }
    },
    [socket, isConnected]
  );

  // Event listeners - listen to new namespace events
  const onOrderCreated = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:created", callback);
        // Legacy support
        socket.on("orderCreated", callback);
      }
    },
    [socket]
  );

  const onOrderUpdated = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:updated", callback);
        // Legacy support
        socket.on("orderUpdated", callback);
      }
    },
    [socket]
  );

  const onOrderStatusChanged = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:status_changed", callback);
        // Legacy support
        socket.on("orderStatusChanged", callback);
        socket.on("order:status_updated", callback);
      }
    },
    [socket]
  );

  const onPaymentRequested = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:payment_requested", callback);
        // Legacy support
        socket.on("paymentRequested", callback);
      }
    },
    [socket]
  );

  const onPaymentCompleted = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:payment_completed", callback);
        // Legacy support
        socket.on("paymentCompleted", callback);
      }
    },
    [socket]
  );

  const onPaymentFailed = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:payment_failed", callback);
        // Legacy support
        socket.on("paymentFailed", callback);
      }
    },
    [socket]
  );

  const onSupportRequested = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:support_requested", callback);
        // Legacy support
        socket.on("supportRequested", callback);
      }
    },
    [socket]
  );

  const onVoucherApplied = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:voucher_applied", callback);
        // Legacy support
        socket.on("voucherApplied", callback);
      }
    },
    [socket]
  );

  const onVoucherRemoved = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:voucher_removed", callback);
        // Legacy support
        socket.on("voucherRemoved", callback);
      }
    },
    [socket]
  );

  const onOrderMerged = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("order:merged", callback);
        // Legacy support
        socket.on("orderMerged", callback);
      }
    },
    [socket]
  );

  const onOrderItemStatusChanged = useCallback(
    (callback: (data: OrderItemStatus) => void) => {
      if (socket) {
        socket.on("order:item_status_updated", callback);
      }
    },
    [socket]
  );

  const onOrderNoteAdded = useCallback(
    (callback: (data: OrderNote) => void) => {
      if (socket) {
        socket.on("order:note_added", callback);
      }
    },
    [socket]
  );

  // Cleanup function
  const removeListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners("order:created");
      socket.removeAllListeners("order:updated");
      socket.removeAllListeners("order:status_changed");
      socket.removeAllListeners("order:payment_requested");
      socket.removeAllListeners("order:payment_completed");
      socket.removeAllListeners("order:payment_failed");
      socket.removeAllListeners("order:support_requested");
      socket.removeAllListeners("order:voucher_applied");
      socket.removeAllListeners("order:voucher_removed");
      socket.removeAllListeners("order:merged");
      socket.removeAllListeners("order:status_updated");
      socket.removeAllListeners("order:item_status_updated");
      socket.removeAllListeners("order:note_added");
      // Legacy
      socket.removeAllListeners("orderCreated");
      socket.removeAllListeners("orderUpdated");
      socket.removeAllListeners("orderStatusChanged");
      socket.removeAllListeners("paymentRequested");
      socket.removeAllListeners("paymentCompleted");
      socket.removeAllListeners("paymentFailed");
      socket.removeAllListeners("supportRequested");
      socket.removeAllListeners("voucherApplied");
      socket.removeAllListeners("voucherRemoved");
      socket.removeAllListeners("orderMerged");
    }
  }, [socket]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      removeListeners();
    };
  }, [removeListeners]);

  return {
    isConnected,
    joinOrder,
    leaveOrder,
    updateOrderStatus,
    updateItemStatus,
    addOrderNote,
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
    onOrderItemStatusChanged,
    onOrderNoteAdded,
    removeListeners,
  };
}
