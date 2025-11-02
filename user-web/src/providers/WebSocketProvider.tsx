"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth";

interface WebSocketContextType {
  // Socket connection
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: {
    chat: boolean;
    order: boolean;
    reservation: boolean;
    notification: boolean;
  };
  connect: (token?: string) => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    chat: false,
    order: false,
    reservation: false,
    notification: false,
  });

  const disconnect = useCallback(() => {
    setSocket((prevSocket) => {
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
    (authToken?: string) => {
      const tokenToUse = authToken || token;

      console.log("🔌 [user-web] Attempting to connect WebSocket...", {
        hasToken: !!tokenToUse,
        userId: user?.id,
        userRole: user?.role,
      });

      // Disconnect existing socket first
      disconnect();

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const socketConfig = {
        path: "/socket.io",
        transports: ["websocket", "polling"] as ("websocket" | "polling")[],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        autoConnect: true,
        ...(tokenToUse && {
          auth: {
            token: tokenToUse,
          },
        }),
      };

      // Connect to /customer namespace
      console.log(
        `🔌 [user-web] Connecting to /customer namespace... (userId: ${user?.id})`
      );
      const newSocket = io(`${baseUrl}/customer`, socketConfig);
      setupSocketListeners(newSocket);
      setSocket(newSocket);
    },
    [user, token, disconnect]
  );

  const setupSocketListeners = (socket: Socket) => {
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ [user-web] WebSocket connected successfully");
      console.log(`📡 Socket ID: ${socket.id}`);
      console.log(`📡 Namespace: ${socket.nsp}`);
      if (socket.io.engine?.transport) {
        console.log(`📡 Transport: ${socket.io.engine.transport.name}`);
      }
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log(`❌ [user-web] WebSocket disconnected:`, reason);
      setConnectionStatus({
        chat: false,
        order: false,
        reservation: false,
        notification: false,
      });
    });

    socket.on("connect_error", (error) => {
      console.error(`❌ [user-web] WebSocket connection error:`, error);
      setIsConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(
        `🔄 [user-web] WebSocket reconnected after ${attemptNumber} attempts`
      );
      setIsConnected(true);
    });

    socket.on("reconnect_error", (error) => {
      console.error(`❌ [user-web] WebSocket reconnection error:`, error);
    });

    socket.on("reconnect_failed", () => {
      console.error(
        `❌ [user-web] WebSocket reconnection failed after all attempts`
      );
      setIsConnected(false);
    });

    // Module-specific connection status (if backend emits these)
    socket.on("chat:connected", () => {
      console.log(`✅ [user-web] Chat module connected`);
      setConnectionStatus((prev) => ({ ...prev, chat: true }));
    });

    socket.on("order:connected", () => {
      console.log(`✅ [user-web] Order module connected`);
      setConnectionStatus((prev) => ({ ...prev, order: true }));
    });

    socket.on("reservation:connected", () => {
      console.log(`✅ [user-web] Reservation module connected`);
      setConnectionStatus((prev) => ({ ...prev, reservation: true }));
    });

    socket.on("notification:connected", () => {
      console.log(`✅ [user-web] Notification module connected`);
      setConnectionStatus((prev) => ({ ...prev, notification: true }));
    });
  };

  // Auto-connect when user is authenticated (or allow anonymous)
  useEffect(() => {
    console.log("🔍 [user-web] WebSocket connection effect triggered", {
      hasToken: !!token,
      hasUser: !!user,
      userId: user?.id,
    });

    // Connect even without token (anonymous customer)
    connect();

    return () => {
      console.log("🧹 [user-web] WebSocket cleanup - disconnecting...");
      disconnect();
    };
  }, [token, user, connect, disconnect]);

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
