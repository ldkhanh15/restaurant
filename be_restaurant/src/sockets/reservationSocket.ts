import type { Server } from "socket.io";
import { forwardToAdmin, forwardToCustomer, broadcastToAdmin } from "./index";

/**
 * Register Reservation Socket Handlers
 * Implements namespace-based routing for reservation events
 */
export default function registerReservationSocket(io: Server) {
  const adminNsp = io.of("/admin");
  const customerNsp = io.of("/customer");

  // ============================================
  // ADMIN NAMESPACE HANDLERS
  // ============================================
  adminNsp.on("connection", (socket) => {
    const userId = socket.data?.user?.id;
    if (!userId) return;

    console.log(`[Reservation] /admin: Connected user=${userId}`);

    // Admin joins reservation room
    socket.on("reservation:join", (reservationId: string) => {
      if (!reservationId) return;
      socket.join(`reservation:${reservationId}`);
    });

    socket.on("reservation:leave", (reservationId: string) => {
      if (!reservationId) return;
      socket.leave(`reservation:${reservationId}`);
    });

    // Admin joins table room
    socket.on("reservation:join_table", (tableId: string) => {
      if (!tableId) return;
      socket.join(`table:${tableId}`);
    });

    socket.on("reservation:join_table_group", (tableGroupId: string) => {
      if (!tableGroupId) return;
      socket.join(`table_group:${tableGroupId}`);
    });
  });

  // ============================================
  // CUSTOMER NAMESPACE HANDLERS
  // ============================================
  customerNsp.on("connection", (socket) => {
    const userId = socket.data?.user?.id;
    const userRole = socket.data?.user?.role;

    if (!userId || userRole !== "customer") {
      return; // Only authenticated customers
    }

    console.log(`[Reservation] /customer: Connected user=${userId}`);

    // Customer joins their reservation room
    socket.on("reservation:join", (reservationId: string) => {
      if (!reservationId) return;
      socket.join(`reservation:${reservationId}`);

      // Notify admin
      forwardToAdmin(io, "reservation:customer_joined", {
        customer_id: userId,
        reservationId,
      });
    });

    socket.on("reservation:leave", (reservationId: string) => {
      if (!reservationId) return;
      socket.leave(`reservation:${reservationId}`);
    });
  });
}

/**
 * Event Emitters (for use in services/controllers)
 */
export const reservationEvents = {
  reservationCreated: (io: Server, reservation: any) => {
    const payload = {
      reservationId: reservation.id,
      ...reservation,
    };

    broadcastToAdmin(io, "admin:reservation:created", payload);

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:created",
        payload
      );
    }
  },

  reservationUpdated: (io: Server, reservation: any) => {
    const payload = {
      reservationId: reservation.id,
      ...reservation,
    };

    broadcastToAdmin(io, "admin:reservation:updated", payload);

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:updated",
        payload
      );
    }
  },

  reservationStatusChanged: (io: Server, reservation: any) => {
    const payload = {
      reservationId: reservation.id,
      status: reservation.status,
      changes: { status: reservation.status },
      ...reservation,
    };

    broadcastToAdmin(io, "admin:reservation:status_changed", payload);

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:status_changed",
        payload
      );
    }
  },

  reservationCheckedIn: (io: Server, reservation: any, order: any) => {
    const payload = {
      reservationId: reservation.id,
      reservation,
      order,
    };

    broadcastToAdmin(io, "admin:reservation:checked_in", payload);

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:checked_in",
        payload
      );
    }
  },

  depositPaymentRequested: (
    io: Server,
    reservation: any,
    paymentUrl: string
  ) => {
    const payload = {
      reservationId: reservation.id,
      reservation,
      payment_url: paymentUrl,
    };

    broadcastToAdmin(
      io,
      "admin:reservation:deposit_payment_requested",
      payload
    );

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:deposit_payment_requested",
        payload
      );
    }
  },

  depositPaymentCompleted: (io: Server, reservation: any) => {
    const payload = {
      reservationId: reservation.id,
      ...reservation,
    };

    broadcastToAdmin(
      io,
      "admin:reservation:deposit_payment_completed",
      payload
    );

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:deposit_payment_completed",
        payload
      );
    }
  },

  depositPaymentFailed: (io: Server, reservation: any) => {
    const payload = {
      reservationId: reservation.id,
      ...reservation,
    };

    broadcastToAdmin(io, "admin:reservation:deposit_payment_failed", payload);

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:deposit_payment_failed",
        payload
      );
    }
  },

  // Reservation dish events
  reservationDishAdded: (
    io: Server,
    reservationId: string,
    dish: any,
    reservation: any
  ) => {
    const payload = {
      reservationId,
      dish,
      reservation: {
        id: reservation.id,
        pre_order_items: reservation.pre_order_items,
        deposit_amount: reservation.deposit_amount,
        updated_at: reservation.updated_at,
      },
      updatedAt: new Date().toISOString(),
    };

    broadcastToAdmin(io, "admin:reservation:dish_added", payload);

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:dish_added",
        payload
      );
    }
  },

  reservationDishUpdated: (
    io: Server,
    reservationId: string,
    dish: any,
    reservation: any
  ) => {
    const payload = {
      reservationId,
      dish,
      reservation: {
        id: reservation.id,
        pre_order_items: reservation.pre_order_items,
        deposit_amount: reservation.deposit_amount,
        updated_at: reservation.updated_at,
      },
      updatedAt: new Date().toISOString(),
    };

    broadcastToAdmin(io, "admin:reservation:dish_updated", payload);

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:dish_updated",
        payload
      );
    }
  },

  reservationDishRemoved: (
    io: Server,
    reservationId: string,
    dishId: string,
    reservation: any
  ) => {
    const payload = {
      reservationId,
      dishId,
      reservation: {
        id: reservation.id,
        pre_order_items: reservation.pre_order_items,
        deposit_amount: reservation.deposit_amount,
        updated_at: reservation.updated_at,
      },
      updatedAt: new Date().toISOString(),
    };

    broadcastToAdmin(io, "admin:reservation:dish_removed", payload);

    if (reservation.user_id) {
      forwardToCustomer(
        io,
        reservation.user_id,
        "reservation:dish_removed",
        payload
      );
    }
  },
};
