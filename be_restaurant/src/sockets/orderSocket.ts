import type { Server } from "socket.io";
import { forwardToAdmin, forwardToCustomer, broadcastToAdmin } from "./index";
import { tableEvents } from "./tableSocket";

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
 * Helper function to serialize order object to avoid circular references
 * Uses JSON.parse(JSON.stringify()) with custom replacer to handle circular refs
 */
export function serializeOrder(order: any): any {
  if (!order) return null;

  // Convert to plain object if it's a Sequelize model
  const orderData =
    order && typeof order.toJSON === "function" ? order.toJSON() : order;

  const toNumber = (value: any) => {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Serialize items separately to avoid circular references
  const items = orderData.items
    ? orderData.items.map((item: any) => {
        const itemData =
          item && typeof item.toJSON === "function" ? item.toJSON() : item;
        return {
          id: itemData.id,
          order_id: itemData.order_id,
          dish_id: itemData.dish_id,
          quantity: toNumber(itemData.quantity),
          price: toNumber(itemData.price),
          status: itemData.status,
          dish: itemData.dish
            ? {
                id: itemData.dish.id,
                name: itemData.dish.name,
                price: toNumber(itemData.dish.price),
                media_urls: itemData.dish.media_urls || [],
                description: itemData.dish.description,
              }
            : null,
        };
      })
    : [];

  // Serialize related objects
  const user = orderData.user
    ? {
        id: orderData.user.id,
        username: orderData.user.username,
        email: orderData.user.email,
        phone: orderData.user.phone,
      }
    : null;

  const table = orderData.table
    ? {
        id: orderData.table.id,
        table_number: orderData.table.table_number,
        capacity: orderData.table.capacity,
        status: orderData.table.status,
      }
    : null;

  const voucher = orderData.voucher
    ? {
        id: orderData.voucher.id,
        code: orderData.voucher.code,
        discount_type: orderData.voucher.discount_type,
        value: toNumber(orderData.voucher.value),
      }
    : null;

  return {
    id: orderData.id,
    orderId: orderData.id,
    status: orderData.status,
    payment_status: orderData.payment_status,
    total_amount: toNumber(orderData.total_amount),
    final_amount: toNumber(
      orderData.final_amount ?? orderData.total_amount ?? orderData.total
    ),
    voucher_discount_amount: toNumber(orderData.voucher_discount_amount),
    payment_method: orderData.payment_method,
    payment_note: orderData.payment_note,
    user_id: orderData.user_id,
    customer_id: orderData.customer_id,
    table_id: orderData.table_id,
    reservation_id: orderData.reservation_id,
    voucher_id: orderData.voucher_id,
    created_at: orderData.created_at,
    updated_at: orderData.updated_at,
    items,
    user,
    table,
    voucher,
  };
}

/**
 * Event Emitters (for use in services/controllers)
 */
export const orderEvents = {
  orderCreated: (io: Server, order: any) => {
    const serialized = serializeOrder(order);
    if (!serialized) return;

    const payload = {
      orderId: serialized.id,
      status: serialized.status,
      updatedAt: serialized.updated_at || new Date().toISOString(),
      ...serialized,
    };

    // Broadcast to all admins
    broadcastToAdmin(io, "admin:order:created", payload);

    // Forward to specific customer if exists
    const customerId = serialized.user_id || serialized.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:created", payload);
    }
  },

  orderUpdated: (io: Server, order: any) => {
    const serialized = serializeOrder(order);
    if (!serialized) return;

    const payload = {
      orderId: serialized.id,
      status: serialized.status,
      updatedAt: serialized.updated_at || new Date().toISOString(),
      ...serialized,
    };

    broadcastToAdmin(io, "admin:order:updated", payload);

    const customerId = serialized.user_id || serialized.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:updated", payload);
    }

    // Also emit to table room for walk-in customers
    if (serialized.table_id) {
      tableEvents.tableOrderUpdated(io, serialized.table_id, payload);
    }
  },

  orderStatusChanged: (io: Server, order: any) => {
    const serialized = serializeOrder(order);
    if (!serialized) return;

    const payload = {
      orderId: serialized.id,
      status: serialized.status,
      updatedAt: serialized.updated_at || new Date().toISOString(),
      ...serialized,
    };

    broadcastToAdmin(io, "admin:order:status_changed", payload);

    const customerId = serialized.user_id || serialized.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:status_changed", payload);
    }

    // Also emit to table room for walk-in customers
    // Pass the original order object (not serialized payload) to ensure items are included
    if (serialized.table_id) {
      tableEvents.tableOrderUpdated(io, serialized.table_id, order);
    }
  },

  paymentRequested: (io: Server, order: any) => {
    const payload = serializeOrder(order);
    if (!payload) return;

    broadcastToAdmin(io, "admin:order:payment_requested", payload);

    const customerId = payload.user_id || payload.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:payment_requested", payload);
    }

    // Also emit to table room for walk-in customers
    if (payload.table_id) {
      tableEvents.tableOrderUpdated(io, payload.table_id, order);
    }
  },

  paymentCompleted: (io: Server, order: any) => {
    const payload = serializeOrder(order);
    if (!payload) return;

    broadcastToAdmin(io, "admin:order:payment_completed", payload);

    const customerId = payload.user_id || payload.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:payment_completed", payload);
    }

    // Also emit to table room for walk-in customers
    if (payload.table_id) {
      tableEvents.tableOrderUpdated(io, payload.table_id, order);
    }
  },

  paymentFailed: (io: Server, order: any) => {
    const payload = serializeOrder(order);
    if (!payload) return;

    broadcastToAdmin(io, "admin:order:payment_failed", payload);

    const customerId = payload.user_id || payload.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:payment_failed", payload);
    }

    // Also emit to table room for walk-in customers
    if (payload.table_id) {
      tableEvents.tableOrderUpdated(io, payload.table_id, order);
    }
  },

  supportRequested: (io: Server, order: any) => {
    const serialized = serializeOrder(order);
    if (!serialized) return;

    // Only notify admins (not customer)
    broadcastToAdmin(io, "admin:order:support_requested", {
      orderId: serialized.id,
      customerId: serialized.user_id || serialized.customer_id,
      table_id: serialized.table_id,
      ...serialized,
    });
  },

  voucherApplied: (io: Server, order: any) => {
    const serialized = serializeOrder(order);
    if (!serialized) return;

    const payload = {
      orderId: serialized.id,
      ...serialized,
    };

    broadcastToAdmin(io, "admin:order:voucher_applied", payload);

    const customerId = serialized.user_id || serialized.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:voucher_applied", payload);
    }

    // Also emit to table room for walk-in customers
    if (serialized.table_id) {
      tableEvents.tableOrderUpdated(io, serialized.table_id, payload);
    }
  },

  voucherRemoved: (io: Server, order: any) => {
    const serialized = serializeOrder(order);
    if (!serialized) return;

    const payload = {
      orderId: serialized.id,
      ...serialized,
    };

    broadcastToAdmin(io, "admin:order:voucher_removed", payload);

    const customerId = serialized.user_id || serialized.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:voucher_removed", payload);
    }

    // Also emit to table room for walk-in customers
    if (serialized.table_id) {
      tableEvents.tableOrderUpdated(io, serialized.table_id, payload);
    }
  },

  orderMerged: (io: Server, order: any) => {
    const serialized = serializeOrder(order);
    if (!serialized) return;

    const payload = {
      orderId: serialized.id,
      ...serialized,
    };

    broadcastToAdmin(io, "admin:order:merged", payload);

    const customerId = serialized.user_id || serialized.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:merged", payload);
    }
  },

  // OrderItem Events
  orderItemCreated: (io: Server, orderId: string, item: any, order: any) => {
    // Serialize item
    const itemData =
      item && typeof item.toJSON === "function" ? item.toJSON() : item;
    const serializedItem = {
      id: itemData.id,
      order_id: itemData.order_id,
      dish_id: itemData.dish_id,
      quantity: Number(itemData.quantity) || 0,
      price: Number(itemData.price) || 0,
      status: itemData.status,
      dish: itemData.dish
        ? {
            id: itemData.dish.id,
            name: itemData.dish.name,
            price: Number(itemData.dish.price) || 0,
            media_urls: itemData.dish.media_urls || [],
            description: itemData.dish.description,
          }
        : null,
    };

    // Serialize order summary
    const orderData =
      order && typeof order.toJSON === "function" ? order.toJSON() : order;
    const orderSummary = {
      id: orderData.id,
      total_amount: Number(orderData.total_amount) || 0,
      final_amount:
        Number(orderData.final_amount || orderData.total_amount) || 0,
      status: orderData.status,
      table_id: orderData.table_id,
    };

    const payload = {
      orderId,
      itemId: serializedItem.id,
      item: serializedItem,
      order: orderSummary,
      updatedAt: new Date().toISOString(),
    };

    // Broadcast to all admins in order room
    io.of("/admin")
      .to(`order:${orderId}`)
      .emit("admin:order:item_created", payload);

    // Also emit to table room for walk-in customers
    if (orderSummary.table_id) {
      io.to(`table:${orderSummary.table_id}`).emit(
        "table:order_item_created",
        payload
      );
    }

    // Forward to customer if exists
    const customerId = orderData.user_id || orderData.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:item_created", payload);
    }
  },

  orderItemQuantityChanged: (
    io: Server,
    orderId: string,
    item: any,
    order: any
  ) => {
    // Serialize item
    const itemData =
      item && typeof item.toJSON === "function" ? item.toJSON() : item;
    const serializedItem = {
      id: itemData.id,
      order_id: itemData.order_id,
      dish_id: itemData.dish_id,
      quantity: Number(itemData.quantity) || 0,
      price: Number(itemData.price) || 0,
      status: itemData.status,
      dish: itemData.dish
        ? {
            id: itemData.dish.id,
            name: itemData.dish.name,
            price: Number(itemData.dish.price) || 0,
            media_urls: itemData.dish.media_urls || [],
            description: itemData.dish.description,
          }
        : null,
    };

    // Serialize order summary
    const orderData =
      order && typeof order.toJSON === "function" ? order.toJSON() : order;
    const orderSummary = {
      id: orderData.id,
      total_amount: Number(orderData.total_amount) || 0,
      final_amount:
        Number(orderData.final_amount || orderData.total_amount) || 0,
      status: orderData.status,
      table_id: orderData.table_id,
    };

    const payload = {
      orderId,
      itemId: serializedItem.id,
      item: serializedItem,
      order: orderSummary,
      updatedAt: new Date().toISOString(),
    };

    // Broadcast to all admins in order room
    io.of("/admin")
      .to(`order:${orderId}`)
      .emit("admin:order:item_quantity_changed", payload);

    // Also emit to table room for walk-in customers
    if (orderSummary.table_id) {
      io.to(`table:${orderSummary.table_id}`).emit(
        "table:order_item_updated",
        payload
      );
      tableEvents.tableOrderUpdated(io, orderSummary.table_id, orderSummary);
    }

    // Forward to customer if exists
    const customerId = orderData.user_id || orderData.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:item_quantity_changed", payload);
    }
  },

  orderItemDeleted: (
    io: Server,
    orderId: string,
    itemId: string,
    order: any
  ) => {
    // Serialize order summary
    const orderData =
      order && typeof order.toJSON === "function" ? order.toJSON() : order;
    const toNumber = (value: any) => {
      if (value === null || value === undefined) return 0;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const orderSummary = {
      id: orderData.id,
      total_amount: toNumber(orderData.total_amount),
      final_amount: toNumber(orderData.final_amount || orderData.total_amount),
      status: orderData.status,
      table_id: orderData.table_id,
    };

    const payload = {
      orderId,
      itemId,
      order: orderSummary,
      updatedAt: new Date().toISOString(),
    };

    // Broadcast to all admins in order room
    io.of("/admin")
      .to(`order:${orderId}`)
      .emit("admin:order:item_deleted", payload);

    // Also emit to table room for walk-in customers
    if (orderSummary.table_id) {
      io.to(`table:${orderSummary.table_id}`).emit(
        "table:order_item_deleted",
        payload
      );
      tableEvents.tableOrderUpdated(io, orderSummary.table_id, orderSummary);
    }

    // Forward to customer if exists
    const customerId = orderData.user_id || orderData.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:item_deleted", payload);
    }
  },

  orderItemStatusChanged: (
    io: Server,
    orderId: string,
    item: any,
    order: any
  ) => {
    // Serialize item
    const itemData =
      item && typeof item.toJSON === "function" ? item.toJSON() : item;
    const serializedItem = {
      id: itemData.id,
      order_id: itemData.order_id,
      dish_id: itemData.dish_id,
      quantity: Number(itemData.quantity) || 0,
      price: Number(itemData.price) || 0,
      status: itemData.status,
      dish: itemData.dish
        ? {
            id: itemData.dish.id,
            name: itemData.dish.name,
            price: Number(itemData.dish.price) || 0,
            media_urls: itemData.dish.media_urls || [],
            description: itemData.dish.description,
          }
        : null,
    };

    // Serialize order summary
    const orderData =
      order && typeof order.toJSON === "function" ? order.toJSON() : order;
    const orderSummary = {
      id: orderData.id,
      total_amount: Number(orderData.total_amount) || 0,
      final_amount:
        Number(orderData.final_amount || orderData.total_amount) || 0,
      status: orderData.status,
      table_id: orderData.table_id,
    };

    const payload = {
      orderId,
      itemId: serializedItem.id,
      item: serializedItem,
      order: orderSummary,
      updatedAt: new Date().toISOString(),
    };

    // Broadcast to all admins in order room
    io.of("/admin")
      .to(`order:${orderId}`)
      .emit("admin:order:item_status_changed", payload);

    // Also emit to table room for walk-in customers
    if (orderSummary.table_id) {
      io.to(`table:${orderSummary.table_id}`).emit(
        "table:order_item_status_changed",
        payload
      );
      tableEvents.tableOrderUpdated(io, orderSummary.table_id, orderSummary);
    }

    // Forward to customer if exists
    const customerId = orderData.user_id || orderData.customer_id;
    if (customerId) {
      forwardToCustomer(io, customerId, "order:item_status_changed", payload);
    }
  },
};
