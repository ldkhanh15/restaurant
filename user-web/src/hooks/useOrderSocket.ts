"use client";

import { useCallback, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuth } from "@/lib/auth";
import { useSocketStore, type Order } from "@/store/socketStore";

interface UseOrderSocketReturn {
  isConnected: boolean;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
  requestSupport: (orderId: string) => void;
  // Getters from store
  getOrder: (orderId: string) => Order | undefined;
  getOrders: () => Order[];
  // Event listeners
  onOrderCreated: (callback: (order: Order) => void) => void;
  onOrderUpdated: (callback: (order: Order) => void) => void;
  onOrderStatusChanged: (callback: (order: Order) => void) => void;
  onPaymentRequested: (callback: (order: Order) => void) => void;
  onPaymentCompleted: (callback: (order: Order) => void) => void;
  onPaymentFailed: (callback: (order: Order) => void) => void;
  onSupportRequested: (callback: (data: { orderId: string }) => void) => void;
  onVoucherApplied: (callback: (order: Order) => void) => void;
  onVoucherRemoved: (callback: (order: Order) => void) => void;
  onOrderMerged: (callback: (order: Order) => void) => void;
  onOrderItemCreated: (callback: (data: any) => void) => void;
  onOrderItemQuantityChanged: (callback: (data: any) => void) => void;
  onOrderItemDeleted: (callback: (data: any) => void) => void;
  onOrderItemStatusChanged: (callback: (data: any) => void) => void;
  removeListeners: () => void;
}

export function useOrderSocket(): UseOrderSocketReturn {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuth();
  const { orders, ordersByUser, addOrder, updateOrder } = useSocketStore();

  // Room management
  const joinOrder = useCallback(
    (orderId: string) => {
      if (socket && isConnected) {
        socket.emit("order:join", orderId);
        console.log(`[Order] Joined order room: ${orderId}`);
      }
    },
    [socket, isConnected]
  );

  const leaveOrder = useCallback(
    (orderId: string) => {
      if (socket && isConnected) {
        socket.emit("order:leave", orderId);
        console.log(`[Order] Left order room: ${orderId}`);
      }
    },
    [socket, isConnected]
  );

  // Customer actions
  const requestSupport = useCallback(
    (orderId: string) => {
      if (socket && isConnected && user?.id) {
        socket.emit("order:request_support", { orderId });
        console.log(`[Order] Support requested for order: ${orderId}`);
      }
    },
    [socket, isConnected, user?.id]
  );

  // Event listeners - Customer namespace events
  const onOrderCreated = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:created", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            user_id: data.user_id || data.customer_id,
            customer_id: data.customer_id || data.user_id,
            table_id: data.table_id,
            status: data.status,
            total: data.total || 0,
            created_at:
              data.created_at || data.createdAt || new Date().toISOString(),
            updated_at:
              data.updated_at || data.updatedAt || new Date().toISOString(),
            ...data,
          };
          addOrder(order);
          callback(order);
        });
      }
    },
    [socket, addOrder]
  );

  const onOrderUpdated = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:updated", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            user_id: data.user_id || data.customer_id,
            customer_id: data.customer_id || data.user_id,
            table_id: data.table_id,
            status: data.status,
            total: data.total || 0,
            created_at:
              data.created_at || data.createdAt || new Date().toISOString(),
            updated_at:
              data.updated_at || data.updatedAt || new Date().toISOString(),
            ...data,
          };
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder]
  );

  const onOrderStatusChanged = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:status_changed", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            user_id: data.user_id || data.customer_id,
            customer_id: data.customer_id || data.user_id,
            table_id: data.table_id,
            status: data.status,
            total: data.total || 0,
            created_at:
              data.created_at || data.createdAt || new Date().toISOString(),
            updated_at:
              data.updated_at || data.updatedAt || new Date().toISOString(),
            ...data,
          };
          updateOrder(order.id, {
            status: order.status,
            updated_at: order.updated_at,
          });
          callback(order);
        });
      }
    },
    [socket, updateOrder]
  );

  const onPaymentRequested = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:payment_requested", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            ...data,
          };
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder]
  );

  const onPaymentCompleted = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:payment_completed", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            ...data,
          };
          updateOrder(order.id, { ...order, status: "completed" });
          callback(order);
        });
      }
    },
    [socket, updateOrder]
  );

  const onPaymentFailed = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:payment_failed", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            ...data,
          };
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder]
  );

  const onSupportRequested = useCallback(
    (callback: (data: { orderId: string }) => void) => {
      if (socket) {
        // This is mostly for admin, but customer can listen for confirmation
        socket.on("order:support_requested", (data: any) => {
          callback({
            orderId: data.orderId || data.id,
          });
        });
      }
    },
    [socket]
  );

  const onVoucherApplied = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:voucher_applied", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            ...data,
          };
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder]
  );

  const onVoucherRemoved = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:voucher_removed", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            ...data,
          };
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder]
  );

  const onOrderMerged = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:merged", (data: any) => {
          const order: Order = {
            id: data.orderId || data.id,
            ...data,
          };
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder]
  );

  const onOrderItemCreated = useCallback(
    (callback: (data: any) => void) => {
      if (socket) {
        socket.on("order:item_created", (data: any) => {
          callback(data);
        });
      }
    },
    [socket]
  );

  const onOrderItemQuantityChanged = useCallback(
    (callback: (data: any) => void) => {
      if (socket) {
        socket.on("order:item_quantity_changed", (data: any) => {
          callback(data);
        });
      }
    },
    [socket]
  );

  const onOrderItemDeleted = useCallback(
    (callback: (data: any) => void) => {
      if (socket) {
        socket.on("order:item_deleted", (data: any) => {
          callback(data);
        });
      }
    },
    [socket]
  );

  const onOrderItemStatusChanged = useCallback(
    (callback: (data: any) => void) => {
      if (socket) {
        socket.on("order:item_status_changed", (data: any) => {
          callback(data);
        });
      }
    },
    [socket]
  );

  // Store getters
  const getOrder = useCallback(
    (orderId: string) => {
      return orders[orderId];
    },
    [orders]
  );

  const getOrders = useCallback(() => {
    return ordersByUser
      .map((orderId) => orders[orderId])
      .filter(Boolean) as Order[];
  }, [orders, ordersByUser]);

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
      socket.removeAllListeners("order:item_created");
      socket.removeAllListeners("order:item_quantity_changed");
      socket.removeAllListeners("order:item_deleted");
      socket.removeAllListeners("order:item_status_changed");
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
    requestSupport,
    getOrder,
    getOrders,
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
    onOrderItemCreated,
    onOrderItemQuantityChanged,
    onOrderItemDeleted,
    onOrderItemStatusChanged,
    removeListeners,
  };
}
