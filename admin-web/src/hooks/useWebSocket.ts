"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseOrderWebSocketReturn {
  isConnected: boolean;
  joinOrder: (orderId: string) => void;
  joinTable: (tableId: string) => void;
  onOrderCreated: (callback: (order: any) => void) => void;
  onOrderUpdated: (callback: (order: any) => void) => void;
  onOrderStatusChanged: (callback: (order: any) => void) => void;
  onOrderItemStatusChanged: (
    callback: (data: {
      orderId: string;
      itemId: string;
      status: string;
    }) => void
  ) => void;
  onPaymentRequested: (callback: (order: any) => void) => void;
  onPaymentCompleted: (callback: (order: any) => void) => void;
}

export const useOrderWebSocket = (): UseOrderWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      {
        path: "/socket.io",
        transports: ["websocket", "polling"],
      }
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinOrder = useCallback(
    (orderId: string) => {
      if (socket) {
        socket.emit("joinOrder", orderId);
      }
    },
    [socket]
  );

  const joinTable = useCallback(
    (tableId: string) => {
      if (socket) {
        socket.emit("joinTable", tableId);
      }
    },
    [socket]
  );

  const onOrderCreated = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("orderCreated", callback);
      }
    },
    [socket]
  );

  const onOrderUpdated = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("orderUpdated", callback);
      }
    },
    [socket]
  );

  const onOrderStatusChanged = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("orderStatusChanged", callback);
      }
    },
    [socket]
  );

  const onOrderItemStatusChanged = useCallback(
    (
      callback: (data: {
        orderId: string;
        itemId: string;
        status: string;
      }) => void
    ) => {
      if (socket) {
        socket.on("orderItemStatusChanged", callback);
      }
    },
    [socket]
  );

  const onPaymentRequested = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("paymentRequested", callback);
      }
    },
    [socket]
  );

  const onPaymentCompleted = useCallback(
    (callback: (order: any) => void) => {
      if (socket) {
        socket.on("paymentCompleted", callback);
      }
    },
    [socket]
  );

  return {
    isConnected,
    joinOrder,
    joinTable,
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
    onOrderItemStatusChanged,
    onPaymentRequested,
    onPaymentCompleted,
  };
};

// ==================== NOTIFICATION WEBSOCKET ====================

interface UseNotificationWebSocketReturn {
  isConnected: boolean;
  joinStaffRoom: () => void;
  onNewNotification: (callback: (notification: any) => void) => void;
  onNotificationRead: (callback: (notificationId: string) => void) => void;
}

export const useNotificationWebSocket = (): UseNotificationWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      {
        path: "/socket.io",
        transports: ["websocket", "polling"],
      }
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Notification WebSocket connected");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Notification WebSocket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Notification WebSocket connection error:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinStaffRoom = useCallback(() => {
    if (socket) {
      socket.emit("joinStaffRoom");
    }
  }, [socket]);

  const onNewNotification = useCallback(
    (callback: (notification: any) => void) => {
      if (socket) {
        socket.on("newNotification", callback);
      }
    },
    [socket]
  );

  const onNotificationRead = useCallback(
    (callback: (notificationId: string) => void) => {
      if (socket) {
        socket.on("notificationRead", callback);
      }
    },
    [socket]
  );

  return {
    isConnected,
    joinStaffRoom,
    onNewNotification,
    onNotificationRead,
  };
};

// ==================== RESERVATION WEBSOCKET ====================

interface UseReservationWebSocketReturn {
  isConnected: boolean;
  joinReservationRoom: () => void;
  onReservationCreated: (callback: (reservation: any) => void) => void;
  onReservationUpdated: (callback: (reservation: any) => void) => void;
  onReservationStatusChanged: (callback: (reservation: any) => void) => void;
}

export const useReservationWebSocket = (): UseReservationWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      {
        path: "/socket.io",
        transports: ["websocket", "polling"],
      }
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Reservation WebSocket connected");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Reservation WebSocket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Reservation WebSocket connection error:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinReservationRoom = useCallback(() => {
    if (socket) {
      socket.emit("joinReservationRoom");
    }
  }, [socket]);

  const onReservationCreated = useCallback(
    (callback: (reservation: any) => void) => {
      if (socket) {
        socket.on("reservationCreated", callback);
      }
    },
    [socket]
  );

  const onReservationUpdated = useCallback(
    (callback: (reservation: any) => void) => {
      if (socket) {
        socket.on("reservationUpdated", callback);
      }
    },
    [socket]
  );

  const onReservationStatusChanged = useCallback(
    (callback: (reservation: any) => void) => {
      if (socket) {
        socket.on("reservationStatusChanged", callback);
      }
    },
    [socket]
  );

  return {
    isConnected,
    joinReservationRoom,
    onReservationCreated,
    onReservationUpdated,
    onReservationStatusChanged,
  };
};
