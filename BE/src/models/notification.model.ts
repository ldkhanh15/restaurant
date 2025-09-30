import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NotificationAttributes {
  id: string;
  user_id?: string | null;
  type?: "low_stock" | "reservation_confirm" | "promotion" | "other";
  content: string;
  sent_at?: Date;
  status?: "sent" | "failed";
}

type NotificationCreation = Optional<
  NotificationAttributes,
  "id" | "type" | "sent_at" | "status"
>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreation>
  implements NotificationAttributes
{
  public id!: string;
  public user_id!: string | null;
  public type!: "low_stock" | "reservation_confirm" | "promotion" | "other";
  public content!: string;
  public sent_at!: Date;
  public status!: "sent" | "failed";
}

export function initNotificationModel(sequelize: Sequelize) {
  Notification.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      user_id: { type: DataTypes.CHAR(36), allowNull: true },
      type: {
        type: DataTypes.ENUM(
          "low_stock",
          "reservation_confirm",
          "promotion",
          "other"
        ),
        defaultValue: "other",
      },
      content: { type: DataTypes.TEXT, allowNull: false },
      sent_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      status: { type: DataTypes.ENUM("sent", "failed"), defaultValue: "sent" },
    },
    {
      sequelize,
      tableName: "notifications",
      timestamps: false,
    }
  );
}
