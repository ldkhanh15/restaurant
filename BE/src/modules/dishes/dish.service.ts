import {
  Dish,
  CategoryDish,
  DishIngredient,
  Ingredient,
} from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  CreateDishDTO,
  UpdateDishDTO,
  DishFilterDTO,
} from "../../types/dtos/dish.dto";

export const DishService = {
  async list(filters?: DishFilterDTO) {
    return Dish.findAll({
      where: filters,
      include: [
        {
          model: CategoryDish,
          as: "categories",
        },
        {
          model: DishIngredient,
          as: "ingredients",
          include: [
            {
              model: Ingredient,
              attributes: ["id", "name", "unit"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });
  },

  async get(id: string) {
    return Dish.findByPk(id, {
      include: [
        {
          model: CategoryDish,
          as: "categories",
        },
        {
          model: DishIngredient,
          as: "ingredients",
          include: [
            {
              model: Ingredient,
              attributes: ["id", "name", "unit"],
            },
          ],
        },
      ],
    });
  },

  async create(payload: CreateDishDTO) {
    const id = payload.id || uuidv4();
    const { categories = [], ingredients = [], ...dishData } = payload;

    const dish = await Dish.create({
      id,
      ...dishData,
      created_at: new Date(),
    });

    if (categories.length > 0) {
      await dish.setCategories(categories);
    }

    if (ingredients.length > 0) {
      const dishIngredients = ingredients.map((item) => ({
        id: uuidv4(),
        dish_id: dish.id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        created_at: new Date(),
      }));
      await DishIngredient.bulkCreate(dishIngredients);
    }

    return this.get(dish.id);
  },

  async update(id: string, payload: UpdateDishDTO) {
    const dish = await Dish.findByPk(id);
    if (!dish) return null;

    const { categories, ingredients, ...dishData } = payload;

    await dish.update({
      ...dishData,
      updated_at: new Date(),
    });

    if (categories) {
      await dish.setCategories(categories);
    }

    if (ingredients) {
      await DishIngredient.destroy({ where: { dish_id: id } });
      const dishIngredients = ingredients.map((item) => ({
        id: uuidv4(),
        dish_id: id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        created_at: new Date(),
      }));
      await DishIngredient.bulkCreate(dishIngredients);
    }

    return this.get(id);
  },

  async delete(id: string) {
    const dish = await Dish.findByPk(id);
    if (!dish) return false;

    await DishIngredient.destroy({ where: { dish_id: id } });
    await dish.destroy();
    return true;
  },

  async toggleAvailability(id: string, isAvailable: boolean) {
    const dish = await Dish.findByPk(id);
    if (!dish) return null;
    await dish.update({ active: isAvailable });
    return this.get(id);
  },

  async updatePrice(id: string, price: number) {
    const dish = await Dish.findByPk(id);
    if (!dish) return null;
    await dish.update({ price });
    return this.get(id);
  },

  async searchByName(query: string) {
    return Dish.findAll({
      where: {
        name: { [Op.like]: `%${query}%` },
      },
      include: [
        {
          model: CategoryDish,
          as: "categories",
        },
      ],
    });
  },

  async getByCategory(categoryId: string) {
    return Dish.findAll({
      include: [
        {
          model: CategoryDish,
          as: "categories",
          where: { id: categoryId },
        },
      ],
    });
  },

  async getFeatured() {
    return Dish.findAll({
      where: { is_best_seller: true },
      include: [
        {
          model: CategoryDish,
          as: "categories",
        },
      ],
    });
  },

  async toggleFeatured(id: string) {
    const dish = await Dish.findByPk(id);
    if (!dish) return null;
    await dish.update({ is_best_seller: !dish.is_best_seller });
    return this.get(id);
  },
};
