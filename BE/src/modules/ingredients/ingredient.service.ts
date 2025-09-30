import { Ingredient, Supplier } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  CreateIngredientDTO,
  UpdateIngredientDTO,
  IngredientStockAdjustmentDTO,
} from "../../types/dtos/ingredient.dto";

export const IngredientService = {
  async list() {
    return Ingredient.findAll({
      include: [
        {
          model: Supplier,
          attributes: ["id", "name", "contact_info"],
        },
      ],
      order: [["name", "ASC"]],
    });
  },

  async get(id: string) {
    return Ingredient.findByPk(id, {
      include: [
        {
          model: Supplier,
          attributes: ["id", "name", "contact_info"],
        },
      ],
    });
  },

  async create(payload: CreateIngredientDTO) {
    const id = payload.id || uuidv4();
    const ingredient = await Ingredient.create({
      id,
      ...payload,
      created_at: new Date(),
    });
    return this.get(ingredient.id);
  },

  async update(id: string, payload: UpdateIngredientDTO) {
    const ingredient = await Ingredient.findByPk(id);
    if (!ingredient) return null;

    await ingredient.update({
      ...payload,
      updated_at: new Date(),
    });
    return this.get(id);
  },

  async remove(id: string) {
    const ingredient = await Ingredient.findByPk(id);
    if (!ingredient) return false;
    await ingredient.destroy();
    return true;
  },

  async adjustStock(adjustment: IngredientStockAdjustmentDTO) {
    const ingredient = await Ingredient.findByPk(adjustment.ingredient_id);
    if (!ingredient) {
      throw new Error("Ingredient not found");
    }

    const quantity =
      adjustment.adjustment_type === "increment"
        ? adjustment.quantity
        : -adjustment.quantity;

    const newStock = ingredient.current_stock + quantity;
    if (newStock < 0) {
      throw new Error("Insufficient stock for decrement operation");
    }

    await ingredient.update({
      current_stock: newStock,
      updated_at: new Date(),
    });

    // Create stock adjustment log if needed
    if (adjustment.reason) {
      await InventoryAdjustmentLog.create({
        id: uuidv4(),
        ingredient_id: adjustment.ingredient_id,
        quantity: quantity,
        reason: adjustment.reason,
        reference_id: adjustment.reference_id,
        reference_type: adjustment.reference_type,
        adjusted_by: adjustment.adjusted_by,
        created_at: new Date(),
      });
    }

    return this.get(ingredient.id);
  },

  async getLowStockIngredients() {
    return Ingredient.findAll({
      where: {
        current_stock: {
          [Op.lte]: sequelize.col("minimum_stock"),
        },
      },
      include: [
        {
          model: Supplier,
          attributes: ["id", "name", "contact_info"],
        },
      ],
      order: [["current_stock", "ASC"]],
    });
  },

  async getExpiringIngredients(daysThreshold = 7) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return Ingredient.findAll({
      where: {
        perishable: true,
        expiry_date: {
          [Op.lte]: thresholdDate,
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: Supplier,
          attributes: ["id", "name", "contact_info"],
        },
      ],
      order: [["expiry_date", "ASC"]],
    });
  },

  async searchByName(query: string) {
    return Ingredient.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      include: [
        {
          model: Supplier,
          attributes: ["id", "name", "contact_info"],
        },
      ],
    });
  },
};
