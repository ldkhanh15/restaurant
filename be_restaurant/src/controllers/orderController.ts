import type { Request, Response, NextFunction } from "express";
import orderService from "../services/orderService";
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

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
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

export const addItemToOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
    const result = await orderService.requestPayment(req.params.id);
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
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        status: "error",
        message: "start_date and end_date are required",
      });
    }

    const startDate = new Date(start_date as string);
    const endDate = new Date(end_date as string);

    const stats = await orderService.getRevenueStats(startDate, endDate);
    res.json({ status: "success", data: stats });
  } catch (error) {
    next(error);
  }
};
