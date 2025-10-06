import { BaseService } from "./baseService"
import InventoryImportIngredient from "../models/InventoryImportIngredient"
import Supplier from "../models/Supplier"
import Employee from "../models/Employee"
import ingredientService from "./ingredientService"
import inventoryService from "./inventoryService"
import { Ingredient } from "../models"
class InventoryImportService extends BaseService<InventoryImportIngredient> {
  constructor() {
    super(InventoryImportIngredient)
  }

  async addIngredientToInventoryImport(
    inventoryImportId: string,
    ingredients: { ingredient_id: string; quantity: number; total_price: number }[]
  ) {
    const { rows } = await this.findAll({
      where: { inventory_imports_id: inventoryImportId },
      attributes: ["ingredient_id"],
    })

    const existingIds = rows.map((e: any) => e.ingredient_id)

    let total_price_inventory_import = Number(
      (await inventoryService.findById(inventoryImportId)).total_price || 0
    );
    const toUpsert = []
    for (const ing of ingredients) {
      total_price_inventory_import = Number(
        (total_price_inventory_import + Number(ing.total_price)).toFixed(2)
      );

      const ingredient = await ingredientService.findById(ing.ingredient_id)
      if (!ingredient) return
      const newStock = Number(ingredient.current_stock) + Number(ing.quantity)
      
      await ingredientService.update(ing.ingredient_id, {
        current_stock: newStock,
      })

      toUpsert.push({
        inventory_imports_id: inventoryImportId,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity,
        total_price: ing.total_price,
      })
    }

    await this.model.bulkCreate(toUpsert, {
      updateOnDuplicate: ["quantity", "total_price"],
    })

    const newIds = ingredients.map((ing) => ing.ingredient_id)
    const toRemove = existingIds.filter((id: string) => !newIds.includes(id))

    if (toRemove.length > 0) {
      await this.model.destroy({
        where: {
          inventory_imports_id: inventoryImportId,
          ingredient_id: toRemove,
        },
      })
    }

    await inventoryService.update(inventoryImportId, {
      total_price: Number(total_price_inventory_import),
    })

    return { success: true }
  }

  async removeInventoryImport(inventoryImportId: string) {
    const importIngredients = await this.model.findAll({
      where: { inventory_imports_id: inventoryImportId },
    })

    for (const item of importIngredients) {
      const ingredient = await ingredientService.findById(item.ingredient_id as string)
      if (!ingredient) continue

      const newStock = Number(ingredient.current_stock) - Number(item.quantity)
      await ingredientService.update(item.ingredient_id as string, { current_stock: newStock })
    }

    await this.model.destroy({
      where: { inventory_imports_id: inventoryImportId },
    })

    await inventoryService.update(inventoryImportId, { total_price: 0 })
    await inventoryService.delete(inventoryImportId)

    return { success: true }
  }

  async updateInventoryImportIngredients(
    inventoryImportId: string,
    newIngredients: InventoryImportIngredient[]
  ) {
    const inventoryImport = await inventoryService.findById(inventoryImportId);
    if (!inventoryImport) throw new Error("Inventory import not found");

    const existingIngredients = await InventoryImportIngredient.findAll({
      where: { inventory_imports_id: inventoryImportId },
    });

    let totalPrice = 0;

    for (const item of newIngredients) {
      const existing = existingIngredients.find(e => e.ingredient_id === item.ingredient_id);

      if (existing) {
        const qtyDiff = Number(item.quantity) - Number(existing.quantity);
        await Ingredient.increment({ current_stock: qtyDiff }, { where: { id: item.ingredient_id } });

        existing.quantity = Number(item.quantity);
        existing.total_price = Number(item.total_price);
        await existing.save();
      } else {
        await InventoryImportIngredient.create({
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
          total_price: item.total_price,
          inventory_imports_id: inventoryImportId,
        });

        await Ingredient.increment({ current_stock: item.quantity }, { where: { id: item.ingredient_id } });
      }

      totalPrice += Number(item.total_price);
    }

    for (const existing of existingIngredients) {
      const stillExists = newIngredients.find(e => e.ingredient_id === existing.ingredient_id);
      if (!stillExists) {
        await Ingredient.decrement({ current_stock: Number(existing.quantity) }, { where: { id: existing.ingredient_id } });
        await existing.destroy();
      }
    }

    inventoryImport.total_price = Number(totalPrice.toFixed(2));
    return await inventoryImport.save();
  }

}

export default new InventoryImportService()
