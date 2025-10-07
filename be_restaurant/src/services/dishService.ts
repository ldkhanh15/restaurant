import { BaseService } from "./baseService"
import Dish from "../models/Dish"
import CategoryDish from "../models/CategoryDish"

class DishService extends BaseService<Dish> {
  constructor() {
    super(Dish)
  }

  async findDishesByCategoryId(id: string, options?: any) {
    return await this.findAll({
      ...options,
      where: {
        category_id: id,
        deleted_at: null,
      },
      include: [{ model: CategoryDish, as: "category" }],
  })
}

  async findCategoryByDishId(id: string) {
    return await this.findById(id, {
      include: [{ model: CategoryDish, as: "category" }],
    })
  }
}

export default new DishService()
