import type { Request, Response, NextFunction } from "express"
import blogPostService from "../services/blogPostService"
// local slugify to avoid external dep
const localSlugify = (input: string) =>
  String(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
import { AppError } from "../middlewares/errorHandler"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllBlogPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
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
    const post = await blogPostService.findById(req.params.id)
    res.json({ status: "success", data: post })
  } catch (error) {
    next(error)
  }
}

export const createBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = { ...req.body }
    if (!body.slug && body.title) {
      body.slug = localSlugify(String(body.title))
    }
    body.author_id = req.user?.id
    const post = await blogPostService.create(body)
    res.status(201).json({ status: "success", data: post })
  } catch (error) {
    next(error)
  }
}

export const updateBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = { ...req.body }
    if (body.title && !body.slug) {
      body.slug = localSlugify(String(body.title))
    }
    const post = await blogPostService.update(req.params.id, body)
    res.json({ status: "success", data: post })
  } catch (error) {
    next(error)
  }
}

export const deleteBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await blogPostService.delete(req.params.id)
    res.json({ status: "success", message: "Blog post deleted successfully" })
  } catch (error) {
    next(error)
  }
}
