import { Op, Sequelize } from "sequelize";
import orderRepository from "../repositories/orderRepository";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Dish from "../models/Dish";
import Voucher from "../models/Voucher";
import VoucherUsage from "../models/VoucherUsage";
import Table from "../models/Table";
import TableGroup from "../models/TableGroup";
import User from "../models/User";
import Reservation from "../models/Reservation";
import Event from "../models/Event";
import Payment from "../models/Payment";
import notificationService from "./notificationService";
import paymentService from "./paymentService";
import { getIO } from "../sockets";
import { orderEvents } from "../sockets/orderSocket";
import loyaltyService from "./loyalty_app_userService";
import {
  validateOrderOverlap,
  validateTableGroupOrderOverlap,
} from "../utils/validation";
import { AppError } from "../middlewares/errorHandler";

export interface CreateOrderData {
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_id?: string;
  items: Array<{
    dish_id: string;
    quantity: number;
    price: number;
    customizations?: any;
  }>;
  voucher_code?: string;
  status?: string;
}

export interface UpdateOrderData {
  table_id?: string;
  table_group_id?: string;
  status?: string;
  payment_method?: string;
}

export interface AddItemData {
  dish_id: string;
  quantity: number;
}

export interface ApplyVoucherData {
  code: string;
}

class OrderService {
  async getAllOrders(filters: any) {
    return await orderRepository.findAll(filters);
  }

  async getOrderById(id: string) {
    if (!id) {
      throw new AppError("Order ID is required", 400);
    }

    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Get detailed information with all related data
    const detailedOrder = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "phone"],
        },
        {
          model: Table,
          as: "table",
          attributes: ["id", "table_number", "capacity", "status"],
        },
        {
          model: Reservation,
          as: "reservation",
          attributes: ["id", "reservation_time", "num_people", "status"],
        },
        {
          model: Event,
          as: "event",
          attributes: ["id", "name", "description"],
        },
        {
          model: Voucher,
          as: "voucher",
          attributes: ["id", "code", "discount_type", "value"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Dish,
              as: "dish",
              attributes: ["id", "name", "price", "media_urls", "description"],
            },
          ],
        },
        {
          model: Payment,
          as: "payments",
          where: { order_id: id },
          required: false,
        },
      ],
    });

    return detailedOrder;
  }

  async getOrderByTable(tableId: string, status?: string) {
    if (!tableId) {
      throw new AppError("Table ID is required", 400);
    }

    return await orderRepository.findByTableId(tableId, status);
  }

  async getOrderByTableGroup(tableGroupId: string, status?: string) {
    if (!tableGroupId) {
      throw new AppError("Table Group ID is required", 400);
    }

    return await orderRepository.findByTableGroupId(tableGroupId, status);
  }

  async createOrder(data: CreateOrderData) {
    // Validate required fields - items are now optional
    if (!data.table_id) {
      throw new AppError("table_id is required", 400);
    }

    // Validate table/table group
    if (data.table_id) {
      const table = await Table.findByPk(data.table_id);
      if (!table) {
        throw new AppError("Table not found", 404);
      }

      // Validate order overlap for table
      await validateOrderOverlap(data.table_id, new Date());
    }

    if (data.table_group_id) {
      const tableGroup = await TableGroup.findByPk(data.table_group_id);
      if (!tableGroup) {
        throw new AppError("Table group not found", 404);
      }

      // Validate order overlap for table group
      await validateTableGroupOrderOverlap(data.table_group_id, new Date());
    }

    // Create order
    const order = await orderRepository.create({
      ...data,
      total_amount: 0,
      final_amount: 0,
      voucher_id: null,
      voucher_discount_amount: 0,
      status: data.status || "dining",
      payment_status: "pending",
    });

    // Update table/table group status
    if (data.table_id) {
      await Table.update(
        { status: "occupied" },
        { where: { id: data.table_id } }
      );
    }

    // Send notification and WebSocket event
    await notificationService.notifyOrderCreated(order);
    try {
      orderEvents.orderCreated(getIO(), order);
    } catch (error) {
      console.error("Failed to emit order created event:", error);
    }

    return order;
  }

  async updateOrder(id: string, data: UpdateOrderData) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Validate table/table group changes
    if (data.table_id) {
      const table = await Table.findByPk(data.table_id);
      if (!table) {
        throw new AppError("Table not found", 404);
      }

      // Validate order overlap for new table (if changing table)
      if (data.table_id !== order.table_id) {
        await validateOrderOverlap(data.table_id, new Date(), order.id);
      }

      await Table.update(
        { status: "occupied" },
        { where: { id: data.table_id } }
      );
    }

    if (data.table_group_id) {
      const tableGroup = await TableGroup.findByPk(data.table_group_id);
      if (!tableGroup) {
        throw new AppError("Table group not found", 404);
      }

      // Validate order overlap for new table group (if changing table group)
      if (data.table_group_id !== order.table_group_id) {
        await validateTableGroupOrderOverlap(
          data.table_group_id,
          new Date(),
          order.id
        );
      }
    }

    const pre_table_id = order.table_id;
    if (pre_table_id) {
      await Table.update(
        { status: "available" },
        { where: { id: pre_table_id } }
      );
    }

    const updatedOrder = await orderRepository.update(id, data);

    // Send notification and WebSocket event
    await notificationService.notifyOrderUpdated(updatedOrder);
    try {
      orderEvents.orderUpdated(getIO(), updatedOrder);
    } catch (error) {
      console.error("Failed to emit order updated event:", error);
    }

    return updatedOrder;
  }

  async updateOrderStatus(
    id: string,
    status: "pending" | "paid" | "dining" | "waiting_payment" | "cancelled"
  ) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const oldStatus = order.status;
    const updatedOrder = await orderRepository.updateStatus(id, status);

    // Update table/table group status based on order status
    if (status === "paid" || status === "cancelled") {
      if (order.table_id) {
        await Table.update(
          { status: "available" },
          { where: { id: order.table_id } }
        );
      }
    }

    // Send notification and WebSocket event
    await notificationService.notifyOrderStatusChanged(updatedOrder, oldStatus);
    try {
      orderEvents.orderStatusChanged(getIO(), updatedOrder);
    } catch (error) {
      console.error("Failed to emit order status changed event:", error);
    }

    return updatedOrder;
  }

  async addItemToOrder(orderId: string, data: AddItemData) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (!["pending", "preparing", "dining"].includes(order.status)) {
      throw new AppError("Order is not modifiable", 400);
    }

    const dish = await Dish.findByPk(data.dish_id);
    if (!dish || !dish.active) {
      throw new AppError("Dish not found or inactive", 404);
    }

    if (data.quantity < 1) {
      throw new AppError("Quantity must be at least 1", 400);
    }

    const item = await orderRepository.addItem(
      orderId,
      data.dish_id,
      data.quantity,
      dish.price
    );

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    const updatedOrder = await orderRepository.findById(orderId);
    await notificationService.notifyOrderUpdated(updatedOrder!);
    try {
      orderEvents.orderUpdated(getIO(), updatedOrder!);
    } catch (error) {
      console.error("Failed to emit order updated event:", error);
    }

    return updatedOrder;
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity < 0) {
      throw new AppError("Quantity cannot be negative", 400);
    }

    const item = await orderRepository.updateItemQuantity(itemId, quantity);

    // Recalculate order totals
    const order = await Order.findByPk(item.order_id);
    if (order) {
      await this.recalculateOrderTotals(order.id);
      const updatedOrder = await orderRepository.findById(order.id);
      await notificationService.notifyOrderUpdated(updatedOrder!);
    }

    return item;
  }

  async updateItemStatus(
    itemId: string,
    status: "pending" | "completed" | "preparing" | "ready"
  ) {
    if (!["pending", "preparing", "ready", "completed"].includes(status)) {
      throw new AppError("Invalid item status", 400);
    }
    const itemOrder = await OrderItem.findByPk(itemId);
    if (!itemOrder) {
      throw new AppError("Order item not found", 404);
    }
    await this.recalculateOrderTotals(itemOrder.order_id as string);
    const item = await orderRepository.updateItemStatus(itemId, status);

    return item;
  }

  async deleteItem(itemId: string) {
    const item = await OrderItem.findByPk(itemId);
    if (!item) {
      throw new AppError("Order item not found", 404);
    }
    if (item.status !== "pending") {
      throw new AppError("Item is not pending", 400);
    }
    await orderRepository.deleteItem(itemId);

    // Recalculate order totals
    await this.recalculateOrderTotals(item.order_id as string);

    const updatedOrder = await orderRepository.findById(
      item.order_id as string
    );
    await notificationService.notifyOrderUpdated(updatedOrder!);
    try {
      orderEvents.orderUpdated(getIO(), updatedOrder!);
    } catch (error) {
      console.error("Failed to emit order updated event:", error);
    }

    return updatedOrder;
  }

  async applyVoucher(orderId: string, data: ApplyVoucherData) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.voucher_id) {
      throw new AppError("Order already has a voucher applied", 400);
    }

    const voucher = await Voucher.findOne({
      where: { code: data.code, active: true },
    });

    if (!voucher) {
      throw new AppError("Invalid voucher code", 400);
    }

    // Check voucher validity
    const now = new Date();
    if (voucher.expiry_date && new Date(voucher.expiry_date) < now) {
      throw new AppError("Voucher expired", 400);
    }
    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
      throw new AppError("Voucher usage limit reached", 400);
    }
    if (
      voucher.min_order_value &&
      order.total_amount < voucher.min_order_value
    ) {
      throw new AppError("Order does not meet voucher minimum value", 400);
    }
    console.log('voucher', voucher);
    // Calculate discount
    let discountAmount = 0;
    if (voucher.discount_type === "percentage") {
      console.log("voucher.value", voucher.value);
      console.log("order.total_amount", order.total_amount);
      console.log('type',voucher.discount_type)
      discountAmount = Math.min(
        (Number(order.total_amount) * Number(voucher.value)) / 100,
        Number(order.total_amount)
      );
    } else {
      console.log("voucher.value", voucher.value);
      console.log("order.total_amount", order.total_amount);
      discountAmount = Math.min(Number(voucher.value), Number(order.total_amount));
    }
    console.log("discountAmount", discountAmount);
    const updatedOrder = await orderRepository.applyVoucher(
      orderId,
      voucher.id,
      discountAmount
    );

    // Update voucher usage
    await VoucherUsage.create({
      voucher_id: voucher.id,
      order_id: orderId,
      user_id: order.user_id,
    });

    await voucher.update({ current_uses: voucher.current_uses + 1 });
    await this.recalculateOrderTotals(orderId);
    await notificationService.notifyOrderUpdated(updatedOrder);
    try {
      orderEvents.voucherApplied(getIO(), updatedOrder);
    } catch (error) {
      console.error("Failed to emit voucher applied event:", error);
    }

    return updatedOrder;
  }

  async removeVoucher(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (!order.voucher_id) {
      throw new AppError("No voucher applied to this order", 400);
    }

    const updatedOrder = await orderRepository.removeVoucher(orderId);
    await this.recalculateOrderTotals(orderId);
    await notificationService.notifyOrderUpdated(updatedOrder);
    try {
      orderEvents.voucherRemoved(getIO(), updatedOrder);
    } catch (error) {
      console.error("Failed to emit voucher removed event:", error);
    }

    return updatedOrder;
  }

  async mergeOrders(sourceOrderId: string, targetOrderId: string) {
    if (sourceOrderId === targetOrderId) {
      throw new AppError("Cannot merge order with itself", 400);
    }

    const sourceOrder = await orderRepository.findById(sourceOrderId);
    const targetOrder = await orderRepository.findById(targetOrderId);

    if (!sourceOrder || !targetOrder) {
      throw new AppError("One or both orders not found", 404);
    }

    if (sourceOrder.status === "paid" || targetOrder.status === "paid") {
      throw new AppError("Cannot merge paid orders", 400);
    }

    const updatedOrder = await orderRepository.mergeOrders(
      sourceOrderId,
      targetOrderId
    );

    await notificationService.notifyOrderUpdated(updatedOrder);
    try {
      orderEvents.orderMerged(getIO(), updatedOrder);
    } catch (error) {
      console.error("Failed to emit order merged event:", error);
    }

    return updatedOrder;
  }

  async requestSupport(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    await notificationService.notifySupportRequest(order);
    try {
      orderEvents.supportRequested(getIO(), order);
    } catch (error) {
      console.error("Failed to emit support requested event:", error);
    }

    return { message: "Support requested successfully" };
  }

  async requestPayment(orderId: string, bankCode?: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.payment_status === "paid") {
      throw new AppError("Order already paid", 400);
    }

    // Update order status to waiting_payment
    await orderRepository.update(orderId, { status: "waiting_payment" });

    const clientIp = "127.0.0.1"; // You should get this from request
    const paymentUrl = paymentService.generateVnpayOrderUrl(
      order,
      bankCode,
      clientIp
    );
    await paymentService.createPendingPayment({
      order_id: orderId,
      amount: order.final_amount,
      method: "vnpay",
      transaction_id: paymentUrl.txnRef,
    });
    try {
      orderEvents.paymentRequested(getIO(), order);
    } catch (error) {
      console.error("Failed to emit payment requested event:", error);
    }

    return { redirect_url: paymentUrl.url };
  }

  async handlePaymentSuccess(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Update order status
    const updatedOrder = await orderRepository.update(orderId, {
      payment_status: "paid",
      status: "paid",
    });

    // Update table/table group status
    if (order.table_id) {
      await Table.update(
        { status: "available" },
        { where: { id: order.table_id } }
      );
    }
    await User.update(
      { points: Sequelize.literal(`points + ${order.total_amount / 1000}`) },
      { where: { id: order.user_id } }
    );
    // Send notification and WebSocket event
    await notificationService.notifyPaymentCompleted(updatedOrder);
    try {
      orderEvents.paymentCompleted(getIO(), updatedOrder);
    } catch (error) {
      console.error("Failed to emit payment completed event:", error);
    }

    // Award loyalty points for this paid order (if associated with a user)
    try {
      const res = await loyaltyService.awardPointsForOrder(order);
      if (res) {
        console.info("[loyalty] awarded", res);
      }
    } catch (err) {
      console.error("[loyalty] error awarding points:", err);
    }

    return updatedOrder;
  }

  async handlePaymentFailure(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Revert order status back to dining
    const updatedOrder = await orderRepository.update(orderId, {
      status: "dining",
    });

    try {
      orderEvents.paymentFailed(getIO(), updatedOrder);
    } catch (error) {
      console.error("Failed to emit payment failed event:", error);
    }

    return updatedOrder;
  }

  async completePayment(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const updatedOrder = await orderRepository.update(orderId, {
      payment_status: "paid",
      status: "paid",
    });

    await notificationService.notifyPaymentCompleted(updatedOrder);

    return updatedOrder;
  }

  async getRevenueStats() {
    return await orderRepository.getRevenueStats();
  }

  // 1. Thống kê theo tháng (12 tháng gần đây)
  async getMonthlyStats() {
    return await orderRepository.getMonthlyStats();
  }

  // 2. Thống kê theo giờ (24h, mỗi 2h)
  async getHourlyStats() {
    return await orderRepository.getHourlyStats();
  }

  // 3. Thống kê khách hàng (7 ngày)
  async getCustomerStats() {
    return await orderRepository.getCustomerStats();
  }

  // 4. Thống kê hôm nay
  async getTodayStats() {
    return await orderRepository.getTodayStats();
  }

  private async recalculateOrderTotals(orderId: string) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const items = await OrderItem.findAll({
      where: { order_id: orderId, status: "completed" },
    });
    const subtotal = Number(
      items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      )
    );
    const eventFee = Number(order.event_fee) || 0;
    const deposit = Number(order.deposit_amount) || 0;
    const discount = Number(order.voucher_discount_amount) || 0;

    const totalAmount = subtotal;
    const finalAmount = Math.max(0, subtotal + eventFee - deposit - discount);
    await order.update({
      total_amount: totalAmount,
      final_amount: finalAmount,
    });
  }
}

export default new OrderService();
