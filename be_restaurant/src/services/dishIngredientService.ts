import { BaseService } from "./baseService"
import DishIngredient from "../models/DishIngredient"
import Dish from "../models/Dish"
import Ingredient from "../models/Ingredient"

class DishIngredientService extends BaseService<DishIngredient> {
  constructor() {
    super(DishIngredient)
  }

  async addOrUpdateIngredientToDish(
    dishId: string,
    ingredients: { ingredient_id: string; quantity: number }[]
  ) {
    const { rows } = await this.findAll({
      where: { dish_id: dishId },
      attributes: ["ingredient_id"],
    });

    const existingIds = rows.map((e: any) => e.ingredient_id);

    const toUpsert = ingredients.map((ing) => ({
      dish_id: dishId,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
    }));

    await this.model.bulkCreate(toUpsert, {
      updateOnDuplicate: ["quantity"],
    });

    const newIds = ingredients.map((ing) => ing.ingredient_id);
    const toRemove = existingIds.filter((id: string) => !newIds.includes(id));

    if (toRemove.length > 0) {
      await this.model.destroy({
        where: {
          dish_id: dishId,
          ingredient_id: toRemove,
        },
      });
    }

    return { success: true };
  }



  async findAllWithDetails(id:string, options?: any) {
    return await this.findAll({
      ...options,
      where: {
        dish_id: id,
        deleted_at: null,
      },
      include: [
        { model: Dish, as: "dish" },
        { model: Ingredient, as: "ingredient" },
      ],
    })
  }
}

export default new DishIngredientService()
