"use client";

import { useEffect, useCallback, useState } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuth } from "@/lib/auth";
import { useSocketStore } from "@/store/socketStore";

/**
 * Base Socket Hook for User-Web
 * Manages connection, reconnection, and room joining for /customer namespace
 */
export function useSocket() {
  const { socket, isConnected, connect, disconnect } = useWebSocket();
  const { user, token } = useAuth();
  const { setConnected } = useSocketStore();
  const [isReady, setIsReady] = useState(false);

  // Update store connection state
  useEffect(() => {
    setConnected(isConnected);
    setIsReady(isConnected && !!socket);
  }, [isConnected, socket, setConnected]);

  // Auto-connect when user is authenticated or token changes
  useEffect(() => {
    if (token || user) {
      connect(token || undefined);
    } else {
      // Allow anonymous connection
      connect();
    }

    return () => {
      // Cleanup on unmount
      disconnect();
    };
  }, [token, user, connect, disconnect]);

  // Join user-specific room when connected
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      // Customer is automatically joined to `customer:${userId}` room by backend
      // But we can emit any additional setup events here if needed
      console.log(`[Socket] User ${user.id} connected to /customer namespace`);
    }
  }, [socket, isConnected, user?.id]);

  // Join order room
  const joinOrderRoom = useCallback(
    (orderId: string) => {
      if (socket && isConnected) {
        socket.emit("order:join", orderId);
        console.log(`[Socket] Joined order room: ${orderId}`);
      }
    },
    [socket, isConnected]
  );

  // Leave order room
  const leaveOrderRoom = useCallback(
    (orderId: string) => {
      if (socket && isConnected) {
        socket.emit("order:leave", orderId);
        console.log(`[Socket] Left order room: ${orderId}`);
      }
    },
    [socket, isConnected]
  );

  // Join reservation room
  const joinReservationRoom = useCallback(
    (reservationId: string) => {
      if (socket && isConnected) {
        socket.emit("reservation:join", reservationId);
        console.log(`[Socket] Joined reservation room: ${reservationId}`);
      }
    },
    [socket, isConnected]
  );

  // Leave reservation room
  const leaveReservationRoom = useCallback(
    (reservationId: string) => {
      if (socket && isConnected) {
        socket.emit("reservation:leave", reservationId);
        console.log(`[Socket] Left reservation room: ${reservationId}`);
      }
    },
    [socket, isConnected]
  );

  // Join chat session
  const joinChatSession = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:join_session", sessionId);
        console.log(`[Socket] Joined chat session: ${sessionId}`);
      }
    },
    [socket, isConnected]
  );

  // Leave chat session
  const leaveChatSession = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        socket.emit("chat:leave_session", sessionId);
        console.log(`[Socket] Left chat session: ${sessionId}`);
      }
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    isReady,
    connect,
    disconnect,
    joinOrderRoom,
    leaveOrderRoom,
    joinReservationRoom,
    leaveReservationRoom,
    joinChatSession,
    leaveChatSession,
  };
}
