import { BaseService } from "./baseService"
import Dish from "../models/Dish"
import CategoryDish from "../models/CategoryDish"

class DishService extends BaseService<Dish> {
  constructor() {
    super(Dish)
  }

  async checkExistedName(name:string){
    const existedDish = await this.model.findOne({
      where:{
        name:name,
        deleted_at:null
      }
    })
    if(existedDish)
      return true;
    return false;
  }

  async findDishesByCategoryId(id: string) {
    return await this.model.findAndCountAll({
      where: { category_id: id },
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
