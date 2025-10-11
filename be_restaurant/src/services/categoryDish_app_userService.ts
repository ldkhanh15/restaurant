import { BaseService } from "./baseService"
import CategoryDish from "../models/CategoryDish"

class CategoryDishService extends BaseService<CategoryDish> {
  constructor() {
    super(CategoryDish)
  }
}

export default new CategoryDishService()
