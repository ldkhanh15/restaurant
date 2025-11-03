import type { Request, Response, NextFunction } from "express";
import employeeService from "../services/employeeService";
import {
  getPaginationParams,
  buildPaginationResult,
} from "../utils/pagination";
import { Op } from "sequelize";
import User from "../models/User";

export const getAllEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.query.all === 'true') {
    const result = await employeeService.findAll({
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name"],
          },
        ],
      });
    const data =
    result?.rows && Array.isArray(result.rows)
      ? result.rows.map((employee: any) => employee.toJSON())
      : Array.isArray(result)
      ? result.map((employee: any) => employee.toJSON())
      : []

    const count = result?.count ?? data.length

    return res.status(200).json({
      status: "success",
      count,
      data,
    })
  }
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = getPaginationParams(req.query);
    const { search } = req.query;
    const offset = (page - 1) * limit;

    // Tạo object chứa điều kiện tìm kiếm
    const where: any = {};

    // Nếu có tham số search, thêm điều kiện tìm kiếm theo tên
    if (search) {
      where["$user.full_name$"] = { [Op.like]: `%${search}%` };
    }

    const { rows, count } = await employeeService.findAllWithUser({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      where, // Thêm điều kiện where vào query
    });

    const result = buildPaginationResult(rows, count, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employee = await employeeService.findByIdWithUser(req.params.id);
    res.json({ status: "success", data: employee });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employee = await employeeService.create(req.body);
    res.status(201).json({ status: "success", data: employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employee = await employeeService.update(req.params.id, req.body);
    res.json({ status: "success", data: employee });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await employeeService.delete(req.params.id);
    res.json({ status: "success", message: "Employee deleted successfully" });
  } catch (error) {
    next(error);
  }
};
