import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface OrderItemAttributes {
  id: string;
  order_id?: string;
  dish_id?: string;
  quantity: number;
  price: number;
  customizations?: any;
  status: "pending" | "completed" | "preparing" | "ready" | "cancelled";
  special_instructions?: string;
  estimated_wait_time?: number;
  completed_at?: Date;
  created_at?: Date;
}

interface OrderItemCreationAttributes
  extends Optional<OrderItemAttributes, "id" | "status"> {}

class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes
{
  public id!: string;
  public order_id?: string;
  public dish_id?: string;
  public quantity!: number;
  public price!: number;
  public customizations?: any;
  public status!: "pending" | "completed" | "preparing" | "ready" | "cancelled";
  public special_instructions?: string;
  public estimated_wait_time?: number;
  public completed_at?: Date;
  public created_at?: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
      onDelete: "CASCADE",
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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    customizations: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "completed",
        "preparing",
        "ready",
        "cancelled"
      ),
      defaultValue: "pending",
    },
    special_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimated_wait_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "order_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default OrderItem;
