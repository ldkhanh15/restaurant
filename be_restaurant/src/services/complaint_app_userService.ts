import { BaseService } from "./baseService"
import Complaint from "../models/Complaint"
import User from "../models/User"

class ComplaintService extends BaseService<Complaint> {
  constructor() {
    super(Complaint)
  }

  async findAllWithUser(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: User, as: "user" }],
    })
  }
}

export default new ComplaintService()
