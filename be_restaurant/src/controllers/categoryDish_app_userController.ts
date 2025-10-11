import type { Request, Response, NextFunction } from "express";
import categoryDishService from "../services/categoryDishService";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit;

    const { rows, count } = await categoryDishService.findAll({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    const result = buildPaginationResult(rows, count, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryDishService.findById(req.params.id);
    res.json({ status: "success", data: category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryDishService.create(req.body);
    res.status(201).json({ status: "success", data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryDishService.update(
      req.params.id,
      req.body
    );
    res.json({ status: "success", data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await categoryDishService.delete(req.params.id);
    res.json({ status: "success", message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};
