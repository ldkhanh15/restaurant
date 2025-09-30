import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface OrderAttributes {
  id: string
  user_id?: string
  reservation_id?: string
  table_id?: string
  table_group_id?: string
  voucher_id?: string
  status: "pending" | "preparing" | "ready" | "delivered" | "paid" | "cancelled"
  total_amount: number
  customizations?: any
  notes?: string
  payment_status: "pending" | "paid" | "failed"
  payment_method?: "zalopay" | "momo" | "cash"
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface OrderCreationAttributes extends Optional<OrderAttributes, "id" | "status" | "payment_status"> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string
  public user_id?: string
  public reservation_id?: string
  public table_id?: string
  public table_group_id?: string
  public voucher_id?: string
  public status!: "pending" | "preparing" | "ready" | "delivered" | "paid" | "cancelled"
  public total_amount!: number
  public customizations?: any
  public notes?: string
  public payment_status!: "pending" | "paid" | "failed"
  public payment_method?: "zalopay" | "momo" | "cash"
  public created_at?: Date
  public updated_at?: Date
  public deleted_at?: Date | null
}

Order.init(
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
    reservation_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "reservations",
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
    table_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "table_groups",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vouchers",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    status: {
      type: DataTypes.ENUM("pending", "preparing", "ready", "delivered", "paid", "cancelled"),
      defaultValue: "pending",
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    customizations: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
    },
    payment_method: {
      type: DataTypes.ENUM("zalopay", "momo", "cash"),
      allowNull: true,
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
    tableName: "orders",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
)

export default Order
