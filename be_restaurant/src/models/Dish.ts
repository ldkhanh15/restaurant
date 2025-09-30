import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface DishAttributes {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  media_urls?: any
  is_best_seller: boolean
  seasonal: boolean
  active: boolean
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface DishCreationAttributes extends Optional<DishAttributes, "id" | "is_best_seller" | "seasonal" | "active"> {}

class Dish extends Model<DishAttributes, DishCreationAttributes> implements DishAttributes {
  public id!: string
  public name!: string
  public description?: string
  public price!: number
  public category_id!: string
  public media_urls?: any
  public is_best_seller!: boolean
  public seasonal!: boolean
  public active!: boolean
  public created_at?: Date
  public updated_at?: Date
  public deleted_at?: Date | null
}

Dish.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "category_dishes",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    media_urls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_best_seller: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    seasonal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: "dishes",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
)

export default Dish
