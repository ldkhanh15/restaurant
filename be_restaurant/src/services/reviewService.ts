import { BaseService } from "./baseService";
import Review from "../models/Review";
import User from "../models/User";
import { Dish, Order, OrderItem, Table } from "../models";

class ReviewService extends BaseService<Review> {
  constructor() {
    super(Review);
  }

  async findAllWithUser(options = {}) {
    return await this.findAll({
      ...options,
      include: [
        { model: User, as: "user", attributes: ["id", "username", "email"] },
        { model: Order, as: "order", attributes: ["id"] },
        { model: Dish, as: "dish", attributes: ["id", "name"] },
        { model: Table, as: "table", attributes: ["id", "table_number"] },
      ],
    });
  }
}

export default new ReviewService();
