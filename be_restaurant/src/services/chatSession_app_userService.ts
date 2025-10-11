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
}

export default new ChatSessionService()
