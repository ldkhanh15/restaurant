import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ReservationAttributes {
  id: string;
  user_id?: string | null;
  table_id?: string | null;
  table_group_id?: string | null;
  reservation_time: Date;
  duration_minutes?: number;
  num_people: number;
  preferences?: object | null;
  status?: 'pending'|'confirmed'|'cancelled'|'no_show';
  timeout_minutes?: number;
  confirmation_sent?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
type ReservationCreation = Optional<ReservationAttributes, 'id'|'user_id'|'table_id'|'table_group_id'|'duration_minutes'|'preferences'|'status'|'timeout_minutes'|'confirmation_sent'|'created_at'|'updated_at'|'deleted_at'>;

export class Reservation extends Model<ReservationAttributes, ReservationCreation> implements ReservationAttributes {
  public id!: string;
  public user_id!: string | null;
  public table_id!: string | null;
  public table_group_id!: string | null;
  public reservation_time!: Date;
  public duration_minutes!: number;
  public num_people!: number;
  public preferences!: object | null;
  public status!: 'pending'|'confirmed'|'cancelled'|'no_show';
  public timeout_minutes!: number;
  public confirmation_sent!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
}

export function initReservationModel(sequelize: Sequelize) {
  Reservation.init({
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    user_id: { type: DataTypes.CHAR(36), allowNull: true },
    table_id: { type: DataTypes.CHAR(36), allowNull: true },
    table_group_id: { type: DataTypes.CHAR(36), allowNull: true },
    reservation_time: { type: DataTypes.DATE, allowNull: false },
    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 90 },
    num_people: { type: DataTypes.INTEGER, allowNull: false },
    preferences: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.ENUM('pending','confirmed','cancelled','no_show'), defaultValue: 'pending' },
    timeout_minutes: { type: DataTypes.INTEGER, defaultValue: 15 },
    confirmation_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'reservations',
    timestamps: false
  });
}
