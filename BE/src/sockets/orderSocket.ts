import { Server, Socket } from "socket.io";
import { OrderService } from "../modules/orders/order.service";

export function initializeOrderSocket(io: Server) {
  const orderNamespace = io.of("/orders");

  orderNamespace.on("connection", (socket: Socket) => {
    console.log("Client connected to order namespace");

    // Join room for specific table orders
    socket.on("join_table", (tableId: string) => {
      socket.join(`table_${tableId}`);
      console.log(`Client joined table ${tableId} room`);
    });

    // Join room for all kitchen orders
    socket.on("join_kitchen", () => {
      socket.join("kitchen");
      console.log("Client joined kitchen room");
    });

    // Handle new order
    socket.on("new_order", async (data: any) => {
      try {
        const order = await OrderService.create(data);
        if (order) {
          // Notify kitchen about new order
          orderNamespace.to("kitchen").emit("order_created", order);
          // Notify specific table about their order
          if (order.table_id) {
            orderNamespace
              .to(`table_${order.table_id}`)
              .emit("order_created", order);
          }
        }
      } catch (error) {
        console.error("Error creating order:", error);
        socket.emit("error", { message: "Failed to create order" });
      }
    });

    // Handle order status updates
    socket.on(
      "update_order_status",
      async (data: { orderId: string; status: string }) => {
        try {
          const order = await OrderService.update(data.orderId, {
            status: data.status,
          });
          if (order) {
            // Broadcast status update to kitchen
            orderNamespace.to("kitchen").emit("order_updated", order);
            // Notify specific table about their order update
            if (order.table_id) {
              orderNamespace
                .to(`table_${order.table_id}`)
                .emit("order_updated", order);
            }
          }
        } catch (error) {
          console.error("Error updating order:", error);
          socket.emit("error", { message: "Failed to update order" });
        }
      }
    );

    // Handle order item status updates
    socket.on(
      "update_item_status",
      async (data: { orderId: string; itemId: string; status: string }) => {
        try {
          const order = await OrderService.updateOrderItem(
            data.orderId,
            data.itemId,
            {
              status: data.status,
            }
          );

          if (order) {
            // Broadcast item status update to kitchen
            orderNamespace.to("kitchen").emit("order_item_updated", {
              orderId: data.orderId,
              itemId: data.itemId,
              status: data.status,
            });

            // Notify specific table about their order item update
            if (order.table_id) {
              orderNamespace
                .to(`table_${order.table_id}`)
                .emit("order_item_updated", {
                  orderId: data.orderId,
                  itemId: data.itemId,
                  status: data.status,
                });
            }
          }
        } catch (error) {
          console.error("Error updating order item:", error);
          socket.emit("error", { message: "Failed to update order item" });
        }
      }
    );

    // Leave table room
    socket.on("leave_table", (tableId: string) => {
      socket.leave(`table_${tableId}`);
      console.log(`Client left table ${tableId} room`);
    });

    // Leave kitchen room
    socket.on("leave_kitchen", () => {
      socket.leave("kitchen");
      console.log("Client left kitchen room");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from order namespace");
    });
  });

  return orderNamespace;
}
