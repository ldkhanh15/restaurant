import type { Server } from "socket.io";

export default function registerOrderSocket(io: Server) {
  const nsp = io.of("/order");

  nsp.on("connection", (socket) => {
    // Join order room
    socket.on("joinOrder", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    // Join table room
    socket.on("joinTable", (tableId: string) => {
      socket.join(`table:${tableId}`);
    });

    // Leave order room
    socket.on("leaveOrder", (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // Leave table room
    socket.on("leaveTable", (tableId: string) => {
      socket.leave(`table:${tableId}`);
    });
  });
}

export const orderEvents = {
  // Emit to order room
  orderCreated: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("orderCreated", order);
    if (order.table_id) {
      io.of("/order").to(`table:${order.table_id}`).emit("orderCreated", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("orderCreated", order);
    }
  },

  orderUpdated: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("orderUpdated", order);
    if (order.table_id) {
      io.of("/order").to(`table:${order.table_id}`).emit("orderUpdated", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("orderUpdated", order);
    }
  },

  orderStatusChanged: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("orderStatusChanged", order);
    if (order.table_id) {
      io.of("/order")
        .to(`table:${order.table_id}`)
        .emit("orderStatusChanged", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("orderStatusChanged", order);
    }
  },

  paymentRequested: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("paymentRequested", order);
    if (order.table_id) {
      io.of("/order")
        .to(`table:${order.table_id}`)
        .emit("paymentRequested", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("paymentRequested", order);
    }
  },

  paymentCompleted: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("paymentCompleted", order);
    if (order.table_id) {
      io.of("/order")
        .to(`table:${order.table_id}`)
        .emit("paymentCompleted", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("paymentCompleted", order);
    }
  },

  paymentFailed: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("paymentFailed", order);
    if (order.table_id) {
      io.of("/order")
        .to(`table:${order.table_id}`)
        .emit("paymentFailed", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("paymentFailed", order);
    }
  },

  supportRequested: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("supportRequested", order);
    if (order.table_id) {
      io.of("/order")
        .to(`table:${order.table_id}`)
        .emit("supportRequested", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("supportRequested", order);
    }
  },

  voucherApplied: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("voucherApplied", order);
    if (order.table_id) {
      io.of("/order")
        .to(`table:${order.table_id}`)
        .emit("voucherApplied", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("voucherApplied", order);
    }
  },

  voucherRemoved: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("voucherRemoved", order);
    if (order.table_id) {
      io.of("/order")
        .to(`table:${order.table_id}`)
        .emit("voucherRemoved", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("voucherRemoved", order);
    }
  },

  orderMerged: (io: Server, order: any) => {
    io.of("/order").to(`order:${order.id}`).emit("orderMerged", order);
    if (order.table_id) {
      io.of("/order").to(`table:${order.table_id}`).emit("orderMerged", order);
    }
    if (order.table_group_id) {
      io.of("/order")
        .to(`table:${order.table_group_id}`)
        .emit("orderMerged", order);
    }
  },
};
