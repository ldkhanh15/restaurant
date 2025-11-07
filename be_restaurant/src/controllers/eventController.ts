import type { Request, Response, NextFunction } from "express";
import eventService from "../services/eventService";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";
import { AppConstants } from "../constants/AppConstants";

export const getAllEvents = async (
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

    const normalizeEvents = (items: any[]) =>
      items.map((event: any) =>
        typeof event?.toJSON === "function" ? event.toJSON() : event
      );

    if (req.query.all === "true") {
      const result = await eventService.findAll({
        order: [["created_at", "ASC"]],
      });

      const rawEvents = Array.isArray(result?.rows)
        ? result.rows
        : Array.isArray(result)
        ? result
        : [];

      const events = normalizeEvents(rawEvents);
      const total =
        typeof (result as any)?.count === "number"
          ? (result as any).count
          : events.length;
      const effectiveLimit = events.length > 0 ? events.length : limit;

      const paginated = buildPaginationResult(events, total, 1, effectiveLimit);
      return res.status(200).json({ status: "success", data: paginated });
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await eventService.findAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    const normalizedRows = normalizeEvents(rows);
    const result = buildPaginationResult(normalizedRows, count, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await eventService.findById(req.params.id);
    res.json({ status: "success", data: event });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await eventService.create(req.body);
    res.status(201).json({ status: "success", data: event });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await eventService.update(req.params.id, req.body);
    res.json({ status: "success", data: event });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await eventService.softDelete(req.params.id);
    res.json({ status: "success", message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
};
