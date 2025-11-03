import { BaseService } from "./baseService"
import Ingredient from "../models/Ingredient"

class IngredientService extends BaseService<Ingredient> {
  constructor() {
    super(Ingredient)
  }

  async getAllIngredients(){
    return await this.model.findAndCountAll()
  }
}

export default new IngredientService()
