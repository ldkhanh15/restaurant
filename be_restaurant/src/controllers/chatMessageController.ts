import type { Request, Response, NextFunction } from "express"
import chatMessageService from "../services/chatMessageService"

export const getMessagesBySession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await chatMessageService.findBySession(Number(req.params.sessionId))
    res.json({ status: "success", data: messages })
  } catch (error) {
    next(error)
  }
}

export const getChatMessageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await chatMessageService.findById(Number(req.params.id))
    res.json({ status: "success", data: message })
  } catch (error) {
    next(error)
  }
}

export const createChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await chatMessageService.create(req.body)
    res.status(201).json({ status: "success", data: message })
  } catch (error) {
    next(error)
  }
}

export const updateChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await chatMessageService.update(Number(req.params.id), req.body)
    res.json({ status: "success", data: message })
  } catch (error) {
    next(error)
  }
}

export const deleteChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await chatMessageService.delete(Number(req.params.id))
    res.json({ status: "success", message: "Chat message deleted successfully" })
  } catch (error) {
    next(error)
  }
}
