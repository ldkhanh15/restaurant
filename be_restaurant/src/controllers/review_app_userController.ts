import type { Request, Response, NextFunction } from "express"
import reviewService from "../services/reviewService"
import reviewAppUserService from "../services/review_app_userService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Prefer the app-user service which supports query params (page, limit, sort_by)
    const { page = 1, limit = 10 } = getPaginationParams(req.query)
    // map client's sort params to service's expected param (if provided)
    const sort_by = (req.query.sortBy as string) || undefined

    const { rows, count } = await reviewAppUserService.getReviews({
      sort_by,
      page: String(page),
      limit: String(limit),
    })

    const result = buildPaginationResult(rows, count, Number(page), Number(limit))
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
    // Ensure user is attached by authenticate middleware
    const user = (req as any).user
    if (!user || !user.id) return res.status(401).json({ status: "error", message: "Authentication required" })

    const created = await reviewAppUserService.createReview(user.id, req.body)
    res.status(201).json({ status: "success", data: created })
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