import { BaseService } from "./baseService"
import UserBehaviorLog from "../models/UserBehaviorLog"

class UserBehaviorLogService extends BaseService<UserBehaviorLog> {
  constructor() {
    super(UserBehaviorLog)
  }

  async findByUser(userId: number, options?: any) {
    return await this.model.findAll({
      where: { userId },
      ...options,
      order: [["createdAt", "DESC"]],
    })
  }
}

export default new UserBehaviorLogService()
