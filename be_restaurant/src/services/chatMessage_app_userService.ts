import { BaseService } from "./baseService"
import ChatMessage from "../models/ChatMessage"

class ChatMessageService extends BaseService<ChatMessage> {
  constructor() {
    super(ChatMessage)
  }

  async findBySession(sessionId: string) {
    return await this.model.findAll({
      where: { session_id: sessionId },
      order: [["timestamp", "ASC"]],
    })
  }

  async createForSession(sessionId: string, senderType: "user" | "bot" | "human", messageText: string) {
    try {
      console.info('[chat.service] createForSession -> creating message', { sessionId, senderType, messageText })
      const created = await this.create({ session_id: sessionId, sender_type: senderType, message_text: messageText })
      try { console.info('[chat.service] createForSession -> created', created && (created as any).id ? (created as any).id : created) } catch {}
      return created
    } catch (err) {
      const e: any = err
      console.error('[chat.service] createForSession error:', e && (e.stack || e.message || e))
      try { if (e && e.parent) console.error('[chat.service] sequelize parent error:', e.parent) } catch {}
      try { if (e && e.original) console.error('[chat.service] sequelize original error:', e.original) } catch {}
      throw err
    }
  }

  // Fetch latest N messages for a session (pagination support)
  async fetchLatest(sessionId: string, limit = 50, offset = 0) {
    return await this.model.findAll({
      where: { session_id: sessionId },
      order: [["timestamp", "DESC"]],
      limit,
      offset,
    })
  }
}

export default new ChatMessageService()
