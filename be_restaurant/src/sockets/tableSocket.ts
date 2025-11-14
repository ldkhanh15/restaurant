import type { Server } from "socket.io";
import { forwardToAdmin, broadcastToAdmin } from "./index";
import { serializeOrder } from "./orderSocket";

/**
 * Register Table Socket Handlers
 * Implements namespace-based routing for table events (for guest customers)
 * Namespace: /table/:tableId (no auth required)
 */
export default function registerTableSocket(io: Server) {
  // Dynamic namespace registration for /table/:tableId
  // Socket.IO doesn't support dynamic namespaces directly, so we'll use a different approach
  // We'll use the root namespace with room-based routing instead

  io.on("connection", (socket) => {
    // Guest customers can join table rooms
    socket.on("table:join", (tableId: string) => {
      if (!tableId) return;
      socket.join(`table:${tableId}`);
      console.log(`[Table] Guest joined table:${tableId} socket=${socket.id}`);

      // Notify admin about guest joining table
      broadcastToAdmin(io, "admin:table:guest_joined", {
        table_id: tableId,
        socket_id: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("table:leave", (tableId: string) => {
      if (!tableId) return;
      socket.leave(`table:${tableId}`);
      console.log(`[Table] Guest left table:${tableId} socket=${socket.id}`);
    });
  });
}

/**
 * Event Emitters (for use in services/controllers)
 */
export const tableEvents = {
  /**
   * Emit when table status changes
   */
  tableStatusChanged: (
    io: Server,
    tableId: string,
    status: string,
    table?: any
  ) => {
    const payload = {
      table_id: tableId,
      status,
      table: table || { id: tableId, status },
      updatedAt: new Date().toISOString(),
    };

    // Emit to guests in table room
    io.to(`table:${tableId}`).emit("table:status_changed", payload);

    // Broadcast to all admins
    broadcastToAdmin(io, "admin:table:status_changed", payload);
  },

  /**
   * Emit when order is created for a table
   */
  tableOrderCreated: (io: Server, tableId: string, order: any) => {
    const payload = {
      table_id: tableId,
      orderId: order.id,
      order: {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        final_amount: order.final_amount,
        user_id: order.user_id,
      },
      updatedAt: new Date().toISOString(),
    };

    // Emit to guests in table room
    io.to(`table:${tableId}`).emit("table:order_created", payload);

    // Broadcast to all admins
    broadcastToAdmin(io, "admin:table:order_created", payload);
  },

  /**
   * Emit when order is updated for a table
   * Uses serializeOrder from orderSocket to ensure full order data with items
   */
  tableOrderUpdated: (io: Server, tableId: string, order: any) => {
    // Serialize order to get full order data with items
    const serializedOrder = serializeOrder(order);

    const payload = {
      table_id: tableId,
      orderId: serializedOrder?.id || order?.id,
      order: serializedOrder || {
        id: order?.id,
        status: order?.status,
        total_amount: Number(order?.total_amount) || 0,
        final_amount: Number(order?.final_amount || order?.total_amount) || 0,
        payment_status: order?.payment_status,
        table_id: order?.table_id,
        items: order?.items || [],
      },
      updatedAt: new Date().toISOString(),
    };

    // Emit to guests in table room
    io.to(`table:${tableId}`).emit("table:order_updated", payload);

    // Broadcast to all admins
    broadcastToAdmin(io, "admin:table:order_updated", payload);
  },
};
