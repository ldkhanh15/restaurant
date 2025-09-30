import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface ReservationAttributes {
  id: string
  user_id?: string
  table_id?: string
  table_group_id?: string
  reservation_time: Date
  duration_minutes: number
  num_people: number
  preferences?: any
  status: "pending" | "confirmed" | "cancelled" | "no_show"
  timeout_minutes: number
  confirmation_sent: boolean
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface ReservationCreationAttributes
  extends Optional<
    ReservationAttributes,
    "id" | "duration_minutes" | "status" | "timeout_minutes" | "confirmation_sent"
  > {}

class Reservation extends Model<ReservationAttributes, ReservationCreationAttributes> implements ReservationAttributes {
  public id!: string
  public user_id?: string
  public table_id?: string
  public table_group_id?: string
  public reservation_time!: Date
  public duration_minutes!: number
  public num_people!: number
  public preferences?: any
  public status!: "pending" | "confirmed" | "cancelled" | "no_show"
  public timeout_minutes!: number
  public confirmation_sent!: boolean
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
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "no_show"),
      defaultValue: "pending",
    },
    timeout_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    confirmation_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
