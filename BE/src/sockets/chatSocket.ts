import { Server, Socket } from "socket.io";
import { ChatService } from "../modules/chat/chat.service";

export function initializeChatSocket(io: Server) {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket: Socket) => {
    console.log("Client connected to chat namespace");

    // Join a chat session room
    socket.on("join_session", (sessionId: string) => {
      socket.join(`chat_session_${sessionId}`);
      console.log(`Client joined chat session ${sessionId}`);
    });

    // Leave a chat session room
    socket.on("leave_session", (sessionId: string) => {
      socket.leave(`chat_session_${sessionId}`);
      console.log(`Client left chat session ${sessionId}`);
    });

    // Handle new message
    socket.on(
      "new_message",
      async (data: { sessionId: string; message: any }) => {
        try {
          const { sessionId, message } = data;
          const newMessage = await ChatService.addMessage(sessionId, message);

          if (newMessage) {
            // Broadcast the message to all clients in the session
            chatNamespace
              .to(`chat_session_${sessionId}`)
              .emit("message_received", newMessage);
          }
        } catch (error) {
          console.error("Error handling new message:", error);
          socket.emit("error", { message: "Failed to process message" });
        }
      }
    );

    // Handle typing status
    socket.on(
      "typing_status",
      (data: { sessionId: string; isTyping: boolean; user?: any }) => {
        socket.to(`chat_session_${data.sessionId}`).emit("user_typing", {
          isTyping: data.isTyping,
          user: data.user,
        });
      }
    );

    // Handle session status updates
    socket.on(
      "session_update",
      async (data: { sessionId: string; status: string }) => {
        try {
          const { sessionId, status } = data;
          if (status === "closed") {
            await ChatService.closeSession(sessionId);
          } else {
            await ChatService.updateSession(sessionId, { status });
          }

          // Broadcast session status update
          chatNamespace
            .to(`chat_session_${sessionId}`)
            .emit("session_status_changed", {
              sessionId,
              status,
            });
        } catch (error) {
          console.error("Error updating session status:", error);
          socket.emit("error", { message: "Failed to update session status" });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected from chat namespace");
    });
  });

  return chatNamespace;
}
