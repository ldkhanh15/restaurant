import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface NotificationAttributes {
  id: string;
  user_id?: string;
  type:
    | "low_stock"
    | "reservation_confirm"
    | "promotion"
    | "order_created"
    | "order_updated"
    | "order_status_changed"
    | "reservation_created"
    | "reservation_updated"
    | "chat_message"
    | "support_request"
    | "payment_requested"
    | "payment_completed"
    | "other"
    | "loyalty_points_awarded";
  content: string;
  title?: string;
  data?: any;
  is_read: boolean;
  sent_at?: Date;
  status: "sent" | "failed";
}

interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    "id" | "type" | "status" | "is_read"
  > {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public user_id?: string;
  public type!:
    | "low_stock"
    | "reservation_confirm"
    | "promotion"
    | "order_created"
    | "order_updated"
    | "order_status_changed"
    | "reservation_created"
    | "reservation_updated"
    | "chat_message"
    | "support_request"
    | "payment_requested"
    | "payment_completed"
    | "other"
    | "loyalty_points_awarded";
  public content!: string;
  public title?: string;
  public data?: any;
  public is_read!: boolean;
  public sent_at?: Date;
  public status!: "sent" | "failed";
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
      type: DataTypes.ENUM(
        "low_stock",
        "reservation_confirm",
        "promotion",
        "order_created",
        "order_updated",
        "order_status_changed",
        "reservation_created",
        "reservation_updated",
        "chat_message",
        "support_request",
        "payment_requested",
        "payment_completed",
        "other",
        "loyalty_points_awarded"
      ),
      defaultValue: "other",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
  }
);

export default Notification;
