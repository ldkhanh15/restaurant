import type { Server } from "socket.io";

export default function registerNotificationSocket(io: Server) {
  const nsp = io.of("/notifications");

  nsp.on("connection", (socket) => {
    // Join staff/admin room for receiving notifications
    socket.on("joinStaffRoom", () => {
      socket.join("staff");
    });

    // Join specific user room for personal notifications
    socket.on("joinUserRoom", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    // Leave user room
    socket.on("leaveUserRoom", (userId: string) => {
      socket.leave(`user:${userId}`);
    });
  });
}

export const notificationEvents = {
  // Emit to all staff members
  notifyStaff: (io: Server, notification: any) => {
    io.of("/notifications").to("staff").emit("newNotification", notification);
  },

  // Emit to specific user
  notifyUser: (io: Server, userId: string, notification: any) => {
    io.of("/notifications")
      .to(`user:${userId}`)
      .emit("newNotification", notification);
  },

  // Emit to all connected clients
  broadcastNotification: (io: Server, notification: any) => {
    io.of("/notifications").emit("newNotification", notification);
  },
};




