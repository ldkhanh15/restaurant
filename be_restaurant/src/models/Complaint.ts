import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface ComplaintAttributes {
  id: string
  user_id?: string
  order_id?: string
  order_item_id?: string
  description: string
  status: "pending" | "approved" | "rejected"
  resolution_notes?: string
  created_at?: Date
  updated_at?: Date
}

interface ComplaintCreationAttributes extends Optional<ComplaintAttributes, "id" | "status"> { }

class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes> implements ComplaintAttributes {
  public id!: string
  public user_id?: string
  public order_id?: string
  public order_item_id?: string
  public description!: string
  public status!: "pending" | "approved" | "rejected"
  public resolution_notes?: string
  public created_at?: Date
  public updated_at?: Date
}

Complaint.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    resolution_notes: {
      type: DataTypes.TEXT,
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
  },
  {
    sequelize,
    tableName: "complaints",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
)

export default Complaint
