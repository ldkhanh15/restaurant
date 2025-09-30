import type { Request, Response, NextFunction } from "express"
import chatSessionService from "../services/chatSessionService"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllChatSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req.query)
    const offset = (page - 1) * limit

    const { rows, count } = await chatSessionService.findAllWithUser({
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

export const getChatSessionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await chatSessionService.findById(Number(req.params.id))
    res.json({ status: "success", data: session })
  } catch (error) {
    next(error)
  }
}

export const createChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await chatSessionService.create(req.body)
    res.status(201).json({ status: "success", data: session })
  } catch (error) {
    next(error)
  }
}

export const updateChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await chatSessionService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: session })
  } catch (error) {
    next(error)
  }
}

export const deleteChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await chatSessionService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Chat session deleted successfully" })
  } catch (error) {
    next(error)
  }
}
