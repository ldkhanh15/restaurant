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

    // Allow anonymous connections (for guests), but join room if authenticated
    if (userId && userRole === "customer") {
      // Join user-specific room for targeted notifications
      socket.join(`customer:${userId}`);
      console.log(
        `[Notification] /customer: Connected user=${userId}, joined room customer:${userId}`
      );
    } else {
      console.log(`[Notification] /customer: Anonymous connection socket=${socket.id}`);
    }

    // Customer marks notification as read
    socket.on(
      "notification:mark_read",
      async (data: { notificationIds: string[] }) => {
        try {
          if (!userId || userRole !== "customer") {
            socket.emit("notification:error", {
              message: "Unauthorized: Authentication required",
            });
            return;
          }

          if (!data.notificationIds || !Array.isArray(data.notificationIds)) {
            socket.emit("notification:error", {
              message: "Invalid notificationIds",
            });
            return;
          }

          const notificationService = (
            await import("../services/notificationService")
          ).default;

          // Mark each notification as read (service will validate ownership)
          const updatedNotifications = [];
          for (const notifId of data.notificationIds) {
            try {
              const notification =
                await notificationService.getNotificationById(notifId);
              
              // Verify ownership
              if (notification.user_id !== userId) {
                console.warn(
                  `[Notification] User ${userId} attempted to mark notification ${notifId} as read (belongs to ${notification.user_id})`
                );
                continue;
              }

              const updated = await notificationService.markAsRead(notifId);
              updatedNotifications.push(updated);
            } catch (err) {
              console.error(
                `[Notification] Error marking notification ${notifId} as read:`,
                err
              );
            }
          }

          // Emit update to the customer
          socket.emit("notification:update", {
            notifications: updatedNotifications.map((n) => ({
              id: n.id,
              is_read: n.is_read,
            })),
          });

          console.log(
            `[Notification] /customer: User ${userId} marked ${updatedNotifications.length} notifications as read`
          );
        } catch (err) {
          console.error("[Notification] Error in mark_read handler:", err);
          socket.emit("notification:error", {
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    );

    // Customer marks all notifications as read
    socket.on("notification:mark_all_read", async () => {
      try {
        if (!userId || userRole !== "customer") {
          socket.emit("notification:error", {
            message: "Unauthorized: Authentication required",
          });
          return;
        }

        const notificationService = (
          await import("../services/notificationService")
        ).default;

        const result = await notificationService.markAllAsRead(userId);

        // Emit confirmation
        socket.emit("notification:mark_all_read", {
          userId,
          affected_count: result.affected_count,
        });

        console.log(
          `[Notification] /customer: User ${userId} marked all notifications as read (${result.affected_count} affected)`
        );
      } catch (err) {
        console.error("[Notification] Error in mark_all_read handler:", err);
        socket.emit("notification:error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    });
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
    // Notify admin that a customer received a notification
    broadcastToAdmin(io, "admin:notification:new", {
      ...notification,
      customerId,
      type: "customer",
    });

    // Emit to specific customer in /customer namespace
    io.of("/customer")
      .to(`customer:${customerId}`)
      .emit("notification:new", {
        ...notification,
        timestamp: new Date().toISOString(),
      });

    console.log(
      `[Notification] Emitted notification ${notification.id} to customer:${customerId}`
    );
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
