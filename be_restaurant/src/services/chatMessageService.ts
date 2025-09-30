import { BaseService } from "./baseService"
import ChatMessage from "../models/ChatMessage"

class ChatMessageService extends BaseService<ChatMessage> {
  constructor() {
    super(ChatMessage)
  }

  async findBySession(sessionId: number) {
    return await this.model.findAll({
      where: { sessionId },
      order: [["createdAt", "ASC"]],
    })
  }
}

export default new ChatMessageService()
