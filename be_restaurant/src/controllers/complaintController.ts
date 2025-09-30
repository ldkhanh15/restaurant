import type { Request, Response, NextFunction } from "express"
import complaintService from "../services/complaintService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllComplaints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await complaintService.findAllWithUser({
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

export const getComplaintById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaint = await complaintService.findById(Number(req.params.id))
    res.json({ status: "success", data: complaint })
  } catch (error) {
    next(error)
  }
}

export const createComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaint = await complaintService.create(req.body)
    res.status(201).json({ status: "success", data: complaint })
  } catch (error) {
    next(error)
  }
}

export const updateComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaint = await complaintService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: complaint })
  } catch (error) {
    next(error)
  }
}

export const deleteComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await complaintService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Complaint deleted successfully" })
  } catch (error) {
    next(error)
  }
}
