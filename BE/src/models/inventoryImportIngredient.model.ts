import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface InventoryImportIngredientAttributes {
  id: string;
  ingredient_id?: string | null;
  quantity: number;
  total_price: number;
  inventory_imports_id?: string | null;
}

type InventoryImportIngredientCreation = Optional<
  InventoryImportIngredientAttributes,
  "id"
>;

export class InventoryImportIngredient
  extends Model<
    InventoryImportIngredientAttributes,
    InventoryImportIngredientCreation
  >
  implements InventoryImportIngredientAttributes
{
  public id!: string;
  public ingredient_id!: string | null;
  public quantity!: number;
  public total_price!: number;
  public inventory_imports_id!: string | null;
}

export function initInventoryImportIngredientModel(sequelize: Sequelize) {
  InventoryImportIngredient.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      ingredient_id: { type: DataTypes.CHAR(36), allowNull: true },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      inventory_imports_id: { type: DataTypes.CHAR(36), allowNull: true },
    },
    {
      sequelize,
      tableName: "inventory_import_ingredients",
      timestamps: false,
    }
  );
}
