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

  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const extractTotals = useCallback((source: any) => {
    if (!source) {
      return { totalAmount: 0, finalAmount: 0 };
    }

    const finalAmountCandidate =
      source.final_amount ??
      source.finalAmount ??
      source.total ??
      source.total_amount;
    const totalAmountCandidate =
      source.total_amount ?? source.totalAmount ?? finalAmountCandidate;

    return {
      totalAmount: toNumber(totalAmountCandidate),
      finalAmount: toNumber(finalAmountCandidate),
    };
  }, []);

  const buildOrder = useCallback(
    (data: any): Order => {
      const base = data?.order ? { ...data.order, ...data } : data;
      const totals = extractTotals(base);
      const id = base.orderId || base.id;
      return {
        id,
        user_id:
          base.user_id ??
          base.customer_id ??
          base.order?.user_id ??
          base.order?.customer_id,
        customer_id:
          base.customer_id ??
          base.user_id ??
          base.order?.customer_id ??
          base.order?.user_id,
        table_id: base.table_id ?? base.order?.table_id,
        status: base.status ?? base.order?.status ?? "pending",
        total: totals.finalAmount,
        total_amount: totals.totalAmount,
        final_amount: totals.finalAmount,
        payment_status: base.payment_status ?? base.order?.payment_status,
        created_at:
          base.created_at ||
          base.createdAt ||
          base.order?.created_at ||
          new Date().toISOString(),
        updated_at:
          base.updated_at ||
          base.updatedAt ||
          base.order?.updated_at ||
          new Date().toISOString(),
        ...base,
      };
    },
    [extractTotals]
  );

  const applyTotalsUpdate = useCallback(
    (orderId: string, source: any) => {
      const totals = extractTotals(source);
      const status = source?.status;
      const paymentStatus = source?.payment_status;
      const updates: Partial<Order> = {
        total: totals.finalAmount,
        total_amount: totals.totalAmount,
        final_amount: totals.finalAmount,
        updated_at:
          source?.updated_at || source?.updatedAt || new Date().toISOString(),
      };

      if (status !== undefined && status !== null) {
        updates.status = status;
      }

      if (paymentStatus !== undefined && paymentStatus !== null) {
        updates.payment_status = paymentStatus;
      }

      updateOrder(orderId, updates);
    },
    [extractTotals, updateOrder]
  );

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
          const order = buildOrder(data);
          addOrder(order);
          callback(order);
        });
      }
    },
    [socket, addOrder, buildOrder]
  );

  const onOrderUpdated = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:updated", (data: any) => {
          const order = buildOrder(data);
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder, buildOrder]
  );

  const onOrderStatusChanged = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:status_changed", (data: any) => {
          const order = buildOrder(data);
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder, buildOrder]
  );

  const onPaymentRequested = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:payment_requested", (data: any) => {
          const order = buildOrder(data);
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder, buildOrder]
  );

  const onPaymentCompleted = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:payment_completed", (data: any) => {
          const order = buildOrder(data);
          updateOrder(order.id, { ...order, status: "completed" });
          callback(order);
        });
      }
    },
    [socket, updateOrder, buildOrder]
  );

  const onPaymentFailed = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:payment_failed", (data: any) => {
          const order = buildOrder(data);
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder, buildOrder]
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
          const order = buildOrder(data);
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder, buildOrder]
  );

  const onVoucherRemoved = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:voucher_removed", (data: any) => {
          const order = buildOrder(data);
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder, buildOrder]
  );

  const onOrderMerged = useCallback(
    (callback: (order: Order) => void) => {
      if (socket) {
        socket.on("order:merged", (data: any) => {
          const order = buildOrder(data);
          updateOrder(order.id, order);
          callback(order);
        });
      }
    },
    [socket, updateOrder, buildOrder]
  );

  const onOrderItemCreated = useCallback(
    (callback: (data: any) => void) => {
      if (socket) {
        socket.on("order:item_created", (data: any) => {
          if (data?.orderId && data?.order) {
            applyTotalsUpdate(data.orderId, data.order);
          }
          callback(data);
        });
      }
    },
    [socket, applyTotalsUpdate]
  );

  const onOrderItemQuantityChanged = useCallback(
    (callback: (data: any) => void) => {
      if (socket) {
        socket.on("order:item_quantity_changed", (data: any) => {
          if (data?.orderId && data?.order) {
            applyTotalsUpdate(data.orderId, data.order);
          }
          callback(data);
        });
      }
    },
    [socket, applyTotalsUpdate]
  );

  const onOrderItemDeleted = useCallback(
    (callback: (data: any) => void) => {
      if (socket) {
        socket.on("order:item_deleted", (data: any) => {
          if (data?.orderId && data?.order) {
            applyTotalsUpdate(data.orderId, data.order);
          }
          callback(data);
        });
      }
    },
    [socket, applyTotalsUpdate]
  );

  const onOrderItemStatusChanged = useCallback(
    (callback: (data: any) => void) => {
      if (socket) {
        socket.on("order:item_status_changed", (data: any) => {
          if (data?.orderId && data?.order) {
            applyTotalsUpdate(data.orderId, data.order);
          }
          callback(data);
        });
      }
    },
    [socket, applyTotalsUpdate]
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
