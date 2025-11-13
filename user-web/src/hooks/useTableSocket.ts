"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";

interface TableSocketEvents {
  "table:status_changed": (data: {
    table_id: string;
    status: string;
    table?: any;
    updatedAt: string;
  }) => void;
  "table:order_created": (data: {
    table_id: string;
    orderId: string;
    order: any;
    updatedAt: string;
  }) => void;
  "table:order_updated": (data: {
    table_id: string;
    orderId: string;
    order: any;
    updatedAt: string;
  }) => void;
}

export function useTableSocket(tableId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const currentOrderRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tableStatus, setTableStatus] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const { toast } = useToast();

  // Keep ref in sync with state
  useEffect(() => {
    currentOrderRef.current = currentOrder;
  }, [currentOrder]);

  useEffect(() => {
    if (!tableId) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:8000";

    // Connect to root namespace (table rooms are in root namespace)
    const socket = io(baseUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Table Socket] Connected:", socket.id);
      setIsConnected(true);

      // Join table room
      socket.emit("table:join", tableId);
    });

    socket.on("disconnect", () => {
      console.log("[Table Socket] Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("[Table Socket] Connection error:", error);
      setIsConnected(false);
    });

    // Listen to table events
    socket.on("table:status_changed", (data) => {
      console.log("[Table Socket] Table status changed:", data);
      setTableStatus(data.status);

      toast({
        title: "Trạng thái bàn đã thay đổi",
        description: `Bàn ${
          data.table?.table_number || tableId
        } hiện tại: ${getStatusLabel(data.status)}`,
        variant: "default",
      });
    });

    socket.on("table:order_created", (data) => {
      console.log("[Table Socket] Order created:", data);
      setCurrentOrder(data.order);

      toast({
        title: "Đơn hàng đã được tạo",
        description: `Đơn hàng #${data.orderId.slice(
          0,
          8
        )} đã được tạo cho bàn này`,
        variant: "default",
      });
    });

    socket.on("table:order_updated", (data) => {
      console.log("[Table Socket] Order updated:", data);
      setCurrentOrder(data.order);

      toast({
        title: "Đơn hàng đã được cập nhật",
        description: `Trạng thái đơn hàng: ${getOrderStatusLabel(
          data.order.status
        )}`,
        variant: "default",
      });
    });

    // Listen to detailed order item events
    socket.on("table:order_item_created", (data) => {
      console.log("[Table Socket] Order item created:", data);
      setCurrentOrder((prev) => {
        if (!prev || prev.id !== data.orderId) return prev;
        return {
          ...prev,
          items: [...(prev.items || []), data.item],
          total_amount: data.order.total_amount,
          final_amount: data.order.final_amount,
        };
      });
    });

    socket.on("table:order_item_updated", (data) => {
      console.log("[Table Socket] Order item updated:", data);
      setCurrentOrder((prev) => {
        if (!prev || prev.id !== data.orderId) return prev;
        return {
          ...prev,
          items: (prev.items || []).map((item: any) =>
            item.id === data.itemId ? { ...item, ...data.item } : item
          ),
          total_amount: data.order.total_amount,
          final_amount: data.order.final_amount,
        };
      });
    });

    socket.on("table:order_item_deleted", (data) => {
      console.log("[Table Socket] Order item deleted:", data);
      setCurrentOrder((prev) => {
        if (!prev || prev.id !== data.orderId) return prev;
        return {
          ...prev,
          items: (prev.items || []).filter(
            (item: any) => item.id !== data.itemId
          ),
          total_amount: data.order.total_amount,
          final_amount: data.order.final_amount,
        };
      });
    });

    socket.on("table:order_item_status_changed", (data) => {
      console.log("[Table Socket] Order item status changed:", data);
      setCurrentOrder((prev) => {
        if (!prev || prev.id !== data.orderId) return prev;
        return {
          ...prev,
          items: (prev.items || []).map((item: any) =>
            item.id === data.itemId
              ? { ...item, status: data.item.status }
              : item
          ),
          total_amount: data.order.total_amount,
          final_amount: data.order.final_amount,
          status: data.order.status,
        };
      });
    });

    // Listen to support request confirmation
    socket.on("table:support_requested", (data) => {
      console.log("[Table Socket] Support requested:", data);
      toast({
        title: "Đã gửi yêu cầu",
        description: "Nhân viên đã nhận được yêu cầu của bạn",
        variant: "success",
      });
    });

    // Listen to payment request events
    socket.on("table:payment_requested", (data) => {
      console.log("[Table Socket] Payment requested:", data);
      setCurrentOrder((prev) => {
        if (!prev || prev.id !== data.orderId) return prev;
        return {
          ...prev,
          payment_status: "waiting_payment",
          status: data.order.status,
        };
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("table:leave", tableId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [tableId, toast]);

  return {
    isConnected,
    tableStatus,
    currentOrder,
    socket: socketRef.current,
  };
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: "Còn trống",
    occupied: "Đang sử dụng",
    cleaning: "Đang dọn dẹp",
    reserved: "Đã đặt",
  };
  return labels[status] || status;
}

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Chờ xác nhận",
    dining: "Đang dùng bữa",
    preparing: "Đang chuẩn bị",
    ready: "Sẵn sàng",
    paid: "Đã thanh toán",
    waiting_payment: "Chờ thanh toán",
    cancelled: "Đã hủy",
  };
  return labels[status] || status;
}
