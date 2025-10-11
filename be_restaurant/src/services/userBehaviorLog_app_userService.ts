import { BaseService } from "./baseService"
import UserBehaviorLog from "../models/UserBehaviorLog"

class UserBehaviorLogService extends BaseService<UserBehaviorLog> {
  constructor() {
    super(UserBehaviorLog)
  }

  async findByUser(userId: string, options?: any) {
    return await this.model.findAll({
      where: { user_id: userId },
      ...options,
      order: [["createdAt", "DESC"]],
    })
}
}
export default new UserBehaviorLogService()
