import type { Request, Response, NextFunction } from "express";
import Dish from "../models/Dish";
import CategoryDish from "../models/CategoryDish";
import { AppError } from "../middlewares/errorHandler";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";
import dishService from "../services/dishService";
import dishIngredientService from "../services/dishIngredientService";
import { DishIngredient, Ingredient } from "../models";
import express from "express";
import multer from "multer";
import cloudService, {
  uploadImageToCloudinary,
} from "../services/cloudService";

export const getAllDishes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hasSearchParams = [
      "recommended",
      "name",
      "category_id",
      "is_best_seller",
      "sort",
      "seasonal",
      "active",
      "price_min",
      "price_max",
      "price_exact",
      "price_ranges",
    ].some((param) => param in req.query);

    console.log("Has search params:", req);
    const { page = 1, limit = 10 } = getPaginationParams(req.query);
    console.log("Using search functionality with recommended sorting");

    // --- Lấy kết quả tìm kiếm (các món đã lọc) ---
    const { count, rows } = await dishService.search(
      req.query,
      req.user?.id ?? "c10a35d6-55e7-4fc7-95c7-5fe517f568d7"
    );

    console.log("Search result count:", rows);

    // --- Phân trang như cũ ---
    const result = buildPaginationResult(rows, count, +page, +limit);

    return res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDishesByCategoryId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await dishService.findDishesByCategoryId(req.params.id);

    const data =
      result?.rows && Array.isArray(result.rows)
        ? result.rows.map((dish: any) => dish.toJSON())
        : Array.isArray(result)
        ? result.map((dish: any) => dish.toJSON())
        : [];

    const count = result?.count ?? data.length;

    res.status(200).json({
      status: "success",
      count,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getIngredientsByDishId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "ASC",
    } = getPaginationParams(req.query);

    const offset = (page - 1) * limit;

    const { rows, count } = await dishIngredientService.findAllWithDetails(
      req.params.id,
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

export const getDishById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dish = await dishService.getById(req.params.id);

    if (!dish) {
      throw new AppError("Dish not found", 404);
    }

    res.json({ status: "success", data: dish });
  } catch (error) {
    next(error);
  }
};

export const createDish = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ingredients = JSON.parse(req.body.ingredients);
    const dishData = JSON.parse(req.body.dishData);
    const file = req.file;
    if (!file) {
      res.status(200).json({ status: "error", message: "Thiếu file hình ảnh" });
      return;
    }
    const uploadResult = await uploadImageToCloudinary(file.path, "dish");
    dishData.media_urls = [uploadResult.secure_url];

    if (await dishService.checkExistedName(dishData.name)) {
      res
        .status(200)
        .json({ status: "existed", message: "Tên món ăn đã tồn tại" });
      return;
    }

    ingredients.ingredients.forEach((ing: any) => {
      if (!ing.ingredient_id) {
        throw new AppError("Mỗi nguyên liệu phải có ID", 400);
      }
      if (!ing.quantity || ing.quantity <= 0) {
        throw new AppError("Mỗi nguyên liệu phải có số lượng > 0", 400);
      }
    });

    const dish = await Dish.create(dishData);
    await dishIngredientService.addOrUpdateIngredientToDish(
      dish.id,
      ingredients.ingredients
    );

    res.status(201).json({ status: "success", data: dish });
  } catch (error) {
    next(error);
  }
};

export const upsertIngredientToDish = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dishId, ingredients } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new AppError("Nhập 1 mảng nguyên liệu", 400);
    }

    ingredients.forEach((ing: any) => {
      if (!ing.ingredient_id) {
        throw new AppError("Mỗi nguyên liệu phải có ID", 400);
      }
      if (!ing.quantity || ing.quantity <= 0) {
        throw new AppError("Mỗi nguyên liệu phải có số lượng > 0", 400);
      }
    });

    await dishIngredientService.addOrUpdateIngredientToDish(
      dishId,
      ingredients
    );

    res
      .status(201)
      .json({ status: "success", message: "Thêm/cập nhật thành công" });
  } catch (error) {
    next(error);
  }
};

export const updateDish = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dish = await Dish.findByPk(req.params.id);

    if (!dish) {
      throw new AppError("Dish not found", 404);
    }
    const file = req.file;
    const updateData: any = { ...req.body };
    // Nếu front gửi JSON dạng string trong multipart -> parse lại
    if (typeof updateData.media_urls === "string") {
      try {
        updateData.media_urls = JSON.parse(updateData.media_urls);
      } catch {}
    }
    if (file) {
      const uploadResult = await uploadImageToCloudinary(file.path, "dish");
      updateData.media_urls = [uploadResult.secure_url];
    }
    await dish.update(updateData);
    res.json({ status: "success", data: dish });
  } catch (error) {
    next(error);
  }
};

export const deleteDish = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dish = await Dish.findByPk(req.params.id);

    if (!dish) {
      throw new AppError("Dish not found", 404);
    }

    await dish.destroy();
    res.json({ status: "success", message: "Dish deleted successfully" });
  } catch (error) {
    next(error);
  }
};
