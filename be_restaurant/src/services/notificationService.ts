import { BaseService } from "./baseService"
import Notification from "../models/Notification"
import User from "../models/User"

class NotificationService extends BaseService<Notification> {
  constructor() {
    super(Notification)
  }

  async findAllWithUser(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: User, as: "user" }],
    })
  }

  async findUnreadByUser(userId: string) {
    return await this.model.findAll({
      where: { userId, isRead: false },
      order: [["createdAt", "DESC"]],
    })
  }
}

export default new NotificationService()
