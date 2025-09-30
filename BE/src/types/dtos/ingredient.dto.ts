import { IngredientAttributes } from "../../models/ingredient.model";

export interface CreateIngredientDTO {
  name: string;
  description?: string;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  minimum_stock?: number;
  maximum_stock?: number;
  supplier_id?: string;
  storage_location?: string;
  category?: string;
  perishable?: boolean;
  expiry_date?: Date;
  notes?: string;
}

export interface UpdateIngredientDTO extends Partial<CreateIngredientDTO> {}

export interface IngredientStockAdjustmentDTO {
  ingredient_id: string;
  adjustment_type: "increment" | "decrement";
  quantity: number;
  reason?: string;
  reference_id?: string;
  reference_type?: string;
  adjusted_by?: string;
}
