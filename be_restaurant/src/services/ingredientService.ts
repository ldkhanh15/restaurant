import { BaseService } from "./baseService"
import Ingredient from "../models/Ingredient"

class IngredientService extends BaseService<Ingredient> {
  constructor() {
    super(Ingredient)
  }
}

export default new IngredientService()
