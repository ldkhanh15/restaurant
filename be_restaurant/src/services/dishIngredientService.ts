import { BaseService } from "./baseService"
import DishIngredient from "../models/DishIngredient"
import Dish from "../models/Dish"
import Ingredient from "../models/Ingredient"

class DishIngredientService extends BaseService<DishIngredient> {
  constructor() {
    super(DishIngredient)
  }

  async findAllWithDetails(options?: any) {
    return await this.findAll({
      ...options,
      include: [
        { model: Dish, as: "dish" },
        { model: Ingredient, as: "ingredient" },
      ],
    })
  }
}

export default new DishIngredientService()
