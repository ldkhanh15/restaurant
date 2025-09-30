import { DishIngredient } from "../../models/index";
import { getIO } from "../../sockets/io";

// created_by_cursor: true
export const DishIngredientService = {
    async list() {
        return DishIngredient.findAll();
    },

    async create(payload: { dish_id: string; ingredient_id: string; quantity: number; }) {
        const item = await DishIngredient.create(payload as any);
        getIO().emit("dish-ingredient-created", item);
        return item;
    },

    async remove(dish_id: string, ingredient_id: string) {
        const deleted = await DishIngredient.destroy({ where: { dish_id, ingredient_id } });
        if (deleted) getIO().emit("dish-ingredient-deleted", { dish_id, ingredient_id });
        return deleted > 0;
    },
}; 