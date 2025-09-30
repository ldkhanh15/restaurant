import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface EventBookingAttributes {
  id: string
  event_id?: string
  reservation_id?: string
  special_requests?: string
  status: "booked" | "confirmed" | "cancelled"
  created_at?: Date
}

interface EventBookingCreationAttributes extends Optional<EventBookingAttributes, "id" | "status"> {}

class EventBooking
  extends Model<EventBookingAttributes, EventBookingCreationAttributes>
  implements EventBookingAttributes
{
  public id!: string
  public event_id?: string
  public reservation_id?: string
  public special_requests?: string
  public status!: "booked" | "confirmed" | "cancelled"
  public created_at?: Date
}

EventBooking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "events",
        key: "id",
      },
      onDelete: "CASCADE",
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
    special_requests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("booked", "confirmed", "cancelled"),
      defaultValue: "booked",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "event_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
)

export default EventBooking
