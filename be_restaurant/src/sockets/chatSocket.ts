import type { Server } from "socket.io";
import chatMessageService from "../services/chatMessage_app_userService";
import User from "../models/User";

export default function registerChatSocket(io: Server) {
  const nsp = io.of("/chat");

  nsp.on("connection", (socket) => {
    // Auto expose user on socket from global middleware

    // Support clients emitting a simple 'join' with a room payload (e.g. 'session:xxx')
    socket.on("join", (data: any) => {
      try {
        const room = typeof data === "string" ? data : data?.room;
        if (!room) return;
        // Accept room formats like 'session:ID' or 'session_ID' or just the id
        let sessionId = room;
        if (room.startsWith("session:")) sessionId = room.split(":", 2)[1];
        if (room.startsWith("session_")) sessionId = room.split("_", 2)[1];

        socket.join(`session:${sessionId}`);
        socket.join(`session_${sessionId}`);
      } catch (err) {
        // ignore
      }
    });

    // Backwards-compatible events
    socket.on("joinSession", (sessionId: string) => {
      if (!sessionId) return;
      socket.join(`session:${sessionId}`);
      socket.join(`session_${sessionId}`);
    });

    socket.on("leave", (data: any) => {
      try {
        const room = typeof data === "string" ? data : data?.room;
        if (!room) return;
        let sessionId = room;
        if (room.startsWith("session:")) sessionId = room.split(":", 2)[1];
        if (room.startsWith("session_")) sessionId = room.split("_", 2)[1];

        socket.leave(`session:${sessionId}`);
        socket.leave(`session_${sessionId}`);
      } catch (err) {}
    });

    socket.on("leaveSession", (sessionId: string) => {
      if (!sessionId) return;
      socket.leave(`session:${sessionId}`);
      socket.leave(`session_${sessionId}`);
    });

    // Handle new messages sent directly over socket
    socket.on("new_message", async (data: { sessionId?: string; session_id?: string; message?: any }) => {
      try {
        const sessionId = data.sessionId ?? data.session_id;
        const payload = data.message ?? data;
        if (!sessionId || !payload) return;

        const senderType = (socket as any).user ? "user" : (payload.sender_type ?? "user");
        const text = String(payload.message_text ?? payload.text ?? payload.message ?? "");

        const created = await chatMessageService.createForSession(sessionId, senderType as any, text);

        // Build a plain object and enrich with sender info if available
        const out = (created as any).toJSON ? (created as any).toJSON() : created;
        if ((socket as any).user && (socket as any).user.id) {
          try {
            const u = await User.findByPk((socket as any).user.id, { attributes: ["id", "full_name"] });
            if (u) {
              out.sender = { id: u.id, full_name: (u as any).full_name, name: (u as any).full_name };
            }
          } catch (err) {}
        }

        // Broadcast to both room name formats so all clients receive regardless of join style
        nsp.to(`session:${sessionId}`).emit("messageReceived", out);
        nsp.to(`session_${sessionId}`).emit("messageReceived", out);
      } catch (err) {
        // ignore
      }
    });

    socket.on("disconnect", () => {
      // noop
    });
  });
}
