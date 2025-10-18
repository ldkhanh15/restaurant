import type { Server } from "socket.io";

export default function registerReservationSocket(io: Server) {
  const nsp = io.of("/reservations");

  nsp.on("connection", (socket) => {
    // Join reservation room
    socket.on("joinReservation", (reservationId: string) => {
      socket.join(`reservation:${reservationId}`);
    });

    // Join table room for reservations
    socket.on("joinTable", (tableId: string) => {
      socket.join(`table:${tableId}`);
    });

    // Join table group room for reservations
    socket.on("joinTableGroup", (tableGroupId: string) => {
      socket.join(`table_group:${tableGroupId}`);
    });

    // Leave reservation room
    socket.on("leaveReservation", (reservationId: string) => {
      socket.leave(`reservation:${reservationId}`);
    });

    // Leave table room
    socket.on("leaveTable", (tableId: string) => {
      socket.leave(`table:${tableId}`);
    });

    // Leave table group room
    socket.on("leaveTableGroup", (tableGroupId: string) => {
      socket.leave(`table_group:${tableGroupId}`);
    });
  });
}

export const reservationEvents = {
  // Emit to reservation room
  reservationCreated: (io: Server, reservation: any) => {
    io.of("/reservations")
      .to(`reservation:${reservation.id}`)
      .emit("reservationCreated", reservation);
    if (reservation.table_id) {
      io.of("/reservations")
        .to(`table:${reservation.table_id}`)
        .emit("reservationCreated", reservation);
    }
    if (reservation.table_group_id) {
      io.of("/reservations")
        .to(`table_group:${reservation.table_group_id}`)
        .emit("reservationCreated", reservation);
    }
  },

  reservationUpdated: (io: Server, reservation: any) => {
    io.of("/reservations")
      .to(`reservation:${reservation.id}`)
      .emit("reservationUpdated", reservation);
    if (reservation.table_id) {
      io.of("/reservations")
        .to(`table:${reservation.table_id}`)
        .emit("reservationUpdated", reservation);
    }
    if (reservation.table_group_id) {
      io.of("/reservations")
        .to(`table_group:${reservation.table_group_id}`)
        .emit("reservationUpdated", reservation);
    }
  },

  reservationStatusChanged: (io: Server, reservation: any) => {
    io.of("/reservations")
      .to(`reservation:${reservation.id}`)
      .emit("reservationStatusChanged", reservation);
    if (reservation.table_id) {
      io.of("/reservations")
        .to(`table:${reservation.table_id}`)
        .emit("reservationStatusChanged", reservation);
    }
    if (reservation.table_group_id) {
      io.of("/reservations")
        .to(`table_group:${reservation.table_group_id}`)
        .emit("reservationStatusChanged", reservation);
    }
  },

  reservationCheckedIn: (io: Server, reservation: any, order: any) => {
    io.of("/reservations")
      .to(`reservation:${reservation.id}`)
      .emit("reservationCheckedIn", { reservation, order });
    if (reservation.table_id) {
      io.of("/reservations")
        .to(`table:${reservation.table_id}`)
        .emit("reservationCheckedIn", { reservation, order });
    }
    if (reservation.table_group_id) {
      io.of("/reservations")
        .to(`table_group:${reservation.table_group_id}`)
        .emit("reservationCheckedIn", { reservation, order });
    }
  },

  depositPaymentRequested: (
    io: Server,
    reservation: any,
    paymentUrl: string
  ) => {
    io.of("/reservations")
      .to(`reservation:${reservation.id}`)
      .emit("depositPaymentRequested", {
        reservation,
        payment_url: paymentUrl,
      });
  },

  depositPaymentCompleted: (io: Server, reservation: any) => {
    io.of("/reservations")
      .to(`reservation:${reservation.id}`)
      .emit("depositPaymentCompleted", reservation);
    if (reservation.table_id) {
      io.of("/reservations")
        .to(`table:${reservation.table_id}`)
        .emit("depositPaymentCompleted", reservation);
    }
    if (reservation.table_group_id) {
      io.of("/reservations")
        .to(`table_group:${reservation.table_group_id}`)
        .emit("depositPaymentCompleted", reservation);
    }
  },

  depositPaymentFailed: (io: Server, reservation: any) => {
    io.of("/reservations")
      .to(`reservation:${reservation.id}`)
      .emit("depositPaymentFailed", reservation);
  },
};
