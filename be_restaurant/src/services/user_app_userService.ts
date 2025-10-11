import { BaseService } from "./baseService"
import User from "../models/User"
import { FindOptions } from "sequelize"

class UserAppUserService extends BaseService<User> {
  constructor() {
    super(User)
  }

  /**
   * Find all users but exclude password hash
   * @param options - Sequelize find options
   */
  async findAllUsers(options?: FindOptions) {
    return await this.findAll({
      ...options,
      attributes: { exclude: ["password_hash"] },
    })
  }
}

export default new UserAppUserService()