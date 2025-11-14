import type { Request, Response, NextFunction } from "express";
import orderService from "../services/orderService";
import { orderEvents } from "../sockets/orderSocket";
import { tableEvents } from "../sockets/tableSocket";
import { getIO } from "../sockets";

/**
 * Guest Order Controller
 * Handles all order operations for walk-in customers (guests)
 * Identified by table_id instead of user_id
 */

// Get current order for table
export const getCurrentOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id } = req.query;

    if (!table_id) {
      return res.status(400).json({
        status: "error",
        message: "table_id is required",
      });
    }

    // Get order with status other than "available", "paid", or "pending"
    // This includes "dining", "waiting_payment", "preparing", etc.
    const order = await orderService.getOrderByTable(table_id as string);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

// Add item to order (creates order if not exists)
export const addItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id, dish_id, quantity } = req.body;

    // Find or create order for this table
    let order = await orderService.getOrderByTable(table_id);

    if (!order) {
      // Create new order for this table
      const newOrder = await orderService.createOrder({
        table_id,
        items: [{ dish_id, quantity, price: 0 }], // Price will be set from dish
        status: "dining",
      });
      order = newOrder;
    } else {
      // Add item to existing order
      order = await orderService.addItemToOrder(order.id, {
        dish_id,
        quantity,
      });
    }

    const io = getIO();
    if (io && order) {
      // Get full order with items for proper serialization
      const fullOrder = await orderService.getOrderById(order.id);

      if (fullOrder) {
        // Emit to table room for walk-in customers
        tableEvents.tableOrderUpdated(io, table_id, fullOrder);
        // Emit to admin namespace
        orderEvents.orderUpdated(io, fullOrder);
        // Emit item created event to both table and admin
        const items = (fullOrder as any).items || [];
        const lastItem = items[items.length - 1];
        if (lastItem) {
          orderEvents.orderItemCreated(io, fullOrder.id, lastItem, fullOrder);
          // Also emit directly to table room with serialized data
          const itemData =
            lastItem && typeof lastItem.toJSON === "function"
              ? lastItem.toJSON()
              : lastItem;
          io.to(`table:${table_id}`).emit("table:order_item_created", {
            orderId: fullOrder.id,
            itemId: itemData.id,
            item: {
              id: itemData.id,
              order_id: itemData.order_id,
              dish_id: itemData.dish_id,
              quantity: Number(itemData.quantity) || 0,
              price: Number(itemData.price) || 0,
              status: itemData.status,
              dish: itemData.dish
                ? {
                    id: itemData.dish.id,
                    name: itemData.dish.name,
                    price: Number(itemData.dish.price) || 0,
                    media_urls: itemData.dish.media_urls || [],
                  }
                : null,
            },
            order: {
              id: fullOrder.id,
              total_amount: Number(fullOrder.total_amount) || 0,
              final_amount:
                Number(fullOrder.final_amount || fullOrder.total_amount) || 0,
              status: fullOrder.status,
              table_id: fullOrder.table_id,
            },
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

// Update item quantity
export const updateItemQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id, item_id, quantity } = req.body;

    const order = await orderService.getOrderByTable(table_id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    // Find item to get order_id
    const OrderItem = (await import("../models/OrderItem")).default;
    const item = await OrderItem.findByPk(item_id);

    if (!item) {
      return res.status(404).json({
        status: "error",
        message: "Order item not found",
      });
    }

    const updatedItem = await orderService.updateItemQuantity(
      item_id,
      quantity
    );

    // Get updated order with items
    const fullOrder = await orderService.getOrderById(order.id);

    const io = getIO();
    if (io && fullOrder) {
      const items = (fullOrder as any).items || [];
      const itemWithDish = items.find((item: any) => item.id === item_id);
      if (itemWithDish) {
        orderEvents.orderItemQuantityChanged(
          io,
          order.id,
          itemWithDish,
          fullOrder
        );
      }
      tableEvents.tableOrderUpdated(io, table_id, fullOrder);
      orderEvents.orderUpdated(io, fullOrder);
    }

    res.json({ status: "success", data: fullOrder });
  } catch (error) {
    next(error);
  }
};

// Update item status
export const updateItemStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id, item_id, status } = req.body;

    const order = await orderService.getOrderByTable(table_id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    // Find item to verify it belongs to this order
    const OrderItem = (await import("../models/OrderItem")).default;
    const item = await OrderItem.findByPk(item_id);

    if (!item || item.order_id !== order.id) {
      return res.status(404).json({
        status: "error",
        message: "Order item not found or does not belong to this order",
      });
    }

    await orderService.updateItemStatus(item_id, status);

    // Get updated order with items
    const fullOrder = await orderService.getOrderById(order.id);

    const io = getIO();
    if (io && fullOrder) {
      const items = (fullOrder as any).items || [];
      const updatedItem = items.find((item: any) => item.id === item_id);
      if (updatedItem) {
        orderEvents.orderItemStatusChanged(
          io,
          order.id,
          updatedItem,
          fullOrder
        );
      }
      tableEvents.tableOrderUpdated(io, table_id, fullOrder);
      orderEvents.orderUpdated(io, fullOrder);
    }

    res.json({ status: "success", data: fullOrder });
  } catch (error) {
    next(error);
  }
};

// Remove item
export const removeItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id, item_id } = req.query;

    const order = await orderService.getOrderByTable(
      table_id as string,
      "dining"
    );

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    await orderService.deleteItem(item_id as string);

    // Get updated order with items
    const fullOrder = await orderService.getOrderById(order.id);

    const io = getIO();
    if (io) {
      orderEvents.orderItemDeleted(io, order.id, item_id as string, fullOrder);
      tableEvents.tableOrderUpdated(io, table_id as string, fullOrder);
      orderEvents.orderUpdated(io, fullOrder);
    }

    res.json({ status: "success", data: fullOrder });
  } catch (error) {
    next(error);
  }
};

// Apply voucher
export const applyVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id, voucher_code } = req.body;

    const order = await orderService.getOrderByTable(table_id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    const updatedOrder = await orderService.applyVoucher(
      order.id,
      voucher_code
    );

    const io = getIO();
    if (io) {
      orderEvents.voucherApplied(io, updatedOrder);
      tableEvents.tableOrderUpdated(io, table_id, updatedOrder);
      orderEvents.orderUpdated(io, updatedOrder);
    }

    res.json({ status: "success", data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Remove voucher
export const removeVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id } = req.query;

    const order = await orderService.getOrderByTable(
      table_id as string,
      "dining"
    );

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    const updatedOrder = await orderService.removeVoucher(order.id);

    const io = getIO();
    if (io) {
      orderEvents.voucherRemoved(io, updatedOrder);
      tableEvents.tableOrderUpdated(io, table_id as string, updatedOrder);
      orderEvents.orderUpdated(io, updatedOrder);
    }

    res.json({ status: "success", data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Request support
export const requestSupport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id } = req.body;

    const order = await orderService.getOrderByTable(table_id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    await orderService.requestSupport(order.id);

    const io = getIO();
    if (io) {
      orderEvents.supportRequested(io, order);
      // Also notify table room
      io.to(`table:${table_id}`).emit("table:support_requested", {
        orderId: order.id,
        tableId: table_id,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: "success",
      data: { message: "Support request sent successfully" },
    });
  } catch (error) {
    next(error);
  }
};

// Request payment
export const requestPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id, method = "vnpay", points_used = 0 } = req.body;

    const order = await orderService.getOrderByTable(table_id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    // Get full order for proper serialization
    const fullOrder = await orderService.getOrderById(order.id);

    if (method === "vnpay") {
      // Get client IP from request
      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        "127.0.0.1";

      const result = await orderService.requestPayment(order.id, {
        client: "user",
        pointsUsed: points_used,
        clientIp: clientIp,
      });

      const io = getIO();
      if (io) {
        const updatedOrder = await orderService.getOrderById(order.id);
        orderEvents.paymentRequested(io, updatedOrder);
        tableEvents.tableOrderUpdated(io, table_id, updatedOrder);
        orderEvents.orderUpdated(io, updatedOrder);
      }

      res.json({ status: "success", data: result });
    } else {
      // Cash payment
      const result = await orderService.requestCashPayment(
        order.id,
        req.body.note,
        points_used
      );

      const io = getIO();
      if (io) {
        const updatedOrder = await orderService.getOrderById(order.id);
        orderEvents.paymentRequested(io, updatedOrder);
        tableEvents.tableOrderUpdated(io, table_id, updatedOrder);
        orderEvents.orderUpdated(io, updatedOrder);
      }

      res.json({ status: "success", data: result });
    }
  } catch (error) {
    next(error);
  }
};

// Request payment retry
export const requestPaymentRetry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id, method } = req.body;

    const order = await orderService.getOrderByTable(table_id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    // Check for failed payment and retry
    const paymentService = await import("../services/paymentService");
    const failedPayment = await paymentService.default.search({
      order_id: order.id,
      status: "failed",
    });

    if (failedPayment.rows.length > 0) {
      // Use payment controller's retry logic
      const paymentController = await import("./paymentController");
      // Create a mock request object for retryPayment
      const mockReq = {
        params: { id: failedPayment.rows[0].id },
        body: { method },
      } as any;
      const mockRes = {
        json: (data: any) => data,
        status: (code: number) => ({
          json: (data: any) => ({ statusCode: code, data }),
        }),
      } as any;
      const mockNext = (err: any) => {
        if (err) throw err;
      };

      const result = await paymentController.retryPayment(
        mockReq,
        mockRes,
        mockNext
      );

      const io = getIO();
      if (io) {
        const updatedOrder = await orderService.getOrderById(order.id);
        orderEvents.paymentRequested(io, updatedOrder);
        tableEvents.tableOrderUpdated(io, table_id, updatedOrder);
        orderEvents.orderUpdated(io, updatedOrder);
      }

      return res.json({ status: "success", data: result });
    } else {
      // No failed payment, create new payment request
      if (method === "vnpay") {
        // Get client IP from request
        const clientIp =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.ip ||
          req.socket.remoteAddress ||
          "127.0.0.1";

        const result = await orderService.requestPayment(order.id, {
          client: "user",
          pointsUsed: req.body.points_used || 0,
          clientIp: clientIp,
        });
        const io = getIO();
        if (io) {
          const updatedOrder = await orderService.getOrderById(order.id);
          orderEvents.paymentRequested(io, updatedOrder);
          tableEvents.tableOrderUpdated(io, table_id, updatedOrder);
          orderEvents.orderUpdated(io, updatedOrder);
        }
        return res.json({ status: "success", data: result });
      } else {
        const result = await orderService.requestCashPayment(
          order.id,
          req.body.note,
          req.body.points_used || 0
        );
        const io = getIO();
        if (io) {
          const updatedOrder = await orderService.getOrderById(order.id);
          orderEvents.paymentRequested(io, updatedOrder);
          tableEvents.tableOrderUpdated(io, table_id, updatedOrder);
          orderEvents.orderUpdated(io, updatedOrder);
        }
        return res.json({ status: "success", data: result });
      }
    }
  } catch (error) {
    next(error);
  }
};

// Request cash payment
export const requestCashPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { table_id, note, points_used = 0 } = req.body;

    const order = await orderService.getOrderByTable(table_id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    const result = await orderService.requestCashPayment(
      order.id,
      note,
      points_used || 0
    );

    const io = getIO();
    if (io) {
      orderEvents.paymentRequested(io, order);
      tableEvents.tableOrderUpdated(io, table_id, order);
      orderEvents.orderUpdated(io, order);
    }

    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};
