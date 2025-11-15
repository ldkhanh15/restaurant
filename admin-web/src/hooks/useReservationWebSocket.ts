"use client";

import { useCallback, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuthStore } from "@/store/authStore";

interface ReservationStatus {
  id: string;
  status: string;
  updatedAt: Date;
  updatedBy: string;
  note?: string;
}

interface TableAssignment {
  reservationId: string;
  tableId: string;
  assignedAt: Date;
  assignedBy: string;
}

interface ReservationNote {
  id: string;
  reservationId: string;
  content: string;
  type: "public" | "internal";
  createdAt: Date;
  createdBy: string;
  createdByRole: string;
}

interface UseReservationWebSocketReturn {
  isConnected: boolean;
  joinReservation: (reservationId: string) => void;
  leaveReservation: (reservationId: string) => void;
  updateReservationStatus: (
    reservationId: string,
    status: string,
    note?: string
  ) => void;
  assignTable: (reservationId: string, tableId: string) => void;
  addReservationNote: (
    reservationId: string,
    note: string,
    type: "public" | "internal"
  ) => void;
  onReservationCreated: (callback: (reservation: any) => void) => void;
  onReservationUpdated: (callback: (reservation: any) => void) => void;
  onReservationStatusChanged: (callback: (reservation: any) => void) => void;
  onReservationCheckedIn: (
    callback: (data: { reservation: any; order: any }) => void
  ) => void;
  onDepositPaymentRequested: (
    callback: (data: { reservation: any; payment_url: string }) => void
  ) => void;
  onDepositPaymentCompleted: (callback: (reservation: any) => void) => void;
  onDepositPaymentFailed: (callback: (reservation: any) => void) => void;
  onTableAssigned: (callback: (data: TableAssignment) => void) => void;
  onReservationNoteAdded: (callback: (data: ReservationNote) => void) => void;
  removeListeners: () => void;
}

export function useReservationWebSocket(): UseReservationWebSocketReturn {
  const { adminSocket, customerSocket, isConnected } = useWebSocket();
  const { user } = useAuthStore();

  const socket =
    user?.role === "admin" || user?.role === "staff"
      ? adminSocket
      : customerSocket;

  // Room management
  const joinReservation = useCallback(
    (reservationId: string) => {
      if (socket && isConnected) {
        socket.emit("reservation:join", reservationId);
      }
    },
    [socket, isConnected]
  );

  const leaveReservation = useCallback(
    (reservationId: string) => {
      if (socket && isConnected) {
        socket.emit("reservation:leave", reservationId);
      }
    },
    [socket, isConnected]
  );

  // Admin/Staff only functions
  const updateReservationStatus = useCallback(
    (reservationId: string, status: string, note?: string) => {
      if (
        socket &&
        isConnected &&
        (user?.role === "admin" || user?.role === "staff")
      ) {
        socket.emit("reservation:update_status", {
          reservationId,
          status,
          note,
        });
      }
    },
    [socket, isConnected, user?.role]
  );

  const assignTable = useCallback(
    (reservationId: string, tableId: string) => {
      if (
        socket &&
        isConnected &&
        (user?.role === "admin" || user?.role === "staff")
      ) {
        socket.emit("reservation:assign_table", { reservationId, tableId });
      }
    },
    [socket, isConnected, user?.role]
  );

  // Functions for both admin and customer
  const addReservationNote = useCallback(
    (reservationId: string, note: string, type: "public" | "internal") => {
      if (socket && isConnected) {
        socket.emit("reservation:add_note", { reservationId, note, type });
      }
    },
    [socket, isConnected]
  );

  // Event listeners
  const onReservationCreated = useCallback(
    (callback: (reservation: any) => void) => {
      if (socket) {
        socket.on("admin:reservation:created", callback);
        // Legacy support
        socket.on("reservation:created", callback);
        socket.on("reservationCreated", callback);
      }
    },
    [socket]
  );

  const onReservationUpdated = useCallback(
    (callback: (reservation: any) => void) => {
      if (socket) {
        socket.on("reservation:updated", callback);
        socket.on("reservationUpdated", callback);
      }
    },
    [socket]
  );

  const onReservationStatusChanged = useCallback(
    (callback: (reservation: any) => void) => {
      if (socket) {
        socket.on("reservation:status_changed", callback);
        socket.on("reservationStatusChanged", callback);
        socket.on("reservation:status_updated", callback);
      }
    },
    [socket]
  );

  const onReservationCheckedIn = useCallback(
    (callback: (data: { reservation: any; order: any }) => void) => {
      if (socket) {
        socket.on("reservation:checked_in", callback);
        socket.on("reservationCheckedIn", callback);
      }
    },
    [socket]
  );

  const onDepositPaymentRequested = useCallback(
    (callback: (data: { reservation: any; payment_url: string }) => void) => {
      if (socket) {
        socket.on("reservation:deposit_payment_requested", callback);
        socket.on("depositPaymentRequested", callback);
      }
    },
    [socket]
  );

  const onDepositPaymentCompleted = useCallback(
    (callback: (reservation: any) => void) => {
      if (socket) {
        socket.on("reservation:deposit_payment_completed", callback);
        socket.on("depositPaymentCompleted", callback);
      }
    },
    [socket]
  );

  const onDepositPaymentFailed = useCallback(
    (callback: (reservation: any) => void) => {
      if (socket) {
        socket.on("reservation:deposit_payment_failed", callback);
        socket.on("depositPaymentFailed", callback);
      }
    },
    [socket]
  );

  const onTableAssigned = useCallback(
    (callback: (data: TableAssignment) => void) => {
      if (socket) {
        socket.on("reservation:table_assigned", callback);
      }
    },
    [socket]
  );

  const onReservationNoteAdded = useCallback(
    (callback: (data: ReservationNote) => void) => {
      if (socket) {
        socket.on("reservation:note_added", callback);
      }
    },
    [socket]
  );

  // Cleanup function
  const removeListeners = useCallback(() => {
    if (socket) {
      socket.removeAllListeners("reservation:created");
      socket.removeAllListeners("reservation:updated");
      socket.removeAllListeners("reservation:status_changed");
      socket.removeAllListeners("reservation:checked_in");
      socket.removeAllListeners("reservation:deposit_payment_requested");
      socket.removeAllListeners("reservation:deposit_payment_completed");
      socket.removeAllListeners("reservation:deposit_payment_failed");
      socket.removeAllListeners("reservation:status_updated");
      socket.removeAllListeners("reservation:table_assigned");
      socket.removeAllListeners("reservation:note_added");
      // Legacy
      socket.removeAllListeners("reservationCreated");
      socket.removeAllListeners("reservationUpdated");
      socket.removeAllListeners("reservationStatusChanged");
      socket.removeAllListeners("reservationCheckedIn");
      socket.removeAllListeners("depositPaymentRequested");
      socket.removeAllListeners("depositPaymentCompleted");
      socket.removeAllListeners("depositPaymentFailed");
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
    joinReservation,
    leaveReservation,
    updateReservationStatus,
    assignTable,
    addReservationNote,
    onReservationCreated,
    onReservationUpdated,
    onReservationStatusChanged,
    onReservationCheckedIn,
    onDepositPaymentRequested,
    onDepositPaymentCompleted,
    onDepositPaymentFailed,
    onTableAssigned,
    onReservationNoteAdded,
    removeListeners,
  };
}
