import type { Request, Response, NextFunction } from "express"
import chatMessageService from "../services/chatMessageService"
import { AppError } from "../middlewares/errorHandler"
import chatSessionService from "../services/chatSessionService"
import { getIO } from "../sockets"

export const getMessagesBySession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await chatMessageService.findBySession(req.params.sessionId)
    res.json({ status: "success", data: messages })
  } catch (error) {
    next(error)
  }
}

export const getChatMessageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await chatMessageService.findById(req.params.id)
    res.json({ status: "success", data: message })
  } catch (error) {
    next(error)
  }
}

export const createChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as any
    const session = await chatSessionService.findById(payload.session_id)
    if (!session) throw new AppError("Chat session not found", 404)
    const message = await chatMessageService.create(payload)
    try {
      getIO().of("/chat").to(`session:${payload.session_id}`).emit("messageReceived", message)
    } catch { }
    res.status(201).json({ status: "success", data: message })
  } catch (error) {
    next(error)
  }
}

export const updateChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await chatMessageService.update(req.params.id, req.body)
    res.json({ status: "success", data: message })
  } catch (error) {
    next(error)
  }
}

export const deleteChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await chatMessageService.delete(req.params.id)
    res.json({ status: "success", message: "Chat message deleted successfully" })
  } catch (error) {
    next(error)
  }
}
