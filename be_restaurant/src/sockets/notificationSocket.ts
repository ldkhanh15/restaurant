import type { Server } from "socket.io";
import { forwardToCustomer, broadcastToAdmin } from "./index";

/**
 * Register Notification Socket Handlers
 * Implements namespace-based routing for notifications
 */
export default function registerNotificationSocket(io: Server) {
  const adminNsp = io.of("/admin");
  const customerNsp = io.of("/customer");

  // ============================================
  // ADMIN NAMESPACE HANDLERS
  // ============================================
  adminNsp.on("connection", (socket) => {
    const userId = socket.data?.user?.id;
    if (!userId) return;

    console.log(`[Notification] /admin: Connected user=${userId}`);

    // Admin automatically receives all notifications (via admin_room)
    // No specific handlers needed - just listening to events
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

    console.log(`[Notification] /customer: Connected user=${userId}`);

    // Customer automatically receives notifications in their room
    // No specific handlers needed
  });
}

/**
 * Event Emitters (for use in services/controllers)
 */
export const notificationEvents = {
  /**
   * Notify all staff members
   */
  notifyStaff: (io: Server, notification: any) => {
    broadcastToAdmin(io, "admin:notification:new", {
      ...notification,
      type: "staff",
    });
  },

  /**
   * Notify specific user (works for both staff and customer)
   */
  notifyUser: (io: Server, userId: string, notification: any) => {
    // Check if user is staff (would need to query DB in real scenario)
    // For now, notify both namespaces and let frontend filter
    broadcastToAdmin(io, "admin:notification:new", notification);
    forwardToCustomer(io, userId, "notification:new", notification);
  },

  /**
   * Notify specific customer
   */
  notifyCustomer: (io: Server, customerId: string, notification: any) => {
    broadcastToAdmin(io, "admin:notification:new", {
      ...notification,
      customerId,
      type: "customer",
    });

    forwardToCustomer(io, customerId, "notification:new", notification);
  },

  /**
   * Broadcast to all connected clients
   */
  broadcastNotification: (io: Server, notification: any) => {
    broadcastToAdmin(io, "admin:notification:broadcast", notification);
    io.of("/customer").emit("notification:broadcast", notification);
  },

  /**
   * Order-specific notification to staff
   */
  orderNotification: (io: Server, notification: any) => {
    broadcastToAdmin(io, "admin:notification:order", notification);
  },

  /**
   * Reservation-specific notification to staff
   */
  reservationNotification: (io: Server, notification: any) => {
    broadcastToAdmin(io, "admin:notification:reservation", notification);
  },

  /**
   * Chat-specific notification to staff
   */
  chatNotification: (io: Server, notification: any) => {
    broadcastToAdmin(io, "admin:notification:chat", notification);
  },
};
