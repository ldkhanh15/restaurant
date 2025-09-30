import { OrderItemLog, OrderItem, Order } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import {
  OrderItemLogDTO,
  OrderItemStatusChangeDTO,
  OrderStatusUpdateDTO,
  OrderTrackingEventDTO,
} from "../../types/dtos/orderTracking.dto";
import { getIO } from "../../sockets/io";
import { NotificationService } from "../notifications/notification.service";

export const OrderItemLogService = {
  async list(orderItemId: string) {
    return OrderItemLog.findAll({
      where: { order_item_id: orderItemId },
      include: ["order_item"],
      order: [["created_at", "DESC"]],
    });
  },

  async create(payload: OrderItemLogDTO) {
    const id = payload.id || uuidv4();
    const log = await OrderItemLog.create({
      id,
      ...payload,
      created_at: new Date(),
    });

    getIO().emit("order-item-log-created", log);
    return log;
  },

  async logStatusChange(payload: OrderItemStatusChangeDTO) {
    const orderItem = await OrderItem.findByPk(payload.order_item_id, {
      include: ["order"],
    });

    if (!orderItem) throw new Error("Order item not found");

    const log = await this.create({
      order_item_id: payload.order_item_id,
      action: "status_change",
      old_value: payload.old_status,
      new_value: payload.new_status,
      changed_by: payload.changed_by,
      reason: payload.reason,
      metadata: {
        estimated_time: payload.estimated_time,
      },
    });

    // Update order item status
    await orderItem.update({
      status: payload.new_status,
      updated_at: new Date(),
    });

    // Emit socket event
    getIO().emit("order-item-status-changed", {
      order_id: orderItem.order_id,
      item_id: orderItem.id,
      old_status: payload.old_status,
      new_status: payload.new_status,
    });

    // Create tracking event
    await this.createTrackingEvent({
      order_id: orderItem.order_id,
      event_type: "item_status_changed",
      event_data: {
        item_id: orderItem.id,
        old_status: payload.old_status,
        new_status: payload.new_status,
        estimated_time: payload.estimated_time,
      },
      timestamp: new Date(),
      actor_id: payload.changed_by,
      actor_type: "employee",
    });

    // Notify customer if necessary
    if (orderItem.order?.user_id) {
      await NotificationService.create({
        user_id: orderItem.order.user_id,
        title: "Order Item Status Update",
        message: `Your order item status has been updated to ${payload.new_status}`,
        type: "order_status",
        data: {
          order_id: orderItem.order_id,
          item_id: orderItem.id,
          status: payload.new_status,
        },
      });
    }

    return log;
  },

  async updateOrderStatus(payload: OrderStatusUpdateDTO) {
    const order = await Order.findByPk(payload.order_id, {
      include: ["order_items"],
    });

    if (!order) throw new Error("Order not found");

    // Update order status
    await order.update({
      status: payload.new_status,
      updated_at: new Date(),
    });

    // Create tracking event
    await this.createTrackingEvent({
      order_id: payload.order_id,
      event_type: "order_status_changed",
      event_data: {
        old_status: order.status,
        new_status: payload.new_status,
        notes: payload.notes,
      },
      timestamp: new Date(),
      actor_id: payload.updated_by,
      actor_type: "employee",
    });

    // Emit socket event
    getIO().emit("order-status-changed", {
      order_id: order.id,
      old_status: order.status,
      new_status: payload.new_status,
    });

    // Notify customer if requested
    if (payload.notify_customer && order.user_id) {
      await NotificationService.create({
        user_id: order.user_id,
        title: "Order Status Update",
        message: `Your order status has been updated to ${payload.new_status}`,
        type: "order_status",
        data: {
          order_id: order.id,
          status: payload.new_status,
        },
      });
    }

    return order;
  },

  async createTrackingEvent(event: OrderTrackingEventDTO) {
    const id = uuidv4();
    await OrderTrackingEvent.create({
      id,
      ...event,
    });

    getIO().emit("order-tracking-event", event);
    return event;
  },

  async getOrderTimeline(orderId: string) {
    const events = await OrderTrackingEvent.findAll({
      where: { order_id: orderId },
      order: [["timestamp", "ASC"]],
    });

    const logs = await OrderItemLog.findAll({
      include: [
        {
          model: OrderItem,
          where: { order_id: orderId },
          required: true,
        },
      ],
      order: [["created_at", "ASC"]],
    });

    // Merge and sort events and logs chronologically
    const timeline = [
      ...events.map((e) => ({
        ...e.toJSON(),
        type: "event",
        timestamp: e.timestamp,
      })),
      ...logs.map((l) => ({
        ...l.toJSON(),
        type: "log",
        timestamp: l.created_at,
      })),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return timeline;
  },
};
