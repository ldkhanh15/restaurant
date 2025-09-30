import type { Request, Response, NextFunction } from "express"
import blogPostService from "../services/blogPostService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllBlogPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await blogPostService.findAll({
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

export const getPublishedBlogPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await blogPostService.findPublishedPosts()
    res.json({ status: "success", data: posts })
  } catch (error) {
    next(error)
  }
}

export const getBlogPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await blogPostService.findById(Number(req.params.id))
    res.json({ status: "success", data: post })
  } catch (error) {
    next(error)
  }
}

export const createBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await blogPostService.create(req.body)
    res.status(201).json({ status: "success", data: post })
  } catch (error) {
    next(error)
  }
}

export const updateBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await blogPostService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: post })
  } catch (error) {
    next(error)
  }
}

export const deleteBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await blogPostService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Blog post deleted successfully" })
  } catch (error) {
    next(error)
  }
}
