import type { Request, Response, NextFunction } from "express"
import reviewService from "../services/reviewService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
    const offset = (page - 1) * limit
    const { rows, count } = await reviewService.findAllWithUser({
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

export const getReviewById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await reviewService.findById(req.params.id)
    res.json({ status: "success", data: review })
  } catch (error) {
    next(error)
  }
}

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await reviewService.create(req.body)
    res.status(201).json({ status: "success", data: review })
  } catch (error) {
    next(error)
  }
}

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await reviewService.update(req.params.id, req.body)
    res.json({ status: "success", data: review })
  } catch (error) {
    next(error)
  }
}

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reviewService.delete(req.params.id)
    res.json({ status: "success", message: "Review deleted successfully" })
  } catch (error) {
    next(error)
  }
}