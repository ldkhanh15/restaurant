import {
  InventoryImport,
  InventoryImportIngredient,
  Ingredient,
  Supplier,
} from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { sequelize } from "../../config/database";
import {
  CreateInventoryImportDTO,
  UpdateInventoryImportDTO,
  InventoryAdjustmentDTO,
  InventoryTransferDTO,
} from "../../types/dtos/inventory.dto";

export const InventoryService = {
  async list() {
    return InventoryImport.findAll({
      include: [
        {
          model: Supplier,
          attributes: ["id", "name", "contact_info"],
        },
        {
          model: InventoryImportIngredient,
          include: [Ingredient],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async get(id: string) {
    return InventoryImport.findByPk(id, {
      include: [
        {
          model: Supplier,
          attributes: ["id", "name", "contact_info"],
        },
        {
          model: InventoryImportIngredient,
          include: [Ingredient],
        },
      ],
    });
  },

  async create(payload: CreateInventoryImportDTO) {
    const t = await sequelize.transaction();

    try {
      const id = payload.id || uuidv4();

      // Calculate total price if not provided
      const totalPrice =
        payload.total_price ||
        payload.ingredients.reduce(
          (sum, item) => sum + item.quantity * item.unit_price,
          0
        );

      // Create import record
      const importRecord = await InventoryImport.create(
        {
          id,
          supplier_id: payload.supplier_id,
          total_price: totalPrice,
          payment_status: payload.payment_status || "pending",
          payment_due_date: payload.payment_due_date,
          notes: payload.notes,
          received_by: payload.received_by,
          created_at: new Date(),
        },
        { transaction: t }
      );

      // Create import ingredients records
      for (const item of payload.ingredients) {
        const ingredient = await Ingredient.findByPk(item.ingredient_id);
        if (!ingredient) {
          throw new Error(`Ingredient ${item.ingredient_id} not found`);
        }

        // Create import ingredient record
        await InventoryImportIngredient.create(
          {
            id: uuidv4(),
            import_id: importRecord.id,
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            expiry_date: item.expiry_date,
            batch_number: item.batch_number,
            created_at: new Date(),
          },
          { transaction: t }
        );

        // Update ingredient stock
        await ingredient.increment("current_stock", {
          by: item.quantity,
          transaction: t,
        });
      }

      await t.commit();
      return this.get(importRecord.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async update(id: string, payload: UpdateInventoryImportDTO) {
    const t = await sequelize.transaction();

    try {
      const importRecord = await InventoryImport.findByPk(id, {
        include: [InventoryImportIngredient],
      });

      if (!importRecord) {
        throw new Error("Import record not found");
      }

      // Update main import record
      if (payload.payment_status)
        importRecord.payment_status = payload.payment_status;
      if (payload.payment_due_date)
        importRecord.payment_due_date = payload.payment_due_date;
      if (payload.notes) importRecord.notes = payload.notes;
      await importRecord.save({ transaction: t });

      // Update ingredients if provided
      if (payload.ingredients) {
        for (const item of payload.ingredients) {
          const importIngredient =
            importRecord.inventory_import_ingredients.find(
              (i) => i.id === item.id
            );

          if (!importIngredient) continue;

          // Calculate stock adjustment
          if (item.quantity && item.quantity !== importIngredient.quantity) {
            const difference = item.quantity - importIngredient.quantity;
            await Ingredient.increment("current_stock", {
              by: difference,
              where: { id: importIngredient.ingredient_id },
              transaction: t,
            });
          }

          // Update import ingredient record
          await importIngredient.update(
            {
              ...item,
              updated_at: new Date(),
            },
            { transaction: t }
          );
        }
      }

      await t.commit();
      return this.get(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async adjustStock(adjustment: InventoryAdjustmentDTO) {
    const t = await sequelize.transaction();

    try {
      const ingredient = await Ingredient.findByPk(adjustment.ingredient_id);
      if (!ingredient) {
        throw new Error("Ingredient not found");
      }

      // Check if adjustment would result in negative stock
      const newStock = ingredient.current_stock + adjustment.quantity_change;
      if (newStock < 0) {
        throw new Error("Adjustment would result in negative stock");
      }

      // Update ingredient stock
      await ingredient.update(
        {
          current_stock: newStock,
          updated_at: new Date(),
        },
        { transaction: t }
      );

      // Create adjustment log
      await InventoryAdjustmentLog.create(
        {
          id: uuidv4(),
          ingredient_id: adjustment.ingredient_id,
          quantity_change: adjustment.quantity_change,
          reason: adjustment.reason,
          adjusted_by: adjustment.adjusted_by,
          notes: adjustment.notes,
          reference_type: adjustment.reference_type,
          reference_id: adjustment.reference_id,
          created_at: new Date(),
        },
        { transaction: t }
      );

      await t.commit();
      return ingredient;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async transferStock(transfer: InventoryTransferDTO) {
    const t = await sequelize.transaction();

    try {
      for (const item of transfer.ingredients) {
        const ingredient = await Ingredient.findByPk(item.ingredient_id);
        if (!ingredient) {
          throw new Error(`Ingredient ${item.ingredient_id} not found`);
        }

        // Check if transfer would result in negative stock
        if (ingredient.current_stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ingredient ${ingredient.name}`
          );
        }
      }

      // Create transfer record and update ingredient locations
      const transferRecord = await InventoryTransfer.create(
        {
          id: uuidv4(),
          from_location: transfer.from_location,
          to_location: transfer.to_location,
          transferred_by: transfer.transferred_by,
          reason: transfer.reason,
          created_at: new Date(),
        },
        { transaction: t }
      );

      // Process each ingredient transfer
      for (const item of transfer.ingredients) {
        await InventoryTransferItem.create(
          {
            id: uuidv4(),
            transfer_id: transferRecord.id,
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
            notes: item.notes,
            created_at: new Date(),
          },
          { transaction: t }
        );

        // Update ingredient location
        await Ingredient.update(
          { storage_location: transfer.to_location },
          {
            where: { id: item.ingredient_id },
            transaction: t,
          }
        );
      }

      await t.commit();
      return transferRecord;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
