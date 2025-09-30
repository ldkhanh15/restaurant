import { BaseService } from "./baseService"
import Dish from "../models/Dish"
import CategoryDish from "../models/CategoryDish"

class DishService extends BaseService<Dish> {
  constructor() {
    super(Dish)
  }

  async findAllWithCategory(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: CategoryDish, as: "category" }],
    })
  }

  async findByIdWithCategory(id: number) {
    return await this.findById(id, {
      include: [{ model: CategoryDish, as: "category" }],
    })
  }
}

export default new DishService()
