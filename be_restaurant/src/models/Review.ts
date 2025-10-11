import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface ReviewAttributes {
  id: string
  user_id?: string
  order_id?: string
  order_item_id?: string
  dish_id?: string
  table_id?: string
  type: "dish" | "table"
  rating: number
  comment?: string
  created_at?: Date
}

interface ReviewCreationAttributes extends Optional<ReviewAttributes, "id"> { }

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public id!: string
  public user_id?: string
  public order_id?: string
  public order_item_id?: string
  public dish_id?: string
  public table_id?: string
  public type!: "dish" | "table"
  public rating!: number
  public comment?: string
  public created_at?: Date
}

Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    order_item_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "order_items",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    dish_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "dishes",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    table_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "tables",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    type: {
      type: DataTypes.ENUM("dish", "table"),
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "reviews",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
)

export default Review
