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
}

export default new ChatMessageService()
