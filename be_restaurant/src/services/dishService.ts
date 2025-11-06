import { BaseService } from "./baseService"
import Dish from "../models/Dish"
import CategoryDish from "../models/CategoryDish"
import { Op, Sequelize } from "sequelize"
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
    const where: any = {};

    // --- Search/Name contains (case-insensitive, MySQL-safe) ---
    if (params.search || params.name) {
      const searchValue = (params.search || params.name).trim().toLowerCase();
      where[Op.and] = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('Dish.name')), // fix ambiguous column
        { [Op.like]: `%${searchValue}%` }
      );
    }

    // --- Other filters ---
    if (params.category_id) where.category_id = params.category_id;
    if (params.is_best_seller !== undefined)
      where.is_best_seller = params.is_best_seller === "true" || params.is_best_seller === true;
    if (params.seasonal !== undefined)
      where.seasonal = params.seasonal === "true" || params.seasonal === true;
    if (params.active !== undefined)
      where.active = params.active === "true" || params.active === true;

    // --- Price filtering (convert to number) ---
    if (params.price_ranges) {
      const ranges = params.price_ranges.split(",").map((r: string) => {
        const [min, max] = r.split("-").map(Number);
        return {
          price: {
            [Op.gte]: Number(min),
            ...(max !== undefined ? { [Op.lt]: Number(max) } : {})
          }
        };
      });
      where[Op.or] = ranges;
    } else {
      const minPrice = params.min_price || params.price_min;
      const maxPrice = params.max_price || params.price_max;
      const exactPrice = params.price_exact;

      if (minPrice || maxPrice || exactPrice) {
        where.price = {};
        if (exactPrice) {
          where.price = Number(exactPrice);
        } else {
          if (minPrice !== undefined) where.price[Op.gte] = Number(minPrice);
          if (maxPrice !== undefined) where.price[Op.lt] = Number(maxPrice);
        }
      }
    }

    // --- Pagination ---
    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;
    const offset = (page - 1) * limit;

    // --- Sorting (FE-friendly + backward compatible) ---
    let sortBy = "created_at";
    let sortOrder: "ASC" | "DESC" = "ASC";

    if (params.sort) {
      switch (params.sort) {
        case "price_asc":
          sortBy = "price";
          sortOrder = "ASC";
          break;
        case "price_desc":
          sortBy = "price";
          sortOrder = "DESC";
          break;
        case "name":
          sortBy = "name";
          sortOrder = "ASC";
          break;
        default:
          // backward compatible: -price, price, -created_at
          if (params.sort.startsWith("-")) {
            sortBy = params.sort.substring(1);
            sortOrder = "DESC";
          } else {
            sortBy = params.sort;
            sortOrder = "ASC";
          }
      }
    } else if (params.sortBy) {
      sortBy = params.sortBy;
      sortOrder = (params.sortOrder || "ASC").toUpperCase() as "ASC" | "DESC";
    }

    // --- Query to DB ---
    const { count, rows } = await this.model.findAndCountAll({
      where,
      distinct: true,
      limit,
      offset,
      order: sortBy === "name"
        ? [[Sequelize.fn('LOWER', Sequelize.col('Dish.name')), sortOrder]] // sort name case-insensitive
        : [[sortBy, sortOrder]],
      include: [
        { model: CategoryDish, as: "category" },
        {
          model: Ingredient,
          as: "ingredients",
          through: { attributes: ["quantity"] },
        },
      ],
    });

    // --- Convert price to number ---
    const formattedRows = rows.map((r: any) => ({
      ...r.get({ plain: true }),
      price: Number(r.price),
    }));

    return { count, rows: formattedRows, page, limit };
  }
}

export default new DishService()
