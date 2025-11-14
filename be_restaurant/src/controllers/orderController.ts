import type { Request, Response, NextFunction } from "express";
import orderService from "../services/orderService";
import statisticsService from "../services/statisticsService";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, ...filters } = getPaginationParams(req.query);

    const result = await orderService.getAllOrders({
      ...filters,
      page,
      limit,
    });

    const paginatedResult = buildPaginationResult(
      result.rows,
      result.count,
      page,
      limit
    );
    res.json({ status: "success", data: paginatedResult });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { page = 1, limit = 10, ...filters } = getPaginationParams(req.query);

    // Only return orders for the authenticated user
    const result = await orderService.getAllOrders({
      ...filters,
      user_id: userId, // Force filter by current user
      page,
      limit,
    });

    const paginatedResult = buildPaginationResult(
      result.rows,
      result.count,
      page,
      limit
    );
    res.json({ status: "success", data: paginatedResult });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Ensure customer can only access their own orders
    // For walk-in customers (no user_id), allow access if they have the order ID
    const currentUserId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Admin and employee can access any order
    if (userRole === "admin" || userRole === "employee") {
      return res.json({ status: "success", data: order });
    }

    // For authenticated customers, check ownership
    if (userRole === "customer" && order.user_id) {
      if (order.user_id !== String(currentUserId)) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden: You can only access your own orders",
        });
      }
    }

    // For walk-in customers (no user_id in order), allow access
    // They can access orders by order ID (stored in localStorage)
    // No additional validation needed as they don't have user_id

    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const getOrderByTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;
    const order = await orderService.getOrderByTable(
      req.params.tableId,
      status as string
    );
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

// Create order from table (for guest customers - no auth required)
export const createOrderFromTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tableId = req.params.tableId;
    const userId = (req as any).user?.id; // Optional - có thể null cho guest
    const items = req.body?.items || []; // Items from request body

    // Check if there's an existing active order for this table
    const existingOrder = await orderService.getOrderByTable(tableId, "dining");

    if (existingOrder) {
      // If there are items to add, add them to existing order
      if (items && items.length > 0) {
        for (const item of items) {
          await orderService.addItemToOrder(existingOrder.id, {
            dish_id: item.dish_id,
            quantity: item.quantity,
          });
        }
        // Reload order with updated items
        const updatedOrder = await orderService.getOrderById(existingOrder.id);
        return res.status(200).json({
          status: "success",
          data: updatedOrder,
          message: "Đã thêm món vào đơn hàng đang dùng",
        });
      }
      // Return existing order without adding items
      return res.status(200).json({
        status: "success",
        data: existingOrder,
        message: "Đã tìm thấy đơn hàng đang dùng cho bàn này",
      });
    }

    // No active order found, create new one with items
    const data = {
      table_id: tableId,
      user_id: userId || undefined, // Optional for guest
      items: items, // Items from request body
      status: "dining",
    };

    const order = await orderService.createOrder(data);
    res.status(201).json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = {
      ...req.body,
      user_id: req.user?.id,
    };

    const order = await orderService.createOrder(data);
    res.status(201).json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentOrder = await orderService.getOrderById(req.params.id);

    if (!currentOrder) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Ensure customer can only update their own orders
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only update your own orders",
      });
    }

    const order = await orderService.updateOrder(req.params.id, req.body);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

// Add item to order by table (for walk-in customers)
export const addItemToOrderByTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tableId } = req.params;
    const { dish_id, quantity } = req.body;

    // Find active order for this table
    const order = await orderService.getOrderByTable(tableId, "dining");

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "No active order found for this table",
      });
    }

    // Add item to the order (same logic as authenticated users)
    const updatedOrder = await orderService.addItemToOrder(order.id, {
      dish_id,
      quantity,
    });

    res.json({ status: "success", data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

export const addItemToOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentOrder = await orderService.getOrderById(req.params.id);

    if (!currentOrder) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Ensure customer can only add items to their own orders
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only modify your own orders",
      });
    }

    const order = await orderService.addItemToOrder(req.params.id, req.body);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const updateItemQuantity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Find item first to get order_id
    const OrderItem = (await import("../models/OrderItem")).default;
    const orderItem = await OrderItem.findByPk(req.params.itemId);

    if (!orderItem) {
      return res.status(404).json({
        status: "error",
        message: "Order item not found",
      });
    }

    // Get order to check ownership
    const currentOrder = await orderService.getOrderById(
      orderItem.order_id as string
    );

    if (!currentOrder) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Ensure customer can only update items in their own orders
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only modify your own orders",
      });
    }

    const { quantity } = req.body;
    const item = await orderService.updateItemQuantity(
      req.params.itemId,
      quantity
    );
    res.json({ status: "success", data: item });
  } catch (error) {
    next(error);
  }
};

export const updateItemStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;
    const item = await orderService.updateItemStatus(req.params.itemId, status);
    res.json({ status: "success", data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Find item first to get order_id
    const OrderItem = (await import("../models/OrderItem")).default;
    const orderItem = await OrderItem.findByPk(req.params.itemId);

    if (!orderItem) {
      return res.status(404).json({
        status: "error",
        message: "Order item not found",
      });
    }

    // Get order to check ownership
    const currentOrder = await orderService.getOrderById(
      orderItem.order_id as string
    );

    if (!currentOrder) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Ensure customer can only delete items from their own orders
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only modify your own orders",
      });
    }

    const order = await orderService.deleteItem(req.params.itemId);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const applyVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentOrder = await orderService.getOrderById(req.params.id);

    if (!currentOrder) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Ensure customer can only apply vouchers to their own orders
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only modify your own orders",
      });
    }

    const order = await orderService.applyVoucher(req.params.id, req.body);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const removeVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentOrder = await orderService.getOrderById(req.params.id);

    if (!currentOrder) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Ensure customer can only remove vouchers from their own orders
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only modify your own orders",
      });
    }

    const order = await orderService.removeVoucher(req.params.id);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const mergeOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { source_order_id, target_order_id } = req.body;
    const order = await orderService.mergeOrders(
      source_order_id,
      target_order_id
    );
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const requestSupport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentOrder = await orderService.getOrderById(req.params.id);

    if (!currentOrder) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Ensure customer can only request support for their own orders
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only request support for your own orders",
      });
    }

    const result = await orderService.requestSupport(req.params.id);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const requestPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentOrder = await orderService.getOrderById(req.params.id);

    if (!currentOrder) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Ensure customer can only request payment for their own orders
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only request payment for your own orders",
      });
    }

    // Determine client type: admin/employee -> "admin", customer -> "user"
    // Can also be passed from request body
    const clientFromBody = req.body?.client as "admin" | "user" | undefined;
    const client: "admin" | "user" =
      clientFromBody ||
      (userRole === "admin" || userRole === "employee" ? "admin" : "user");

    const bankCode = req.body?.bankCode as string | undefined;
    const pointsUsed = req.body?.pointsUsed || req.body?.points_used || 0;

    // Get client IP from request
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const result = await orderService.requestPayment(req.params.id, {
      bankCode,
      client,
      pointsUsed,
      clientIp,
    });
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const requestCashPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentOrder = await orderService.getOrderById(req.params.id);

    if (!currentOrder) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    if (
      userRole === "customer" &&
      currentOrder.user_id &&
      currentOrder.user_id !== String(currentUserId)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: You can only request payment for your own orders",
      });
    }

    const note = typeof req.body?.note === "string" ? req.body.note : undefined;
    const pointsUsed = req.body?.pointsUsed as number | undefined;
    const result = await orderService.requestCashPayment(
      req.params.id,
      note,
      pointsUsed
    );
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const handlePaymentSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await orderService.handlePaymentSuccess(req.params.id);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const handlePaymentFailure = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await orderService.handlePaymentFailure(req.params.id);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const completePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await orderService.completePayment(req.params.id);
    res.json({ status: "success", data: order });
  } catch (error) {
    next(error);
  }
};

export const getRevenueStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await orderService.getRevenueStats();
    res.json({ status: "success", data: stats });
  } catch (error) {
    next(error);
  }
};

// 1. Thống kê doanh thu, khách hàng, đơn hàng theo tháng (12 tháng gần đây)
export const getMonthlyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await orderService.getMonthlyStats();
    res.json({ status: "success", data: stats });
  } catch (error) {
    next(error);
  }
};

// 2. Thống kê đơn hàng và doanh thu theo giờ (24h, mỗi 2h)
export const getHourlyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await orderService.getHourlyStats();
    res.json({ status: "success", data: stats });
  } catch (error) {
    next(error);
  }
};

// 3. Thống kê khách hàng trong 7 ngày (có tài khoản vs vãng lai)
export const getCustomerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await orderService.getCustomerStats();
    res.json({ status: "success", data: stats });
  } catch (error) {
    next(error);
  }
};

// 4. Thống kê hôm nay (doanh thu, đơn hàng, đặt bàn)
export const getTodayStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await orderService.getTodayStats();
    res.json({ status: "success", data: stats });
  } catch (error) {
    next(error);
  }
};

// Excel Export: Export order revenue data
export const exportOrderRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date, status, table_id, user_id } = req.query;

    const filters: any = {};
    if (start_date) filters.start_date = new Date(start_date as string);
    if (end_date) filters.end_date = new Date(end_date as string);
    if (status) filters.status = status;
    if (table_id) filters.table_id = table_id as string;
    if (user_id) filters.user_id = user_id as string;

    // Get all orders matching filters (no pagination for export)
    const result = await orderService.getAllOrders({
      ...filters,
      page: 1,
      limit: 10000, // Large limit to get all
    });

    // Fetch items for each order
    const OrderItem = require("../models/OrderItem").default;
    const Dish = require("../models/Dish").default;

    const ordersWithItems = await Promise.all(
      result.rows.map(async (order: any) => {
        const orderData =
          typeof order.toJSON === "function" ? order.toJSON() : order;
        const items = await OrderItem.findAll({
          where: { order_id: orderData.id },
          include: [{ model: Dish, as: "dish" }],
        });
        return { ...orderData, items };
      })
    );

    // Format data for Excel export
    const exportData = ordersWithItems.map((orderData: any) => {
      return {
        "Order ID": orderData.id,
        Date: orderData.created_at
          ? new Date(orderData.created_at).toLocaleDateString("vi-VN")
          : "",
        Customer: orderData.user?.name || orderData.user?.email || "Guest",
        "Customer Email": orderData.user?.email || "",
        "Customer Phone": orderData.user?.phone || "",
        Table: orderData.table?.table_number || orderData.table_id || "",
        Status: orderData.status || "",
        "Payment Status": orderData.payment_status || "",
        "Payment Method": orderData.payment_method || "",
        Items:
          orderData.items
            ?.map((item: any) => {
              const itemData =
                typeof item.toJSON === "function" ? item.toJSON() : item;
              return `${itemData.dish?.name || "Unknown"} x${
                itemData.quantity
              }`;
            })
            .join(", ") || "",
        "Total Amount": orderData.total_amount || 0,
        "Voucher Discount": orderData.voucher_discount_amount || 0,
        "Event Fee": orderData.event_fee || 0,
        Deposit: orderData.deposit_amount || 0,
        "Final Amount": orderData.final_amount || 0,
        Notes: orderData.notes || "",
      };
    });

    res.json({
      status: "success",
      data: exportData,
      count: result.count,
      filters: {
        start_date: filters.start_date,
        end_date: filters.end_date,
        status: filters.status,
        table_id: filters.table_id,
        user_id: filters.user_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Excel Export: Export popular dishes statistics
export const exportPopularDishes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const startDate = start_date ? new Date(start_date as string) : undefined;
    const endDate = end_date ? new Date(end_date as string) : undefined;

    const dishStats = await statisticsService.getDishStats(startDate, endDate);

    // Format data for Excel export
    const exportData = dishStats.map((stat) => ({
      "Dish Name": stat.dish_name,
      "Dish ID": stat.dish_id,
      "Total Quantity Ordered": stat.total_quantity,
      "Total Revenue": stat.total_revenue,
      "Times Ordered": stat.order_count,
      "Average Revenue per Order":
        stat.order_count > 0
          ? (stat.total_revenue / stat.order_count).toFixed(2)
          : 0,
    }));

    res.json({
      status: "success",
      data: exportData,
      count: exportData.length,
      filters: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Excel Export: Export top customers statistics
export const exportTopCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const startDate = start_date ? new Date(start_date as string) : undefined;
    const endDate = end_date ? new Date(end_date as string) : undefined;

    const customerStats = await statisticsService.getCustomerSpendingStats(
      startDate,
      endDate
    );

    // Format data for Excel export
    const exportData = customerStats.map((stat) => ({
      "Customer Name": stat.user_name,
      "Customer Email": stat.user_email,
      "Customer ID": stat.user_id,
      "Total Spent": stat.total_spent,
      "Total Orders": stat.order_count,
      "Total Reservations": stat.reservation_count,
      "Total Payments": stat.payment_count,
      "Average Order Value":
        stat.order_count > 0
          ? (stat.total_spent / stat.order_count).toFixed(2)
          : 0,
    }));

    res.json({
      status: "success",
      data: exportData,
      count: exportData.length,
      filters: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    next(error);
  }
};
