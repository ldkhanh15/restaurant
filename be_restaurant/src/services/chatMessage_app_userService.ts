import { BaseService } from "./baseService"
import ChatMessage from "../models/ChatMessage"

class ChatMessageService extends BaseService<ChatMessage> {
  constructor() {
    super(ChatMessage)
  }

  async findBySession(sessionId: string) {
    return await this.model.findAll({
      where: { session_id: sessionId },
      order: [["createdAt", "ASC"]],
    })
  }

  async createForSession(sessionId: string, senderType: "user" | "bot" | "human", messageText: string) {
    return await this.create({ session_id: sessionId, sender_type: senderType, message_text: messageText })
  }

  // Fetch latest N messages for a session (pagination support)
  async fetchLatest(sessionId: string, limit = 50, offset = 0) {
    return await this.model.findAll({
      where: { session_id: sessionId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })
  }
}

export default new ChatMessageService()
