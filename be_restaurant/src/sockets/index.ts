import type { Server as HTTPServer } from "http"
import { Server } from "socket.io"
import { verifyToken } from "../utils/jwt"
import registerOrderSocket from "./orderSocket"
import registerChatSocket from "./chatSocket"

let ioInstance: Server | null = null

export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN || "*" },
  })

  // Global auth middleware (optional JWT)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (token && typeof token === "string") {
        const decoded = verifyToken(token.replace(/^Bearer\s+/i, ""))
        ;(socket as any).user = decoded
      }
    } catch {
      // allow guests
    }
    next()
  })

  registerOrderSocket(io)
  registerChatSocket(io)

  ioInstance = io
  return io
}

export const getIO = () => {
  if (!ioInstance) throw new Error("Socket.IO not initialized")
  return ioInstance
}


