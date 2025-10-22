import type { Request, Response, NextFunction } from "express"
import chatMessageService from "../services/chatMessage_app_userService"
import chatSessionService from "../services/chatSession_app_userService"
import { getIO } from "../sockets"

export const getMessagesBySession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId
    const messages = await chatMessageService.findBySession(sessionId)
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
    const payload: any = { ...req.body }

    // Ensure session exists. If sessionId provided, verify; otherwise, if user authenticated, find or create.
    let sessionId = payload.session_id as string | undefined
    if (!sessionId) {
      const userId = req.user?.id as string | undefined
      if (userId) {
        const session = await chatSessionService.findOrCreateForUser(userId, 'app', {})
        sessionId = session.id
      } else {
        // no session and not authenticated -> create anonymous session
        const anon = await chatSessionService.create({ channel: 'app', is_authenticated: false, context: {} })
        sessionId = anon.id
      }
    } else {
      // validate session exists
      try {
        await chatSessionService.findById(sessionId)
      } catch {
        const anon = await chatSessionService.create({ channel: 'app', is_authenticated: false, context: {} })
        sessionId = anon.id
      }
    }

    const senderType = (payload.sender_type as 'user' | 'bot' | 'human') ?? (req.user ? 'user' : 'user')
    const messageText = String(payload.message_text ?? payload.text ?? '')

    const message = await chatMessageService.createForSession(sessionId, senderType, messageText)

    // Emit socket event to chat namespace for realtime updates
    try {
      getIO().of('/chat').to(`session:${sessionId}`).emit('messageReceived', message)
    } catch {}

    res.status(201).json({ status: 'success', data: message })
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
