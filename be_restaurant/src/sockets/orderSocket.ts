import type { Server } from "socket.io";
import { forwardToAdmin, forwardToCustomer, broadcastToAdmin } from "./index";

/**
 * Register Order Socket Handlers
 * Implements namespace-based routing for order events
 */
export default function registerOrderSocket(io: Server) {
  const adminNsp = io.of("/admin");
  const customerNsp = io.of("/customer");

  // ============================================
  // ADMIN NAMESPACE HANDLERS
  // ============================================
  adminNsp.on("connection", (socket) => {
    const userId = socket.data?.user?.id;
    if (!userId) return;

    console.log(`[Order] /admin: Connected user=${userId}`);

    // Admin joins order room
    socket.on("order:join", (orderId: string) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
      console.log(`[Order] /admin: ${userId} joined order:${orderId}`);
    });

    socket.on("order:leave", (orderId: string) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    // Admin joins table room
    socket.on("order:join_table", (tableId: string) => {
      if (!tableId) return;
      socket.join(`table:${tableId}`);
    });

    socket.on("order:leave_table", (tableId: string) => {
      if (!tableId) return;
      socket.leave(`table:${tableId}`);
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

    console.log(`[Order] /customer: Connected user=${userId}`);

    // Customer joins their order room
    socket.on("order:join", (orderId: string) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);

      // Notify admin about customer joining
      forwardToAdmin(io, "order:customer_joined", {
        customer_id: userId,
        orderId,
      });
    });

    socket.on("order:leave", (orderId: string) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    // Customer requests support → forward to admin
    socket.on("order:request_support", (data: { orderId: string }) => {
      if (!data.orderId) return;

      forwardToAdmin(io, "order:support_requested", {
        customer_id: userId,
        orderId: data.orderId,
      });

      broadcastToAdmin(io, "admin:order:support_requested", {
        orderId: data.orderId,
        customerId: userId,
      });
    });
  });
}

/**
 * Event Emitters (for use in services/controllers)
 */
export const orderEvents = {
  orderCreated: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      status: order.status,
      changes: order,
      updatedAt: order.updated_at || new Date().toISOString(),
      ...order,
    };

    // Broadcast to all admins
    broadcastToAdmin(io, "admin:order:created", payload);

    // Forward to specific customer if exists
    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:created", payload);
    }
  },

  orderUpdated: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      status: order.status,
      changes: order,
      updatedAt: order.updated_at || new Date().toISOString(),
      ...order,
    };

    broadcastToAdmin(io, "admin:order:updated", payload);

    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:updated", payload);
    }
  },

  orderStatusChanged: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      status: order.status,
      changes: { status: order.status },
      updatedAt: order.updated_at || new Date().toISOString(),
      ...order,
    };

    broadcastToAdmin(io, "admin:order:status_changed", payload);

    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:status_changed", payload);
    }
  },

  paymentRequested: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      ...order,
    };

    broadcastToAdmin(io, "admin:order:payment_requested", payload);

    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:payment_requested", payload);
    }
  },

  paymentCompleted: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      ...order,
    };

    broadcastToAdmin(io, "admin:order:payment_completed", payload);

    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:payment_completed", payload);
    }
  },

  paymentFailed: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      ...order,
    };

    broadcastToAdmin(io, "admin:order:payment_failed", payload);

    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:payment_failed", payload);
    }
  },

  supportRequested: (io: Server, order: any) => {
    // Only notify admins (not customer)
    broadcastToAdmin(io, "admin:order:support_requested", {
      orderId: order.id,
      customerId: order.user_id || order.customer_id,
      ...order,
    });
  },

  voucherApplied: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      ...order,
    };

    broadcastToAdmin(io, "admin:order:voucher_applied", payload);

    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:voucher_applied", payload);
    }
  },

  voucherRemoved: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      ...order,
    };

    broadcastToAdmin(io, "admin:order:voucher_removed", payload);

    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:voucher_removed", payload);
    }
  },

  orderMerged: (io: Server, order: any) => {
    const payload = {
      orderId: order.id,
      ...order,
    };

    broadcastToAdmin(io, "admin:order:merged", payload);

    const customerId = order.user_id || order.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:merged", payload);
    }
  },
};
