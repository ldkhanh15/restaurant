import { BaseService } from "./baseService";
import Dish from "../models/Dish";
import CategoryDish from "../models/CategoryDish";
import { Op, Sequelize } from "sequelize";
import { Ingredient } from "../models";
import { getRecommendedDishesLogic } from "../controllers/userBehaviorController";

class DishService extends BaseService<Dish> {
  constructor() {
    super(Dish);
  }

  async checkExistedName(name: string) {
    const existedDish = await this.model.findOne({
      where: {
        name: name,
        deleted_at: null,
      },
    });
    if (existedDish) return true;
    return false;
  }

  async findDishesByCategoryId(id: string) {
    return await this.model.findAndCountAll({
      where: { category_id: id },
      include: [{ model: CategoryDish, as: "category" }],
    });
  }

  async findCategoryByDishId(id: string) {
    return await this.findById(id, {
      include: [{ model: CategoryDish, as: "category" }],
    });
  }

  // Helper function to get recommended dishes as array
  async getRecommendedDishes(userId: string) {
    return await getRecommendedDishesLogic(userId);
  }

  async search(params: any, userId?: string) {
    // Get recommended dishes - assuming user_id is passed in params or default

    if (!userId) {
      const where: any = {};

      // --- Search/Name contains (case-insensitive, MySQL-safe) ---
      if (params.search || params.name) {
        const searchValue = (params.search || params.name).trim().toLowerCase();
        where[Op.and] = Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Dish.name")), // fix ambiguous column
          { [Op.like]: `%${searchValue}%` }
        );
      }

      // --- Other filters ---
      if (params.category_id) where.category_id = params.category_id;
      if (params.is_best_seller !== undefined)
        where.is_best_seller =
          params.is_best_seller === "true" || params.is_best_seller === true;
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
              ...(max !== undefined ? { [Op.lt]: Number(max) } : {}),
            },
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
          case "recommended":
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
        order:
          sortBy === "name"
            ? [[Sequelize.fn("LOWER", Sequelize.col("Dish.name")), sortOrder]] // sort name case-insensitive
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

    const recommendDishes = await this.getRecommendedDishes(userId);

    // Start with the full recommended dishes array
    let filteredDishes = [...recommendDishes];

    // if(params)

    // 🔍 Filter by search term (giống LIKE "%abc%" trong SQL)
    const searchTerm = params.search || params.name;
    if (searchTerm) {
      // Hàm bỏ dấu tiếng Việt
      const removeDiacritics = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Chuẩn hóa chuỗi tìm kiếm
      const normalizedSearch = removeDiacritics(
        searchTerm.toLowerCase().trim()
      );

      filteredDishes = filteredDishes.filter((dish: any) => {
        const dishName = removeDiacritics(dish.name.toLowerCase());
        // Kiểm tra giống SQL LIKE "%search%"
        return dishName.includes(normalizedSearch);
      });
    }

    // 2. Filter by category_id
    if (params.category_id) {
      filteredDishes = filteredDishes.filter(
        (dish) =>
          dish.category_id &&
          dish.category_id.toString() === params.category_id.toString()
      );
    }

    // 3. Filter by is_best_seller
    if (params.is_best_seller !== undefined) {
      const isBestSeller =
        params.is_best_seller === "true" || params.is_best_seller === true;
      filteredDishes = filteredDishes.filter(
        (dish) => dish.is_best_seller === isBestSeller
      );
    }

    // 4. Filter by seasonal
    if (params.seasonal !== undefined) {
      const isSeasonal = params.seasonal === "true" || params.seasonal === true;
      filteredDishes = filteredDishes.filter(
        (dish) => dish.seasonal === isSeasonal
      );
    }

    // 5. Filter by active
    if (params.active !== undefined) {
      const isActive = params.active === "true" || params.active === true;
      filteredDishes = filteredDishes.filter(
        (dish) => dish.active === isActive
      );
    }

    // 6. Filter by price
    if (params.price_ranges) {
      const ranges: { min: number; max?: number }[] = params.price_ranges
        .split(",")
        .map((r: string) => {
          const [min, max] = r.split("-").map(Number);
          return { min, max };
        });
      filteredDishes = filteredDishes.filter((dish) => {
        const price = Number(dish.price);
        return ranges.some((range) => {
          return (
            price >= range.min && (range.max === undefined || price < range.max)
          );
        });
      });
    } else {
      const minPrice = params.min_price || params.price_min;
      const maxPrice = params.max_price || params.price_max;
      const exactPrice = params.price_exact;

      if (
        minPrice !== undefined ||
        maxPrice !== undefined ||
        exactPrice !== undefined
      ) {
        filteredDishes = filteredDishes.filter((dish) => {
          const price = Number(dish.price);
          if (exactPrice !== undefined) {
            return price === Number(exactPrice);
          }
          if (minPrice !== undefined && price < Number(minPrice)) return false;
          if (maxPrice !== undefined && price >= Number(maxPrice)) return false;
          return true;
        });
      }
    }

    // 7. Sorting
    let sortBy = "priority_score"; // Default to recommendation priority
    let sortOrder: "ASC" | "DESC" = "DESC"; // DESC for priority_score

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

    // Sort the filtered dishes
    filteredDishes.sort((a: any, b: any) => {
      let aVal: any, bVal: any;

      if (sortBy === "name") {
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
      } else if (sortBy === "price") {
        aVal = Number(a.price || 0);
        bVal = Number(b.price || 0);
      } else {
        aVal = a[sortBy] || 0;
        bVal = b[sortBy] || 0;
      }

      if (sortOrder === "ASC") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    // 8. Pagination
    const page = params.page ? +params.page : 1;
    const limit = params.limit ? +params.limit : 10;
    const offset = (page - 1) * limit;
    const totalCount = filteredDishes.length;

    const paginatedRows = filteredDishes.slice(offset, offset + limit);

    // 9. Format rows (ensure price is number, keep includes if present)
    const formattedRows = paginatedRows.map((dish: any) => ({
      ...dish,
      price: Number(dish.price || 0),
    }));

    return {
      count: totalCount,
      rows: formattedRows,
      page,
      limit,
    };
  }
}

export default new DishService();
