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
    // Detailed diagnostic logs: headers, raw body, and inferred auth
    try {
      console.info('[chat] createChatMessage called')
      console.info('[chat] headers:', JSON.stringify(req.headers))
    } catch {}
    try { console.info('[chat] raw body:', JSON.stringify(req.body)) } catch {}
    try { console.info('[chat] inferred user:', req.user ? JSON.stringify(req.user) : 'none') } catch {}

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

  // Create and log detailed result
  let message: any = null
  try {
    message = await chatMessageService.createForSession(sessionId, senderType, messageText)
    try {
      const out = message && typeof message === 'object' ? JSON.stringify((message as any).toJSON ? (message as any).toJSON() : message) : String(message)
      console.info('[chat] chatMessageService.createForSession result:', out)
    } catch {
      console.info('[chat] chatMessageService.createForSession created (non-serializable)')
    }
  } catch (err) {
    const e: any = err
    console.error('[chat] chatMessageService.createForSession threw error:', e && (e.stack || e.message || e))
    throw e
  }

  // Normalize message object
  const msgObj = (message as any).toJSON ? (message as any).toJSON() : message

    // If request has authenticated user, attach sender info for convenience
    if (req.user && req.user.id) {
      try {
        const user = await (await import("../models/User")).default.findByPk(req.user.id, { attributes: ["id", "full_name"] })
        if (user) {
          msgObj.sender = { id: user.id, full_name: (user as any).full_name, name: (user as any).full_name }
        }
      } catch {}
    }

    // Emit socket event to chat namespace for realtime updates (support both room formats)
    try {
      const nsp = getIO().of('/chat')
      nsp.to(`session:${sessionId}`).emit('messageReceived', msgObj)
      nsp.to(`session_${sessionId}`).emit('messageReceived', msgObj)
    } catch {}

    res.status(201).json({ status: 'success', data: msgObj })
  } catch (error) {
    const e: any = error
    console.error('[chat] createChatMessage error:', e && (e.stack || e.message || e))
    // If Sequelize exposes parent or original error (SQL), log it too
    try { if (e && e.parent) console.error('[chat] sequelize parent error:', e.parent) } catch {}
    try { if (e && e.original) console.error('[chat] sequelize original error:', e.original) } catch {}
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
