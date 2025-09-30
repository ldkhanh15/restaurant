import { DishAttributes } from "../../models/dish.model";
import { DishIngredientAttributes } from "../../models/dishIngredient.model";

export interface CreateDishDTO {
  name: string;
  description?: string;
  price: number;
  category_id: string;
  media_urls?: object;
  is_best_seller?: boolean;
  seasonal?: boolean;
  active?: boolean;
  categories?: string[];
  ingredients?: CreateDishIngredientDTO[];
}

export interface UpdateDishDTO extends Partial<CreateDishDTO> {}

export interface CreateDishIngredientDTO {
  ingredient_id: string;
  quantity: number;
}

export interface DishFilterDTO {
  category_id?: string;
  is_best_seller?: boolean;
  seasonal?: boolean;
  active?: boolean;
  name?: string;
}
