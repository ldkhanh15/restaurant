"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: {
    chat: boolean;
    order: boolean;
    notification: boolean;
    reservation: boolean;
  };
  isConnecting: boolean;
  connect: (token?: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  token,
}) => {
  const {
    isConnected,
    connectionStatus,
    isConnecting,
    connect,
    disconnect,
    reconnect,
  } = useWebSocket({
    autoConnect: true,
    token,
  });

  // Auto-reconnect when token changes
  useEffect(() => {
    if (token) {
      connect(token);
    }
  }, [token, connect]);

  const value: WebSocketContextType = {
    isConnected,
    connectionStatus,
    isConnecting,
    connect,
    disconnect,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Connection Status Indicator Component
export const WebSocketStatusIndicator: React.FC = () => {
  const { isConnected, connectionStatus, isConnecting } = useWebSocketContext();

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm">Đang kết nối...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm">Mất kết nối</span>
      </div>
    );
  }

  const connectedServices = Object.entries(connectionStatus)
    .filter(([_, connected]) => connected)
    .map(([service, _]) => service);

  return (
    <div className="flex items-center gap-2 text-green-600">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span className="text-sm">Kết nối ({connectedServices.length}/4)</span>
    </div>
  );
};

// WebSocket Connection Manager Component
export const WebSocketManager: React.FC = () => {
  const { isConnected, isConnecting, reconnect, disconnect } =
    useWebSocketContext();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">WebSocket Status</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showDetails ? "−" : "+"}
          </button>
        </div>

        <WebSocketStatusIndicator />

        {showDetails && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span>Chat:</span>
              <span
                className={
                  connectionStatus.chat ? "text-green-600" : "text-red-600"
                }
              >
                {connectionStatus.chat ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Order:</span>
              <span
                className={
                  connectionStatus.order ? "text-green-600" : "text-red-600"
                }
              >
                {connectionStatus.order ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Reservation:</span>
              <span
                className={
                  connectionStatus.reservation
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {connectionStatus.reservation ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Notification:</span>
              <span
                className={
                  connectionStatus.notification
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {connectionStatus.notification ? "✓" : "✗"}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={reconnect}
                disabled={isConnecting}
                className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Kết nối lại
              </button>
              <button
                onClick={disconnect}
                className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Ngắt kết nối
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
