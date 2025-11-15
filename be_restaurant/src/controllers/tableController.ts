import type { Request, Response, NextFunction } from "express";
import tableService from "../services/tableService";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";
import Order from "../models/Order";
import sequelize from "../config/database";
import tableGroupService from "../services/tableGroupService";
import { check } from "express-validator";
import { uploadMultipleImagesToCloudinary } from "../services/cloudService";

export const getAllTables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Return all tables without pagination if all=true
    if (req.query.all === "true") {
      const result = await tableService.findAll({
        order: [["created_at", "ASC"]],
      });
      const data =
        result?.rows && Array.isArray(result.rows)
          ? result.rows.map((table: any) => table.toJSON())
          : Array.isArray(result)
          ? result.map((table: any) => table.toJSON())
          : [];

      const count = result?.count ?? data.length;

      return res.status(200).json({
        status: "success",
        count,
        data,
      });
    }

    // Check if any search parameters are present
    const hasSearchParams = [
      "search",
      "table_number",
      "status",
      "capacity_min",
      "capacity_max",
      "capacity_exact",
      "capacity_ranges",
      "deposit_min",
      "deposit_max",
      "deposit_exact",
      "deposit_ranges",
      "cancel_minutes_min",
      "cancel_minutes_max",
      "sort",
    ].some((param) => param in req.query);

    const { page = 1, limit = 10 } = getPaginationParams(req.query);
    if (hasSearchParams) {
      // Use search functionality
      const { count, rows } = await tableService.search(req.query);

      // Build pagination result
      const result = buildPaginationResult(rows, count, +page, +limit);

      return res.json({ status: "success", data: result });
    } else {
      // Regular pagination
      const { sortBy = "created_at", sortOrder = "ASC" } = getPaginationParams(
        req.query
      );
      const offset = (+page - 1) * +limit;

      const { count, rows } = await tableService.findAll({
        limit: +limit,
        offset,
        order: [[sortBy, sortOrder]],
      });

      const result = buildPaginationResult(rows, count, +page, +limit);
      return res.json({ status: "success", data: result });
    }
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const table = await tableService.findById(req.params.id);
    res.json({ status: "success", data: table });
  } catch (error) {
    next(error);
  }
};

export const getTablesByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = getPaginationParams(req.query);
    const offset = (page - 1) * limit;
    const { rows, count } = await tableService.findTablesByStatus(
      req.params.status,
      {
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      }
    );

    const result = buildPaginationResult(rows, count, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const body: any = { ...req.body };
    // Parse potential JSON strings from multipart
    if (typeof body.location === "string") {
      try {
        body.location = JSON.parse(body.location);
      } catch {}
    }
    if (typeof body.amenities === "string") {
      try {
        body.amenities = JSON.parse(body.amenities);
      } catch {}
    }

    if (files.length > 0) {
      const uploaded = await uploadMultipleImagesToCloudinary(
        files.map((f) => f.path),
        "table"
      );
      body.panorama_urls = uploaded.map((u) => u.secure_url);
    }

    const table = await tableService.create(body);
    res.status(201).json({ status: "success", data: table });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const body: any = { ...req.body };
    if (typeof body.location === "string") {
      try {
        body.location = JSON.parse(body.location);
      } catch {}
    }
    if (typeof body.amenities === "string") {
      try {
        body.amenities = JSON.parse(body.amenities);
      } catch {}
    }
    if (typeof body.panorama_urls === "string") {
      try {
        body.panorama_urls = JSON.parse(body.panorama_urls);
      } catch {}
    }

    if (files.length > 0) {
      const uploaded = await uploadMultipleImagesToCloudinary(
        files.map((f) => f.path),
        "table"
      );
      body.panorama_urls = uploaded.map((u) => u.secure_url);
    }

    const table = await tableService.update(req.params.id, body);
    res.json({ status: "success", data: table });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await tableService.softDelete(req.params.id);
    res.json({ status: "success", message: "Table deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// QR check-in create order for table directly
export const checkinTableCreateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const transaction = await sequelize.transaction();
  try {
    const tableId = req.params.id;
    const userId = req.user?.id;
    const order = await Order.create(
      {
        table_id: tableId,
        user_id: userId,
        status: "dining",
        total_amount: 0,
        voucher_discount_amount: 0,
        event_fee: 0,
        deposit_amount: 0,
        final_amount: 0,
      },
      { transaction }
    );
    await transaction.commit();
    res.status(201).json({ status: "success", data: order });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const doGroupTables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.table_ids || req.body.table_ids.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "At least two tables are required to form a group",
      });
    }
    if (
      await tableGroupService.checkExistedTablesInGroup(
        req.body.table_ids as [],
        req.body.id
      )
    ) {
      return res.status(400).json({
        status: "error",
        message: "One or more tables are already in a group",
      });
    }
    const tableGroup = await tableGroupService.create(req.body);
    res.status(201).json({ status: "success", data: tableGroup });
  } catch (error) {
    next(error);
  }
};

export const doUpdateTableGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.table_ids || req.body.table_ids.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "At least two tables are required to form a group",
      });
    }
    if (
      await tableGroupService.checkExistedTablesInGroup(
        req.body.table_ids as [],
        req.params.id
      )
    ) {
      return res.status(400).json({
        status: "error",
        message: "One or more tables are already in another group",
      });
    }
    const tableGroup = await tableGroupService.update(req.params.id, req.body);
    res.json({ status: "success", data: tableGroup });
  } catch (error) {
    next(error);
  }
};

export const ungroupTables = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await tableGroupService.delete(req.params.id);
    res.json({
      status: "success",
      message: "Table group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTableGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("here");
    const tableGroups = await tableGroupService.getAllTableGroup();
    res.status(200).json({ status: "success", data: tableGroups });
  } catch (error) {
    next(error);
  }
};

export const getTableGroupById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tableGroup = await tableGroupService.getTableGroupById(req.params.id);
    res.json({ status: "success", data: tableGroup });
  } catch (error) {
    next(error);
  }
};

// Generate QR Code URL for table
export const getTableQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tableId = req.params.id;
    const table = await tableService.findById(tableId);

    if (!table) {
      return res.status(404).json({
        status: "error",
        message: "Table not found",
      });
    }

    // Generate QR code URL
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:3000";
    const qrCodeUrl = `${frontendUrl}/table/${tableId}`;

    res.json({
      status: "success",
      data: {
        table_id: tableId,
        table_number: (table as any).table_number || tableId,
        qr_code_url: qrCodeUrl,
        // Frontend sẽ generate QR code image từ URL này
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get available tables for reservation
export const getAvailableTablesForReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const numPeople = req.query.num_people
      ? parseInt(req.query.num_people as string)
      : undefined;
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    const durationMinutes = req.query.duration_minutes
      ? parseInt(req.query.duration_minutes as string)
      : 60;

    // Validate num_people if provided
    if (numPeople !== undefined && numPeople <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Số lượng khách phải lớn hơn 0",
      });
    }

    // Validate date if provided
    if (date && isNaN(date.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "Ngày không hợp lệ",
      });
    }

    const tables = await tableService.findAvailableTablesForReservation(
      numPeople,
      date,
      durationMinutes
    );

    res.json({
      status: "success",
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

// Get available time slots for a table
export const getTableAvailableTimeSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tableId = req.params.id;
    const date = req.query.date
      ? new Date(req.query.date as string)
      : new Date();
    const durationMinutes = req.query.duration_minutes
      ? parseInt(req.query.duration_minutes as string)
      : 60;

    // Validate table exists
    const table = await tableService.findById(tableId);
    if (!table) {
      return res.status(404).json({
        status: "error",
        message: "Table not found",
      });
    }

    // Validate date
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "Ngày không hợp lệ",
      });
    }

    const timeSlots = await tableService.getAvailableTimeSlots(
      tableId,
      date,
      durationMinutes
    );

    res.json({
      status: "success",
      data: {
        table_id: tableId,
        date: date.toISOString().split("T")[0],
        duration_minutes: durationMinutes,
        available_time_slots: timeSlots,
      },
    });
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

    // Validate table exists
    const table = await tableService.findById(tableId);
    if (!table) {
      return res.status(404).json({
        status: "error",
        message: "Table not found",
      });
    }

    // Check if table is available
    const tableData = table as any;
    if (tableData.status === "occupied") {
      // Check if there's an active order for this table
      const activeOrder = await Order.findOne({
        where: {
          table_id: tableId,
          status: {
            [require("sequelize").Op.in]: ["pending", "dining", "preparing"],
          },
        },
      });

      if (activeOrder) {
        // Return existing order
        return res.status(200).json({
          status: "success",
          data: activeOrder,
          message: "Table already has an active order",
        });
      }
    }

    // Import orderService
    const orderService = require("../services/orderService").default;

    // Create order
    const order = await orderService.createOrder({
      table_id: tableId,
      user_id: userId || undefined, // Optional for guest
      items: [], // Empty items - customer will add later
      status: "dining",
    });

    res.status(201).json({
      status: "success",
      data: order,
      message: "Order created successfully",
    });
  } catch (error) {
    next(error);
  }
};
