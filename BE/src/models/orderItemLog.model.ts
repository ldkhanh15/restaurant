import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface OrderItemLogAttributes {
  id: string;
  order_item_id?: string | null;
  status_change?: "pending" | "completed";
  timestamp?: Date;
  duration_seconds?: number | null;
}

type OrderItemLogCreation = Optional<
  OrderItemLogAttributes,
  "id" | "status_change" | "timestamp" | "duration_seconds"
>;

export class OrderItemLog
  extends Model<OrderItemLogAttributes, OrderItemLogCreation>
  implements OrderItemLogAttributes
{
  public id!: string;
  public order_item_id!: string | null;
  public status_change!: "pending" | "completed";
  public timestamp!: Date;
  public duration_seconds!: number | null;
}

export function initOrderItemLogModel(sequelize: Sequelize) {
  OrderItemLog.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      order_item_id: { type: DataTypes.CHAR(36), allowNull: true },
      status_change: {
        type: DataTypes.ENUM("pending", "completed"),
        allowNull: true,
      },
      timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      duration_seconds: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      tableName: "order_item_logs",
      timestamps: false,
    }
  );
}
