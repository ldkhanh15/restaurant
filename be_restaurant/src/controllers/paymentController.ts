import type { Request, Response, NextFunction } from "express";
import Order from "../models/Order";
import Reservation from "../models/Reservation";
import paymentService from "../services/paymentService";
import { getIO } from "../sockets";
import { orderEvents } from "../sockets/orderSocket";
import notificationService from "../services/notificationService";
import ReservationService from "../services/reservationService";
import OrderService from "../services/orderService";
import statisticsService from "../services/statisticsService";
import { AppError } from "../middlewares/errorHandler";

export const vnpayCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = req.query as Record<string, any>;
    const { isValid, isSuccess, kind, targetId } =
      paymentService.verifyVnpayReturn(params);

    const adminClient =
      process.env.CLIENT_ADMIN_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:8081";
    const userClient =
      process.env.CLIENT_USER_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:3000";

    // Determine client by looking at txnRef suffix (_ADM or _USR)
    const txnRefRaw = String(params.vnp_TxnRef || "");
    const isAdminTxn = /_(ADM)(?:_|$)/.test(txnRefRaw);
    const clientUrl = isAdminTxn ? adminClient : userClient;

    if (!isValid) {
      return res.redirect(`${clientUrl}/payment/failed?reason=invalid_hash`);
    }

    if (kind === "order" && targetId) {
      const order = await Order.findByPk(targetId);
      if (!order)
        return res.redirect(
          `${clientUrl}/payment/failed?reason=order_not_found`
        );
      const txnRef = String(params.vnp_TxnRef || "");
      if (isSuccess) {
        await OrderService.handlePaymentSuccess(order.id);
        await paymentService.updatePaymentStatusByTxnRef(txnRef, "completed");
        return res.redirect(
          `${clientUrl}/payment/success?order_id=${order.id}`
        );
      } else {
        await OrderService.handlePaymentFailure(order.id);
        await paymentService.updatePaymentStatusByTxnRef(txnRef, "failed");
        return res.redirect(`${clientUrl}/payment/failed?order_id=${order.id}`);
      }
    }

    if (kind === "reservation" && targetId) {
      const reservation = await Reservation.findByPk(targetId);
      if (!reservation)
        return res.redirect(
          `${clientUrl}/payment/failed?reason=reservation_not_found`
        );
      const txnRef = String(params.vnp_TxnRef || "");
      if (isSuccess) {
        await ReservationService.handleDepositPaymentSuccess(reservation.id);

        await paymentService.updatePaymentStatusByTxnRef(txnRef, "completed");
        return res.redirect(
          `${clientUrl}/payment/success?reservation_id=${reservation.id}`
        );
      } else {
        await paymentService.updatePaymentStatusByTxnRef(txnRef, "failed");
        await ReservationService.handleDepositPaymentFailure(reservation.id);
        return res.redirect(
          `${clientUrl}/payment/failed?reservation_id=${reservation.id}`
        );
      }
    }

    return res.redirect(`${clientUrl}/payment/failed?reason=unknown_type`);
  } catch (error) {
    next(error);
  }
};

export const vnpayIpn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = (req.method === "GET" ? req.query : req.body) as Record<
      string,
      any
    >;
    const { isValid, isSuccess, kind, targetId } =
      paymentService.verifyVnpayReturn(params);
    if (!isValid)
      return res.json({ RspCode: "97", Message: "Checksum failed" });
    if (!kind || !targetId)
      return res.json({ RspCode: "01", Message: "Not recognized" });

    const txnRef = String(params.vnp_TxnRef || "");
    if (kind === "order") {
      const order = await Order.findByPk(targetId);
      if (!order)
        return res.json({ RspCode: "01", Message: "Order not found" });
      if (isSuccess) {
        await order.update({
          payment_status: "paid",
          status: "paid",
          payment_method: "vnpay",
        });
        await paymentService.updatePaymentStatusByTxnRef(txnRef, "completed");
        try {
          orderEvents.paymentCompleted(getIO(), order);
          await notificationService.notifyPaymentCompleted(order);
        } catch {}
      } else {
        await order.update({ payment_status: "failed" });
        await paymentService.updatePaymentStatusByTxnRef(txnRef, "failed");
      }
      return res.json({ RspCode: "00", Message: "Success" });
    }

    if (kind === "reservation") {
      const reservation = await Reservation.findByPk(targetId);
      if (!reservation)
        return res.json({ RspCode: "01", Message: "Reservation not found" });
      if (isSuccess) {
        await reservation.update({
          status: "confirmed",
        });
        await paymentService.updatePaymentStatusByTxnRef(txnRef, "completed");
        await ReservationService.handleDepositPaymentSuccess(reservation.id);
      } else {
        await paymentService.updatePaymentStatusByTxnRef(txnRef, "failed");
        await ReservationService.handleDepositPaymentFailure(reservation.id);
      }
      return res.json({ RspCode: "00", Message: "Success" });
    }

    return res.json({ RspCode: "02", Message: "Unhandled" });
  } catch (error) {
    next(error);
  }
};

// Payment CRUD Controllers
export const getAllPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      order_id,
      reservation_id,
      method,
      status,
      user_id,
      start_date,
      end_date,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      order_id: order_id as string,
      reservation_id: reservation_id as string,
      method: method as "cash" | "vnpay",
      status: status as "pending" | "completed" | "failed",
      user_id: user_id as string,
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      page: Number(page),
      limit: Number(limit),
    };

    const result = await paymentService.getAllPayments(filters);

    res.json({
      status: "success",
      data: result.rows,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.count,
        pages: Math.ceil(result.count / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    res.json({
      status: "success",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// Statistics Controllers
export const getRevenueStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await statisticsService.getRevenueStats();

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await statisticsService.getOrderStats(
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getReservationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await statisticsService.getReservationStats(
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await statisticsService.getPaymentStats(
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getTableRevenueStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await statisticsService.getTableRevenueStats(
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerSpendingStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await statisticsService.getCustomerSpendingStats(
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyRevenueStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      throw new AppError("start_date and end_date are required", 400);
    }

    const stats = await statisticsService.getDailyRevenueStats(
      new Date(start_date as string),
      new Date(end_date as string)
    );

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyRevenueStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      throw new AppError("start_date and end_date are required", 400);
    }

    const stats = await statisticsService.getMonthlyRevenueStats(
      new Date(start_date as string),
      new Date(end_date as string)
    );

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getDishStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await statisticsService.getDishStats(
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard Overview
export const getDashboardOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start_date, end_date } = req.query;

    const [
      revenueStats,
      orderStats,
      reservationStats,
      paymentStats,
      topTables,
      topCustomers,
      topDishes,
    ] = await Promise.all([
      statisticsService.getRevenueStats(),
      statisticsService.getOrderStats(
        start_date ? new Date(start_date as string) : undefined,
        end_date ? new Date(end_date as string) : undefined
      ),
      statisticsService.getReservationStats(
        start_date ? new Date(start_date as string) : undefined,
        end_date ? new Date(end_date as string) : undefined
      ),
      statisticsService.getPaymentStats(
        start_date ? new Date(start_date as string) : undefined,
        end_date ? new Date(end_date as string) : undefined
      ),
      statisticsService
        .getTableRevenueStats(
          start_date ? new Date(start_date as string) : undefined,
          end_date ? new Date(end_date as string) : undefined
        )
        .then((stats) => stats.slice(0, 5)), // Top 5 tables
      statisticsService
        .getCustomerSpendingStats(
          start_date ? new Date(start_date as string) : undefined,
          end_date ? new Date(end_date as string) : undefined
        )
        .then((stats) => stats.slice(0, 5)), // Top 5 customers
      statisticsService
        .getDishStats(
          start_date ? new Date(start_date as string) : undefined,
          end_date ? new Date(end_date as string) : undefined
        )
        .then((stats) => stats.slice(0, 5)), // Top 5 dishes
    ]);

    res.json({
      status: "success",
      data: {
        revenue: revenueStats,
        orders: orderStats,
        reservations: reservationStats,
        payments: paymentStats,
        top_tables: topTables,
        top_customers: topCustomers,
        top_dishes: topDishes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Retry payment for a failed payment
export const retryPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { method, bankCode } = req.body; // method: "vnpay" | "cash"

    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== "failed") {
      throw new AppError("Only failed payments can be retried", 400);
    }

    // Determine if payment is for order or reservation
    if (payment.order_id) {
      const order = await Order.findByPk(payment.order_id);
      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (method === "vnpay") {
        // Get client IP from request
        const clientIp =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.ip ||
          req.socket.remoteAddress ||
          "127.0.0.1";

        // Determine client type
        const userRole = req.user?.role;
        const clientFromBody = req.body?.client as "admin" | "user" | undefined;
        const client: "admin" | "user" =
          clientFromBody ||
          (userRole === "admin" || userRole === "employee" ? "admin" : "user");

        // Use orderService.requestPayment to handle VAT, points, etc.
        const pointsUsed = req.body?.pointsUsed || req.body?.points_used || 0;
        const result = await OrderService.requestPayment(order.id, {
          bankCode,
          client,
          pointsUsed,
          clientIp,
        });

        res.json({
          status: "success",
          data: {
            redirect_url: result.redirect_url,
            vat_amount: result.vat_amount,
            points_used: result.points_used,
            final_payment_amount: result.final_payment_amount,
            message: "Payment retry initiated",
          },
        });
      } else if (method === "cash") {
        // For cash payment, use orderService.requestCashPayment
        const pointsUsed = req.body?.pointsUsed || req.body?.points_used || 0;
        const result = await OrderService.requestCashPayment(
          order.id,
          req.body.note,
          pointsUsed
        );

        await notificationService.notifyPaymentRequested(order);

        res.json({
          status: "success",
          data: {
            ...result,
            message: "Cash payment request sent to admin",
          },
        });
      } else {
        throw new AppError("Invalid payment method", 400);
      }
    } else if (payment.reservation_id) {
      const reservation = await Reservation.findByPk(payment.reservation_id);
      if (!reservation) {
        throw new AppError("Reservation not found", 404);
      }

      if (method === "vnpay") {
        const paymentUrl = paymentService.generateVnpayReservationUrl(
          reservation.id,
          Number(reservation.deposit_amount || 0),
          bankCode,
          req.ip || "127.0.0.1",
          "user"
        );

        await paymentService.createPendingPayment({
          reservation_id: payment.reservation_id,
          amount: Number(payment.amount),
          method: "vnpay",
          transaction_id: paymentUrl.txnRef,
        });

        res.json({
          status: "success",
          data: {
            redirect_url: paymentUrl.url,
            message: "Deposit payment retry initiated",
          },
        });
      } else {
        throw new AppError(
          "Only VNPay is supported for reservation deposits",
          400
        );
      }
    } else {
      throw new AppError(
        "Payment must be associated with an order or reservation",
        400
      );
    }
  } catch (error) {
    next(error);
  }
};

// Request payment retry for an order (customer-initiated)
export const requestOrderPaymentRetry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { method, bankCode, pointsUsed } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Get client IP from request
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    // Determine client type: admin/employee -> "admin", customer -> "user"
    const userRole = req.user?.role;
    const clientFromBody = req.body?.client as "admin" | "user" | undefined;
    const client: "admin" | "user" =
      clientFromBody ||
      (userRole === "admin" || userRole === "employee" ? "admin" : "user");

    // Check if there's a failed payment
    const failedPayment = await paymentService.search({
      order_id: id,
      status: "failed",
    });

    if (failedPayment.rows.length === 0) {
      // No failed payment, use regular requestPayment
      if (method === "vnpay") {
        const result = await OrderService.requestPayment(id, {
          bankCode,
          client,
          pointsUsed: pointsUsed || 0,
          clientIp,
        });
        return res.json({ status: "success", data: result });
      } else if (method === "cash") {
        const result = await OrderService.requestCashPayment(
          id,
          req.body.note,
          pointsUsed || 0
        );
        return res.json({ status: "success", data: result });
      }
    } else {
      // Retry the failed payment - update retryPayment to handle points
      const retryReq = {
        ...req,
        params: { id: failedPayment.rows[0].id },
        body: { ...req.body, method, bankCode, pointsUsed },
      } as any;
      return retryPayment(retryReq, res, next);
    }
  } catch (error) {
    next(error);
  }
};

// Request deposit payment retry for a reservation (customer-initiated)
export const requestReservationDepositRetry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { bankCode } = req.body;

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    // Check if there's a failed payment
    const failedPayment = await paymentService.search({
      reservation_id: id,
      status: "failed",
    });

    if (failedPayment.rows.length > 0) {
      // Retry the failed payment
      return retryPayment(
        {
          ...req,
          params: { id: failedPayment.rows[0].id },
          body: { method: "vnpay", bankCode },
        } as any,
        res,
        next
      );
    } else {
      // No failed payment, create new deposit payment request
      const paymentUrl = paymentService.generateVnpayReservationUrl(
        reservation.id,
        Number(reservation.deposit_amount || 0),
        bankCode,
        req.ip || "127.0.0.1",
        "user"
      );

      await paymentService.createPendingPayment({
        reservation_id: id,
        amount: Number(reservation.deposit_amount || 0),
        method: "vnpay",
        transaction_id: paymentUrl.txnRef,
      });

      res.json({
        status: "success",
        data: {
          redirect_url: paymentUrl.url,
          message: "Deposit payment request created",
        },
      });
    }
  } catch (error) {
    next(error);
  }
};