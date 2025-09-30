import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface InventoryImportIngredientAttributes {
  id: string
  ingredient_id?: string
  quantity: number
  total_price: number
  inventory_imports_id?: string
}

interface InventoryImportIngredientCreationAttributes extends Optional<InventoryImportIngredientAttributes, "id"> {}

class InventoryImportIngredient
  extends Model<InventoryImportIngredientAttributes, InventoryImportIngredientCreationAttributes>
  implements InventoryImportIngredientAttributes
{
  public id!: string
  public ingredient_id?: string
  public quantity!: number
  public total_price!: number
  public inventory_imports_id?: string
}

InventoryImportIngredient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ingredient_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "ingredients",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    inventory_imports_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "inventory_imports",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "inventory_import_ingredients",
    timestamps: false,
  },
)

export default InventoryImportIngredient
