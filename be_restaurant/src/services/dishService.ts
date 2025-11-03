import { BaseService } from "./baseService"
import Dish from "../models/Dish"
import CategoryDish from "../models/CategoryDish"
import { Op } from "sequelize"
import { Ingredient } from "../models"

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

  async search(params: any) {
    const where: any = {}

    if (params.name) {
      where.name = { [Op.like]: `%${params.name}%` }
    }
    if (params.category_id) {
      where.category_id = params.category_id
    }
    if (params.is_best_seller !== undefined) {
      where.is_best_seller = params.is_best_seller === "true" || params.is_best_seller === true
    }
    if (params.seasonal !== undefined) {
      where.seasonal = params.seasonal === "true" || params.seasonal === true
    }
    if (params.active !== undefined) {
      where.active = params.active === "true" || params.active === true
    }
    if (params.price_min || params.price_max || params.price_exact) {
      where.price = {}
    
      // Giá chính xác (ưu tiên cao nhất)
      if (params.price_exact) {
        where.price = +params.price_exact
      } else {
        // Trong khoảng
        if (params.price_min) where.price[Op.gte] = +params.price_min
        if (params.price_max) where.price[Op.lte] = +params.price_max
      }
    }

    const page = params.page ? +params.page : 1
    const limit = params.limit ? +params.limit : 10
    const offset = (page - 1) * limit
    const sortBy = params.sortBy || "created_at"
    const sortOrder = (params.sortOrder || "ASC").toUpperCase()

    const { count, rows } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: CategoryDish, as: "category" },
        {
          model: Ingredient,
          as: "ingredients",
          through: { attributes: ["quantity"] },
        },
      ],
    })

    return { count, rows, page, limit }
  }
}

export default new DishService()
