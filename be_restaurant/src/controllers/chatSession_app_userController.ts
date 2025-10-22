import type { Request, Response, NextFunction } from "express"
import chatSessionService from "../services/chatSession_app_userService"
import chatMessageService from "../services/chatMessage_app_userService"
import { getIO } from "../sockets"
import { getPaginationParams, buildPaginationResult } from "../utils/pagination"

export const getAllChatSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = getPaginationParams(req.query)
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
    const session = await chatSessionService.findById(req.params.id)
    res.json({ status: "success", data: session })
  } catch (error) {
    next(error)
  }
}

export const createChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If user is authenticated, attach user and create/find active session
    const userId = req.user?.id as string | undefined
    const channel = (req.body.channel as any) ?? "app"
    const context = req.body.context ?? {}

    let session
    if (userId) {
      session = await chatSessionService.findOrCreateForUser(userId, channel, context)
    } else {
      // create anonymous session
      session = await chatSessionService.create({ channel, context, is_authenticated: false })
    }

    res.status(201).json({ status: "success", data: session })
  } catch (error) {
    next(error)
  }
}

export const updateChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await chatSessionService.update(req.params.id, req.body)
    res.json({ status: "success", data: session })
  } catch (error) {
    next(error)
  }
}

export const deleteChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await chatSessionService.delete(req.params.id)
    res.json({ status: "success", message: "Chat session deleted successfully" })
  } catch (error) {
    next(error)
  }
}
