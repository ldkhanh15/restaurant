"use client";

import { useCallback, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuth } from "@/lib/auth";
import { useSocketStore, type Reservation } from "@/store/socketStore";

interface UseReservationSocketReturn {
  isConnected: boolean;
  joinReservation: (reservationId: string) => void;
  leaveReservation: (reservationId: string) => void;
  // Getters from store
  getReservation: (reservationId: string) => Reservation | undefined;
  getReservations: () => Reservation[];
  // Event listeners
  onReservationCreated: (callback: (reservation: Reservation) => void) => void;
  onReservationUpdated: (callback: (reservation: Reservation) => void) => void;
  onReservationStatusChanged: (
    callback: (reservation: Reservation) => void
  ) => void;
  onReservationCheckedIn: (
    callback: (data: { reservation: Reservation; order?: any }) => void
  ) => void;
  onDepositPaymentRequested: (
    callback: (data: { reservation: Reservation; payment_url: string }) => void
  ) => void;
  onDepositPaymentCompleted: (
    callback: (reservation: Reservation) => void
  ) => void;
  onDepositPaymentFailed: (
    callback: (reservation: Reservation) => void
  ) => void;
  // Reservation dish events
  onReservationDishAdded: (
    callback: (data: {
      reservationId: string;
      dish: any;
      reservation: any;
    }) => void
  ) => void;
  onReservationDishUpdated: (
    callback: (data: {
      reservationId: string;
      dish: any;
      reservation: any;
    }) => void
  ) => void;
  onReservationDishRemoved: (
    callback: (data: {
      reservationId: string;
      dishId: string;
      reservation: any;
    }) => void
  ) => void;
  removeListeners: () => void;
}

export function useReservationSocket(): UseReservationSocketReturn {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuth();
  const {
    reservations,
    reservationsByUser,
    addReservation,
    updateReservation,
  } = useSocketStore();

  // Room management
  const joinReservation = useCallback(
    (reservationId: string) => {
      if (socket && isConnected) {
        socket.emit("reservation:join", reservationId);
        console.log(`[Reservation] Joined reservation room: ${reservationId}`);
      }
    },
    [socket, isConnected]
  );

  const leaveReservation = useCallback(
    (reservationId: string) => {
      if (socket && isConnected) {
        socket.emit("reservation:leave", reservationId);
        console.log(`[Reservation] Left reservation room: ${reservationId}`);
      }
    },
    [socket, isConnected]
  );

  // Event listeners - Customer namespace events
  const onReservationCreated = useCallback(
    (callback: (reservation: Reservation) => void) => {
      if (socket) {
        socket.on("reservation:created", (data: any) => {
          const reservation: Reservation = {
            id: data.reservationId || data.id,
            user_id: data.user_id || data.customer_id,
            customer_id: data.customer_id || data.user_id,
            table_id: data.table_id,
            status: data.status || "pending",
            date: data.date,
            time: data.time,
            num_people: data.num_people || data.numPeople || 0,
            created_at:
              data.created_at || data.createdAt || new Date().toISOString(),
            updated_at:
              data.updated_at || data.updatedAt || new Date().toISOString(),
            ...data,
          };
          addReservation(reservation);
          callback(reservation);
        });
      }
    },
    [socket, addReservation]
  );

  const onReservationUpdated = useCallback(
    (callback: (reservation: Reservation) => void) => {
      if (socket) {
        socket.on("reservation:updated", (data: any) => {
          const reservation: Reservation = {
            id: data.reservationId || data.id,
            user_id: data.user_id || data.customer_id,
            customer_id: data.customer_id || data.user_id,
            table_id: data.table_id,
            status: data.status,
            date: data.date,
            time: data.time,
            num_people: data.num_people || data.numPeople || 0,
            created_at:
              data.created_at || data.createdAt || new Date().toISOString(),
            updated_at:
              data.updated_at || data.updatedAt || new Date().toISOString(),
            ...data,
          };
          updateReservation(reservation.id, reservation);
          callback(reservation);
        });
      }
    },
    [socket, updateReservation]
  );

  const onReservationStatusChanged = useCallback(
    (callback: (reservation: Reservation) => void) => {
      if (socket) {
        socket.on("reservation:status_changed", (data: any) => {
          const reservation: Reservation = {
            id: data.reservationId || data.id,
            user_id: data.user_id || data.customer_id,
            customer_id: data.customer_id || data.user_id,
            table_id: data.table_id,
            status: data.status,
            date: data.date,
            time: data.time,
            num_people: data.num_people || data.numPeople || 0,
            created_at:
              data.created_at || data.createdAt || new Date().toISOString(),
            updated_at:
              data.updated_at || data.updatedAt || new Date().toISOString(),
            ...data,
          };
          updateReservation(reservation.id, {
            status: reservation.status,
            updated_at: reservation.updated_at,
          });
          callback(reservation);
        });
      }
    },
    [socket, updateReservation]
  );

  const onReservationCheckedIn = useCallback(
    (callback: (data: { reservation: Reservation; order?: any }) => void) => {
      if (socket) {
        socket.on("reservation:checked_in", (data: any) => {
          const reservation: Reservation = {
            id: data.reservationId || data.reservation?.id,
            user_id: data.user_id || data.reservation?.user_id,
            customer_id: data.customer_id || data.reservation?.customer_id,
            table_id: data.table_id || data.reservation?.table_id,
            status: "checked_in",
            date: data.date || data.reservation?.date,
            time: data.time || data.reservation?.time,
            num_people: data.num_people || data.reservation?.num_people || 0,
            created_at:
              data.created_at ||
              data.reservation?.created_at ||
              new Date().toISOString(),
            updated_at:
              data.updated_at ||
              data.reservation?.updated_at ||
              new Date().toISOString(),
            ...(data.reservation || data),
          };
          updateReservation(reservation.id, { status: "checked_in" });
          callback({
            reservation,
            order: data.order,
          });
        });
      }
    },
    [socket, updateReservation]
  );

  const onDepositPaymentRequested = useCallback(
    (
      callback: (data: {
        reservation: Reservation;
        payment_url: string;
      }) => void
    ) => {
      if (socket) {
        socket.on("reservation:deposit_payment_requested", (data: any) => {
          const reservation: Reservation = {
            id: data.reservationId || data.reservation?.id,
            ...(data.reservation || data),
          };
          updateReservation(reservation.id, reservation);
          callback({
            reservation,
            payment_url: data.payment_url || data.paymentUrl,
          });
        });
      }
    },
    [socket, updateReservation]
  );

  const onDepositPaymentCompleted = useCallback(
    (callback: (reservation: Reservation) => void) => {
      if (socket) {
        socket.on("reservation:deposit_payment_completed", (data: any) => {
          const reservation: Reservation = {
            id: data.reservationId || data.id,
            ...data,
          };
          updateReservation(reservation.id, {
            ...reservation,
            status: "confirmed",
          });
          callback(reservation);
        });
      }
    },
    [socket, updateReservation]
  );

  const onDepositPaymentFailed = useCallback(
    (callback: (reservation: Reservation) => void) => {
      if (socket) {
        socket.on("reservation:deposit_payment_failed", (data: any) => {
          const reservation: Reservation = {
            id: data.reservationId || data.id,
            ...data,
          };
          updateReservation(reservation.id, reservation);
          callback(reservation);
        });
      }
    },
    [socket, updateReservation]
  );

  // Store getters
  const getReservation = useCallback(
    (reservationId: string) => {
      return reservations[reservationId];
    },
    [reservations]
  );

  const getReservations = useCallback(() => {
    return reservationsByUser
      .map((reservationId) => reservations[reservationId])
      .filter(Boolean) as Reservation[];
  }, [reservations, reservationsByUser]);

  // Reservation dish event listeners
  const onReservationDishAdded = useCallback(
    (
      callback: (data: {
        reservationId: string;
        dish: any;
        reservation: any;
      }) => void
    ) => {
      if (socket) {
        socket.on("reservation:dish_added", (data: any) => {
          callback(data);
        });
      }
    },
    [socket]
  );

  const onReservationDishUpdated = useCallback(
    (
      callback: (data: {
        reservationId: string;
        dish: any;
        reservation: any;
      }) => void
    ) => {
      if (socket) {
        socket.on("reservation:dish_updated", (data: any) => {
          callback(data);
        });
      }
    },
    [socket]
  );

  const onReservationDishRemoved = useCallback(
    (
      callback: (data: {
        reservationId: string;
        dishId: string;
        reservation: any;
      }) => void
    ) => {
      if (socket) {
        socket.on("reservation:dish_removed", (data: any) => {
          callback(data);
        });
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
      socket.removeAllListeners("reservation:dish_added");
      socket.removeAllListeners("reservation:dish_updated");
      socket.removeAllListeners("reservation:dish_removed");
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
    getReservation,
    getReservations,
    onReservationCreated,
    onReservationUpdated,
    onReservationStatusChanged,
    onReservationCheckedIn,
    onDepositPaymentRequested,
    onDepositPaymentCompleted,
    onDepositPaymentFailed,
    onReservationDishAdded,
    onReservationDishUpdated,
    onReservationDishRemoved,
    removeListeners,
  };
}
