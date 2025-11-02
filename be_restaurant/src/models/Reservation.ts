import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface ReservationAttributes {
  id: string;
  user_id?: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time: Date;
  duration_minutes: number;
  num_people: number;
  preferences?: any;
  event_id?: string;
  event_fee?: number;
  status: "pending" | "confirmed" | "cancelled" | "no_show" | "completed";
  timeout_minutes: number;
  deposit_amount?: number;
  pre_order_items?: any;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface ReservationCreationAttributes
  extends Optional<
    ReservationAttributes,
    "id" | "duration_minutes" | "status" | "timeout_minutes"
  > { }

class Reservation extends Model<ReservationAttributes, ReservationCreationAttributes> implements ReservationAttributes {
  public id!: string
  public user_id?: string
  public table_id?: string
  public table_group_id?: string
  public reservation_time!: Date
  public duration_minutes!: number
  public num_people!: number
  public preferences?: any
  public event_id?: string
  public event_fee?: number
  public status!: "pending" | "confirmed" | "cancelled" | "no_show" | "completed"
  public timeout_minutes!: number
  public deposit_amount?: number
  public pre_order_items?: any
  public created_at?: Date
  public updated_at?: Date
  public deleted_at?: Date | null
}

Reservation.init(
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
    reservation_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 90,
    },
    num_people: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    pre_order_items: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "events", key: "id" },
      onDelete: "SET NULL",
    },
    event_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "no_show"),
      defaultValue: "pending",
    },
    timeout_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    tableName: "reservations",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
)

export default Reservation
