import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface EventBookingAttributes {
  id: string;
  event_id?: string | null;
  reservation_id?: string | null;
  special_requests?: string | null;
  status?: "booked" | "confirmed" | "cancelled";
  created_at?: Date;
}

type EventBookingCreation = Optional<
  EventBookingAttributes,
  "id" | "special_requests" | "status" | "created_at"
>;

export class EventBooking
  extends Model<EventBookingAttributes, EventBookingCreation>
  implements EventBookingAttributes
{
  public id!: string;
  public event_id!: string | null;
  public reservation_id!: string | null;
  public special_requests!: string | null;
  public status!: "booked" | "confirmed" | "cancelled";
  public created_at!: Date;
}

export function initEventBookingModel(sequelize: Sequelize) {
  EventBooking.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      event_id: { type: DataTypes.CHAR(36), allowNull: true },
      reservation_id: { type: DataTypes.CHAR(36), allowNull: true },
      special_requests: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("booked", "confirmed", "cancelled"),
        defaultValue: "booked",
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "event_bookings",
      timestamps: false,
    }
  );
}
