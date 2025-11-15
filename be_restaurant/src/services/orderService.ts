import { Op, Sequelize } from "sequelize";
import orderRepository from "../repositories/orderRepository";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Dish from "../models/Dish";
import DishIngredient from "../models/DishIngredient";
import Ingredient from "../models/Ingredient";
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
import { tableEvents } from "../sockets/tableSocket";
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

    // Create order items if provided
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      for (const item of data.items) {
        const dish = await Dish.findByPk(item.dish_id);
        if (dish && dish.active) {
          await orderRepository.addItem(
            order.id,
            item.dish_id,
            item.quantity,
            item.price || dish.price
          );
        }
      }
      // Recalculate order totals after adding items
      await this.recalculateOrderTotals(order.id);
    }

    // Update table/table group status
    if (data.table_id) {
      await Table.update(
        { status: "occupied" },
        { where: { id: data.table_id } }
      );
    }

    // Reload order with items
    const orderWithItems = await orderRepository.findById(order.id);

    // Send notification and WebSocket event
    await notificationService.notifyOrderCreated(orderWithItems);
    try {
      orderEvents.orderCreated(getIO(), orderWithItems);

      // Also emit table event if order is for a table
      if (data.table_id) {
        tableEvents.tableOrderCreated(getIO(), data.table_id, orderWithItems);
      }
    } catch (error) {
      console.error("Failed to emit order created event:", error);
    }

    return orderWithItems;
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

    // Get full order with items for WebSocket events
    const fullOrder = await orderRepository.findById(id);

    // Send notification and WebSocket event
    await notificationService.notifyOrderStatusChanged(
      fullOrder || updatedOrder,
      oldStatus
    );
    try {
      const io = getIO();
      if (fullOrder) {
        // Emit orderStatusChanged with full order data
        orderEvents.orderStatusChanged(io, fullOrder);
        // Also emit orderUpdated to ensure table rooms get the update
        orderEvents.orderUpdated(io, fullOrder);
        // Emit to table room if order has table_id
        if (fullOrder.table_id) {
          const { tableEvents } = await import("../sockets/tableSocket");
          tableEvents.tableOrderUpdated(io, fullOrder.table_id, fullOrder);
        }
      } else {
        orderEvents.orderStatusChanged(io, updatedOrder);
      }
    } catch (error) {
      console.error("Failed to emit order status changed event:", error);
    }

    return fullOrder || updatedOrder;
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

    // Luôn tạo item mới mỗi lần order để track status riêng biệt
    const item = await orderRepository.addItem(
      orderId,
      data.dish_id,
      data.quantity,
      dish.price
    );

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    const updatedOrder = await orderRepository.findById(orderId);
    if (updatedOrder) {
      await notificationService.notifyOrderUpdated(updatedOrder);
      try {
        orderEvents.orderUpdated(getIO(), updatedOrder);

        // Emit orderItemCreated event (luôn là item mới)
        const itemWithDish = await OrderItem.findByPk(item.id, {
          include: [
            {
              model: Dish,
              as: "dish",
              attributes: ["id", "name", "price", "media_urls", "description"],
            },
          ],
        });

        if (itemWithDish && updatedOrder) {
          // Luôn emit orderItemCreated vì mỗi lần order tạo item mới
          orderEvents.orderItemCreated(
            getIO(),
            orderId,
            itemWithDish.toJSON(),
            updatedOrder
          );
        }
      } catch (error) {
        console.error("Failed to emit order updated event:", error);
      }
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
      if (updatedOrder) {
        await notificationService.notifyOrderUpdated(updatedOrder);

        // Emit orderItemQuantityChanged event
        try {
          const itemWithDish = await OrderItem.findByPk(itemId, {
            include: [
              {
                model: Dish,
                as: "dish",
                attributes: [
                  "id",
                  "name",
                  "price",
                  "media_urls",
                  "description",
                ],
              },
            ],
          });
          if (itemWithDish && updatedOrder) {
            orderEvents.orderItemQuantityChanged(
              getIO(),
              order.id,
              itemWithDish.toJSON(),
              updatedOrder
            );
          }
        } catch (error) {
          console.error(
            "Failed to emit order item quantity changed event:",
            error
          );
        }
      }
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
    const itemOrder = await OrderItem.findByPk(itemId, {
      include: [
        {
          model: Dish,
          as: "dish",
        },
      ],
    });
    if (!itemOrder) {
      throw new AppError("Order item not found", 404);
    }
    await this.recalculateOrderTotals(itemOrder.order_id as string);
    const item = await orderRepository.updateItemStatus(itemId, status);

    // If status is "completed", deduct ingredients with 5% waste
    if (status === "completed") {
      const dishIngredients = await DishIngredient.findAll({
        where: { dish_id: itemOrder.dish_id },
      });

      const quantity = Number(itemOrder.quantity) || 1;
      const wasteFactor = 1.05; // 5% waste

      for (const dishIngredient of dishIngredients) {
        const ingredient = await Ingredient.findByPk(
          dishIngredient.ingredient_id
        );
        if (ingredient) {
          const requiredQuantity =
            Number(dishIngredient.quantity) * quantity * wasteFactor;
          const newStock = Math.max(
            0,
            Number(ingredient.current_stock) - requiredQuantity
          );

          await Ingredient.update(
            { current_stock: newStock },
            { where: { id: ingredient.id } }
          );
        }
      }
    }

    // Emit orderItemStatusChanged event
    try {
      const order = await Order.findByPk(itemOrder.order_id as string);
      if (order) {
        const updatedOrder = await orderRepository.findById(order.id);
        const itemWithDish = await OrderItem.findByPk(itemId, {
          include: [
            {
              model: Dish,
              as: "dish",
              attributes: ["id", "name", "price", "media_urls", "description"],
            },
          ],
        });
        if (itemWithDish && updatedOrder) {
          orderEvents.orderItemStatusChanged(
            getIO(),
            order.id,
            itemWithDish.toJSON(),
            updatedOrder
          );
        }
      }
    } catch (error) {
      console.error("Failed to emit order item status changed event:", error);
    }

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
    const orderId = item.order_id as string;
    await orderRepository.deleteItem(itemId);

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    const updatedOrder = await orderRepository.findById(orderId);
    if (updatedOrder) {
      await notificationService.notifyOrderUpdated(updatedOrder);
      try {
        orderEvents.orderUpdated(getIO(), updatedOrder);

        // Emit orderItemDeleted event
        orderEvents.orderItemDeleted(getIO(), orderId, itemId, updatedOrder);
      } catch (error) {
        console.error("Failed to emit order updated event:", error);
      }
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
    // Calculate discount
    let discountAmount = 0;
    if (voucher.discount_type === "percentage") {
      discountAmount = Math.min(
        (Number(order.total_amount) * Number(voucher.value)) / 100,
        Number(order.total_amount)
      );
    } else {
      discountAmount = Math.min(
        Number(voucher.value),
        Number(order.total_amount)
      );
    }
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

  async requestPayment(
    orderId: string,
    options?: {
      bankCode?: string;
      client?: "admin" | "user";
      pointsUsed?: number;
      clientIp?: string;
    }
  ) {
    const {
      bankCode,
      client = "user",
      pointsUsed = 0,
      clientIp = "127.0.0.1",
    } = options || {};
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.payment_status === "paid") {
      throw new AppError("Order already paid", 400);
    }

    // Validate: All order items must be either "completed" or "cancelled"
    const orderItems = await OrderItem.findAll({
      where: { order_id: orderId },
    });

    if (orderItems.length === 0) {
      throw new AppError("Order must have at least one item", 400);
    }

    const invalidItems = orderItems.filter(
      (item) => item.status !== "completed" && item.status !== "cancelled"
    );

    if (invalidItems.length > 0) {
      throw new AppError(
        `Không thể thanh toán. Có ${invalidItems.length} món chưa hoàn thành hoặc chưa hủy. Vui lòng đợi tất cả món hoàn thành hoặc hủy các món không cần thiết.`,
        400
      );
    }

    // Calculate payment amount from scratch according to new formula
    // Subtotal from items
    const subtotal = orderItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);

    const eventFee = Number(order.event_fee) || 0;
    const deposit = Number(order.deposit_amount) || 0;
    const discount = Number(order.voucher_discount_amount) || 0;

    // VAT = 10% of (subtotal + event_fee)
    const vatBase = subtotal + eventFee;
    const vatAmount = vatBase * 0.1;

    // Final amount = (subtotal + event_fee - deposit - discount) + VAT
    const totalBeforeDiscount = subtotal + eventFee;
    const amountAfterDiscount = Math.max(
      0,
      totalBeforeDiscount - deposit - discount
    );
    const totalBeforePoints = amountAfterDiscount + vatAmount;

    // Apply points if provided (1 point = 1 VND)
    let pointsToUse = 0;
    let finalPaymentAmount = totalBeforePoints;

    if (pointsUsed && pointsUsed > 0 && order.user_id) {
      const user = await User.findByPk(order.user_id);
      if (user && user.points) {
        const availablePoints = Number(user.points);
        pointsToUse = Math.min(pointsUsed, availablePoints, totalBeforePoints);
        finalPaymentAmount = Math.max(0, totalBeforePoints - pointsToUse);
      }
    }

    // Update order with VAT and points info
    const updatedOrder = await orderRepository.update(orderId, {
      status: "waiting_payment",
      payment_method: "vnpay",
      // Store VAT and points info in order (we can add fields or use a JSON field)
    });

    // Create payment record with final amount
    const paymentUrl = paymentService.generateVnpayOrderUrl(
      { id: orderId, final_amount: finalPaymentAmount },
      bankCode,
      clientIp,
      client
    );
    await paymentService.createPendingPayment({
      order_id: orderId,
      amount: finalPaymentAmount,
      method: "vnpay",
      transaction_id: paymentUrl.txnRef,
    });

    // Deduct points if used
    if (pointsToUse > 0 && order.user_id) {
      await User.update(
        {
          points: Sequelize.literal(`points - ${pointsToUse}`),
        },
        { where: { id: order.user_id } }
      );
    }

    try {
      const payload =
        typeof (updatedOrder as any).toJSON === "function"
          ? (updatedOrder as any).toJSON()
          : updatedOrder;
      orderEvents.paymentRequested(getIO(), {
        ...payload,
        payment_method: "vnpay",
        vat_amount: vatAmount,
        points_used: pointsToUse,
        final_payment_amount: finalPaymentAmount,
      });
    } catch (error) {
      console.error("Failed to emit payment requested event:", error);
    }

    return {
      redirect_url: paymentUrl.url,
      vat_amount: vatAmount,
      points_used: pointsToUse,
      final_payment_amount: finalPaymentAmount,
    };
  }

  async requestCashPayment(
    orderId: string,
    note?: string,
    pointsUsed?: number
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.payment_status === "paid") {
      throw new AppError("Order already paid", 400);
    }

    // Validate: All order items must be either "completed" or "cancelled"
    const orderItems = await OrderItem.findAll({
      where: { order_id: orderId },
    });

    if (orderItems.length === 0) {
      throw new AppError("Order must have at least one item", 400);
    }

    const invalidItems = orderItems.filter(
      (item) => item.status !== "completed" && item.status !== "cancelled"
    );

    if (invalidItems.length > 0) {
      throw new AppError(
        `Không thể thanh toán. Có ${invalidItems.length} món chưa hoàn thành hoặc chưa hủy. Vui lòng đợi tất cả món hoàn thành hoặc hủy các món không cần thiết.`,
        400
      );
    }

    // Calculate payment amount from scratch according to new formula
    // Subtotal from items
    const subtotal = orderItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);

    const eventFee = Number(order.event_fee) || 0;
    const deposit = Number(order.deposit_amount) || 0;
    const discount = Number(order.voucher_discount_amount) || 0;

    // VAT = 10% of (subtotal + event_fee)
    const vatBase = subtotal + eventFee;
    const vatAmount = vatBase * 0.1;

    // Final amount = (subtotal + event_fee - deposit - discount) + VAT
    const totalBeforeDiscount = subtotal + eventFee;
    const amountAfterDiscount = Math.max(
      0,
      totalBeforeDiscount - deposit - discount
    );
    const totalBeforePoints = amountAfterDiscount + vatAmount;

    // Apply points if provided (1 point = 1 VND)
    let pointsToUse = 0;
    let finalPaymentAmount = totalBeforePoints;

    if (pointsUsed && pointsUsed > 0 && order.user_id) {
      const user = await User.findByPk(order.user_id);
      if (user && user.points) {
        const availablePoints = Number(user.points);
        pointsToUse = Math.min(pointsUsed, availablePoints, totalBeforePoints);
        finalPaymentAmount = Math.max(0, totalBeforePoints - pointsToUse);
      }
    }

    const updatedOrder = await orderRepository.update(orderId, {
      status: "waiting_payment",
      payment_method: "cash",
    });

    await paymentService.createPendingPayment({
      order_id: orderId,
      amount: finalPaymentAmount,
      method: "cash",
    });

    // Deduct points if used
    if (pointsToUse > 0 && order.user_id) {
      await User.update(
        {
          points: Sequelize.literal(`points - ${pointsToUse}`),
        },
        { where: { id: order.user_id } }
      );
    }

    // Send notification to admin about cash payment request
    try {
      const detailedOrder = await orderRepository.findById(orderId);
      if (detailedOrder) {
        await notificationService.notifyPaymentRequested(detailedOrder, note);
      }
    } catch (error) {
      console.error("Failed to send payment request notification:", error);
    }

    try {
      const payload =
        typeof (updatedOrder as any).toJSON === "function"
          ? (updatedOrder as any).toJSON()
          : updatedOrder;
      orderEvents.paymentRequested(getIO(), {
        ...payload,
        payment_method: "cash",
        payment_note: note || undefined,
        vat_amount: vatAmount,
        points_used: pointsToUse,
        final_payment_amount: finalPaymentAmount,
      });
    } catch (error) {
      console.error("Failed to emit payment requested event:", error);
    }

    return {
      message: "Cash payment request sent",
      vat_amount: vatAmount,
      points_used: pointsToUse,
      final_payment_amount: finalPaymentAmount,
    };
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

    // Award loyalty points: 1% of final_amount (excluding walk-in customers)
    if (order.user_id) {
      const finalAmount = Number(order.final_amount ?? order.total_amount ?? 0);
      const pointsToAward = Math.floor(finalAmount * 0.01); // 1% of final amount

      if (pointsToAward > 0) {
        await User.update(
          {
            points: Sequelize.literal(`points + ${pointsToAward}`),
          },
          { where: { id: order.user_id } }
        );

        // Update ranking based on new points
        const user = await User.findByPk(order.user_id);
        if (user) {
          const newPoints = Number(user.points) + pointsToAward;
          let newRanking = user.ranking;
          if (newPoints >= 2500) newRanking = "platinum";
          else if (newPoints >= 1000) newRanking = "vip";
          else newRanking = "regular";

          await user.update({ ranking: newRanking });
        }
      }
    }

    // Send notification and WebSocket event
    await notificationService.notifyPaymentCompleted(updatedOrder);
    try {
      const io = getIO();
      orderEvents.paymentCompleted(io, updatedOrder);
      orderEvents.orderStatusChanged(io, updatedOrder);
      // Also emit to table room if order has table_id
      if (updatedOrder.table_id) {
        const { tableEvents } = await import("../sockets/tableSocket");
        tableEvents.tableOrderUpdated(io, updatedOrder.table_id, updatedOrder);
      }
    } catch (error) {
      console.error("Failed to emit payment completed event:", error);
    }

    // Also use loyalty service for additional features (notifications, etc.)
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
      const io = getIO();
      orderEvents.paymentFailed(io, updatedOrder);
      orderEvents.orderStatusChanged(io, updatedOrder);
      // Also emit to table room if order has table_id
      if (updatedOrder.table_id) {
        const { tableEvents } = await import("../sockets/tableSocket");
        tableEvents.tableOrderUpdated(io, updatedOrder.table_id, updatedOrder);
      }
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
      where: { order_id: orderId },
    });

    if (!items || items.length === 0) {
      // No items, set totals to 0
      await order.update({
        total_amount: 0,
        final_amount: 0,
      });
      return;
    }

    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);

    const eventFee = Number(order.event_fee) || 0;
    const deposit = Number(order.deposit_amount) || 0;
    const discount = Number(order.voucher_discount_amount) || 0;

    const totalAmount = subtotal + eventFee;
    const vatBase = subtotal + eventFee;
    const vatAmount = vatBase * 0.1;
    const amountAfterDiscount = Math.max(
      0,
      totalAmount - deposit - discount + vatAmount
    );

    // VAT = 10% of (subtotal + event_fee), not amountAfterDiscount

    const finalAmount = amountAfterDiscount;

    await order.update({
      total_amount: totalAmount,
      final_amount: finalAmount,
    });
  }
}

export default new OrderService();
