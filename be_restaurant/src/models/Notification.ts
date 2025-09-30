import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface NotificationAttributes {
  id: string
  user_id?: string
  type: "low_stock" | "reservation_confirm" | "promotion" | "other"
  content: string
  sent_at?: Date
  status: "sent" | "failed"
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, "id" | "type" | "status"> {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string
  public user_id?: string
  public type!: "low_stock" | "reservation_confirm" | "promotion" | "other"
  public content!: string
  public sent_at?: Date
  public status!: "sent" | "failed"
}

Notification.init(
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
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("low_stock", "reservation_confirm", "promotion", "other"),
      defaultValue: "other",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("sent", "failed"),
      defaultValue: "sent",
    },
  },
  {
    sequelize,
    tableName: "notifications",
    timestamps: true,
    createdAt: "sent_at",
    updatedAt: false,
  },
)

export default Notification
