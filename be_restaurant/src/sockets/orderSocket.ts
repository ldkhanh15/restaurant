import type { Server } from "socket.io"

export default function registerOrderSocket(io: Server) {
  const nsp = io.of("/order")

  nsp.on("connection", (socket) => {
    socket.on("joinOrder", (orderId: string) => {
      socket.join(`order:${orderId}`)
    })

    socket.on("joinTable", (tableId: string) => {
      socket.join(`table:${tableId}`)
    })
  })
}

export const orderEvents = {
  orderCreated: (io: Server, payload: any) => io.of("/order").to([`order:${payload.id}`, `table:${payload.table_id}`].filter(Boolean)).emit("orderCreated", payload),
  orderUpdated: (io: Server, payload: any) => io.of("/order").to([`order:${payload.id}`, `table:${payload.table_id}`].filter(Boolean)).emit("orderUpdated", payload),
  orderStatusChanged: (io: Server, payload: any) => io.of("/order").to([`order:${payload.id}`, `table:${payload.table_id}`].filter(Boolean)).emit("orderStatusChanged", payload),
  tableChanged: (io: Server, payload: any) => io.of("/order").to([`order:${payload.id}`, `table:${payload.table_id}`].filter(Boolean)).emit("tableChanged", payload),
  paymentRequested: (io: Server, payload: any) => io.of("/order").to([`order:${payload.id}`, `table:${payload.table_id}`].filter(Boolean)).emit("paymentRequested", payload),
  paymentCompleted: (io: Server, payload: any) => io.of("/order").to([`order:${payload.id}`, `table:${payload.table_id}`].filter(Boolean)).emit("paymentCompleted", payload),
  voucherApplied: (io: Server, payload: any) => io.of("/order").to([`order:${payload.id}`, `table:${payload.table_id}`].filter(Boolean)).emit("voucherApplied", payload),
  voucherRemoved: (io: Server, payload: any) => io.of("/order").to([`order:${payload.id}`, `table:${payload.table_id}`].filter(Boolean)).emit("voucherRemoved", payload),
  orderSplit: (io: Server, payload: any) => io.of("/order").to([`order:${payload.source?.id}`, `order:${payload.target?.id}`].filter(Boolean)).emit("orderSplit", payload),
}


