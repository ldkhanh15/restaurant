import type { Server } from "socket.io";

export default function registerChatSocket(io: Server) {
  const nsp = io.of("/chat");

  nsp.on("connection", (socket) => {
    // Auto expose user on socket from global middleware
    // Join a chat session room
    socket.on("joinSession", (sessionId: string) => {
      if (!sessionId) return;
      socket.join(`session_${sessionId}`);
    });

    socket.on("leaveSession", (sessionId: string) => {
      if (!sessionId) return;
      socket.leave(`session_${sessionId}`);
    });
  });
}
