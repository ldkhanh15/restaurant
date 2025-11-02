import { BaseService } from "./baseService"
import ChatSession from "../models/ChatSession"
import User from "../models/User"

class ChatSessionService extends BaseService<ChatSession> {
  constructor() {
    super(ChatSession)
  }

  async findAllWithUser(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: User, as: "user" }],
    })
  }

  // Find active session for a user (if any)
  async findActiveByUser(userId: string) {
    return await this.findOne({ user_id: userId, status: "active" })
  }

  // Find or create an active session for a user. Useful when a user starts chatting.
  async findOrCreateForUser(userId: string, channel: "web" | "app" | "zalo" = "app", context?: any) {
    try {
      const existing = await this.findActiveByUser(userId)
      if (existing) return existing

      console.info('[chat.session] findOrCreateForUser -> creating session for user', userId)
      const created = await this.create({
        user_id: userId,
        is_authenticated: true,
        channel,
        context: context ?? {},
        start_time: new Date(),
        status: "active",
        handled_by: "bot",
      })
      try { console.info('[chat.session] created session', (created as any).id) } catch {}
      return created
    } catch (err) {
      const e: any = err
      console.error('[chat.session] findOrCreateForUser error:', e && (e.stack || e.message || e))
      try { if (e && e.parent) console.error('[chat.session] sequelize parent error:', e.parent) } catch {}
      throw err
    }
  }

  // Close a session (mark end_time and status)
  async closeSession(sessionId: string) {
    const session = await this.findById(sessionId)
    await session.update({ status: "closed", end_time: new Date() })
    return session
  }

  // Mark that a human agent has taken over the session
  async markHandledByHuman(sessionId: string) {
    const session = await this.findById(sessionId)
    await session.update({ handled_by: "human" })
    return session
  }
}

export default new ChatSessionService()
