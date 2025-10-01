import type { Request, Response, NextFunction } from "express"
import attendanceLogService from "../services/attendanceLogService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllAttendanceLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await attendanceLogService.findAllWithEmployee({
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    })

    const result = buildPaginationResult(rows, count, page, limit)
    res.json({ status: "success", data: result })
  } catch (error) {
    next(error)
  }
}

export const getAttendanceLogById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await attendanceLogService.findById(req.params.id)
    res.json({ status: "success", data: log })
  } catch (error) {
    next(error)
  }
}

export const createAttendanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await attendanceLogService.create(req.body)
    res.status(201).json({ status: "success", data: log })
  } catch (error) {
    next(error)
  }
}

export const updateAttendanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await attendanceLogService.update(req.params.id, req.body)
    res.json({ status: "success", data: log })
  } catch (error) {
    next(error)
  }
}

export const deleteAttendanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await attendanceLogService.delete(req.params.id)
    res.json({ status: "success", message: "Attendance log deleted successfully" })
  } catch (error) {
    next(error)
  }
}
