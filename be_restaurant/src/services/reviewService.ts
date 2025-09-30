import { BaseService } from "./baseService"
import Review from "../models/Review"
import User from "../models/User"

class ReviewService extends BaseService<Review> {
  constructor() {
    super(Review)
  }

  async findAllWithUser(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: User, as: "user" }],
    })
  }
}

export default new ReviewService()
