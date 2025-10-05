import type { Server } from "socket.io"

export default function registerChatSocket(io: Server) {
  const nsp = io.of("/chat")

  nsp.on("connection", (socket) => {
    socket.on("joinSession", (sessionId: string) => {
      socket.join(`session:${sessionId}`)
    })

    socket.on("newMessage", (payload: any) => {
      nsp.to(`session:${payload.session_id}`).emit("messageReceived", payload)
    })

    socket.on("typing", (payload: any) => {
      nsp.to(`session:${payload.session_id}`).emit("typing", { session_id: payload.session_id, from: payload.from })
    })

    socket.on("sessionClosed", (payload: any) => {
      nsp.to(`session:${payload.session_id}`).emit("sessionClosed", payload)
    })
  })
}


