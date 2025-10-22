import type { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt";
import registerNotificationSocket from "./notificationSocket";
import registerOrderSocket from "./orderSocket";
import registerReservationSocket from "./reservationSocket";
import registerChatSocket from "./chatSocket";
import { AppError } from "../middlewares/errorHandler";

let ioInstance: Server | null = null;

export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  // Global auth middleware (optional JWT)
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token && typeof token === "string") {
        const decoded = verifyToken(token.replace(/^Bearer\s+/i, ""));
        (socket as any).user = decoded;
      }
    } catch {
      // allow guests
    }
    next();
  });

  registerChatSocket(io);
  registerNotificationSocket(io);
  registerOrderSocket(io);
  registerReservationSocket(io);

  ioInstance = io;
  return io;
};

export const getIO = () => {
  if (!ioInstance) throw new AppError("Socket.IO not initialized",400);
  return ioInstance;
};
