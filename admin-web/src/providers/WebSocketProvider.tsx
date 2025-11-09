"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { useOrderWebSocket } from "@/hooks/useOrderWebSocket";
import { useReservationWebSocket } from "@/hooks/useReservationWebSocket";
import { useNotificationWebSocket } from "@/hooks/useNotificationWebSocket";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";

interface WebSocketContextType {
  // Socket connections
  adminSocket: Socket | null;
  customerSocket: Socket | null;
  isConnected: boolean;
  connectionStatus: {
    chat: boolean;
    order: boolean;
    reservation: boolean;
    notification: boolean;
  };
  connect: (token: string) => void;
  disconnect: () => void;
  // Socket hooks
  orderSocket: ReturnType<typeof useOrderWebSocket>;
  reservationSocket: ReturnType<typeof useReservationWebSocket>;
  notificationSocket: ReturnType<typeof useNotificationWebSocket>;
  chatSocket: ReturnType<typeof useChatWebSocket>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

// Export alias for compatibility with existing code
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};

// Internal component to initialize hooks (avoids circular dependency)
// This component is a child of WebSocketProvider, so hooks can safely call useWebSocket()
const WebSocketHooksInitializer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Get base context (sockets) from parent provider
  const baseContext = useContext(WebSocketContext);
  if (!baseContext) {
    throw new Error(
      "WebSocketHooksInitializer must be inside WebSocketProvider"
    );
  }

  // Initialize hooks - they can now safely call useWebSocket() to get sockets
  const orderSocket = useOrderWebSocket();
  const reservationSocket = useReservationWebSocket();
  const notificationSocket = useNotificationWebSocket();
  const chatSocket = useChatWebSocket();

  // Combine base context with hooks
  const fullValue: WebSocketContextType = {
    ...baseContext,
    orderSocket,
    reservationSocket,
    notificationSocket,
    chatSocket,
  };

  return (
    <WebSocketContext.Provider value={fullValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, token } = useAuthStore();
  const [adminSocket, setAdminSocket] = useState<Socket | null>(null);
  const [customerSocket, setCustomerSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    chat: false,
    order: false,
    reservation: false,
    notification: false,
  });

  const disconnect = useCallback(() => {
    setAdminSocket((prevSocket) => {
      if (prevSocket) {
        prevSocket.disconnect();
      }
      return null;
    });
    setCustomerSocket((prevSocket) => {
      if (prevSocket) {
        prevSocket.disconnect();
      }
      return null;
    });
    setIsConnected(false);
    setConnectionStatus({
      chat: false,
      order: false,
      reservation: false,
      notification: false,
    });
  }, []);

  const connect = useCallback(
    (token: string) => {
      console.log("🔌 Attempting to connect WebSocket...", {
        token: token ? "exists" : "missing",
        userRole: user?.role,
        userId: user?.id,
        userEmail: user?.email,
      });

      // Disconnect existing sockets first (using state setters, not dependencies)
      setAdminSocket((prevSocket) => {
        if (prevSocket) {
          console.log("🔌 Disconnecting previous admin socket");
          prevSocket.disconnect();
        }
        return null;
      });
      setCustomerSocket((prevSocket) => {
        if (prevSocket) {
          console.log("🔌 Disconnecting previous customer socket");
          prevSocket.disconnect();
        }
        return null;
      });
      setIsConnected(false);

      if (!token) {
        console.warn("⚠️ No token provided, cannot connect WebSocket");
        return;
      }

      if (!user?.role) {
        console.warn("⚠️ User role not available, cannot determine namespace");
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
        "http://localhost:8000";
      const socketConfig = {
        path: "/socket.io",
        transports: ["websocket", "polling"] as ("websocket" | "polling")[],
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        autoConnect: true,
      };

      // Connect to appropriate namespace based on user role
      // Frontend role "staff" or "admin" -> Connect to /admin namespace
      if (user.role === "admin" || user.role === "staff") {
        console.log(
          `🔌 Connecting to /admin namespace... (role: ${user.role}, userId: ${user.id})`
        );
        const socket = io(`${baseUrl}/admin`, socketConfig);
        setupSocketListeners(socket, "admin");
        setAdminSocket(socket);
      } else if (user.role === "customer") {
        console.log(
          `🔌 Connecting to /customer namespace... (userId: ${user.id})`
        );
        const socket = io(`${baseUrl}/customer`, socketConfig);
        setupSocketListeners(socket, "customer");
        setCustomerSocket(socket);
      } else {
        console.warn("⚠️ Unknown user role:", user.role);
      }
    },
    [user]
  );

  const setupSocketListeners = (socket: Socket, type: "admin" | "customer") => {
    socket.on("connect", () => {
      setIsConnected(true);
      console.log(`✅ ${type} WebSocket connected successfully`);
      console.log(`📡 Socket ID: ${socket.id}`);
      console.log(`📡 Namespace: ${socket.nsp}`);
      console.log(`📡 Transport: ${socket.io.engine.transport.name}`);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log(`❌ ${type} WebSocket disconnected:`, reason);
      // Reset connection status
      setConnectionStatus({
        chat: false,
        order: false,
        reservation: false,
        notification: false,
      });
    });

    socket.on("connect_error", (error) => {
      console.error(`❌ ${type} WebSocket connection error:`, error);
      console.error("Error details:", error.message);
      setIsConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(
        `🔄 ${type} WebSocket reconnected after ${attemptNumber} attempts`
      );
      setIsConnected(true);
    });

    socket.on("reconnect_error", (error) => {
      console.error(`❌ ${type} WebSocket reconnection error:`, error);
    });

    socket.on("reconnect_failed", () => {
      console.error(
        `❌ ${type} WebSocket reconnection failed after all attempts`
      );
      setIsConnected(false);
    });

    // Module-specific connection status
    socket.on("chat:connected", () => {
      console.log(`✅ Chat module connected on ${type} namespace`);
      setConnectionStatus((prev) => ({ ...prev, chat: true }));
    });

    socket.on("order:connected", () => {
      console.log(`✅ Order module connected on ${type} namespace`);
      setConnectionStatus((prev) => ({ ...prev, order: true }));
    });

    socket.on("reservation:connected", () => {
      console.log(`✅ Reservation module connected on ${type} namespace`);
      setConnectionStatus((prev) => ({ ...prev, reservation: true }));
    });

    socket.on("notification:connected", () => {
      console.log(`✅ Notification module connected on ${type} namespace`);
      setConnectionStatus((prev) => ({ ...prev, notification: true }));
    });
  };

  // Auto-connect when user is authenticated
  useEffect(() => {
    console.log("🔍 WebSocket connection effect triggered", {
      hasToken: !!token,
      hasUser: !!user,
      userRole: user?.role,
      userId: user?.id,
    });

    if (token && user?.role) {
      console.log("✅ Conditions met, connecting...");
      connect(token);
    } else {
      console.log("⚠️ Conditions not met, disconnecting...");
      if (!token) {
        console.warn("⚠️ Missing token");
      }
      if (!user?.role) {
        console.warn("⚠️ Missing user role");
      }
      disconnect();
    }

    return () => {
      console.log("🧹 WebSocket cleanup - disconnecting...");
      disconnect();
    };
  }, [token, user, connect, disconnect]); // Include connect and disconnect in dependencies

  // Base context value without hooks (to avoid circular dependency)
  // This provides sockets to hooks, which will then be merged in WebSocketHooksInitializer
  const baseValue: WebSocketContextType = {
    // Socket connections
    adminSocket,
    customerSocket,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    // Placeholders - will be filled by WebSocketHooksInitializer
    orderSocket: null as any,
    reservationSocket: null as any,
    notificationSocket: null as any,
    chatSocket: null as any,
  };

  return (
    <WebSocketContext.Provider value={baseValue}>
      <WebSocketHooksInitializer>{children}</WebSocketHooksInitializer>
    </WebSocketContext.Provider>
  );
};
