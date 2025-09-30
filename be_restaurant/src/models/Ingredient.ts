import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface IngredientAttributes {
  id: string
  name: string
  unit: string
  barcode?: string
  rfid?: string
  min_stock_level: number
  current_stock: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface IngredientCreationAttributes
  extends Optional<IngredientAttributes, "id" | "min_stock_level" | "current_stock"> {}

class Ingredient extends Model<IngredientAttributes, IngredientCreationAttributes> implements IngredientAttributes {
  public id!: string
  public name!: string
  public unit!: string
  public barcode?: string
  public rfid?: string
  public min_stock_level!: number
  public current_stock!: number
  public created_at?: Date
  public updated_at?: Date
  public deleted_at?: Date | null
}

Ingredient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    rfid: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    min_stock_level: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    current_stock: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "ingredients",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
)

export default Ingredient
