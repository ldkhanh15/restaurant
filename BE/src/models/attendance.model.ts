import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface AttendanceLogAttributes {
  id: string;
  employee_id?: string | null;
  check_in_time?: Date | null;
  check_out_time?: Date | null;
  face_image_url?: string | null;
  verified?: boolean;
  created_at?: Date;
}

type AttendanceLogCreation = Optional<
  AttendanceLogAttributes,
  | "id"
  | "check_in_time"
  | "check_out_time"
  | "face_image_url"
  | "verified"
  | "created_at"
>;

export class AttendanceLog
  extends Model<AttendanceLogAttributes, AttendanceLogCreation>
  implements AttendanceLogAttributes
{
  public id!: string;
  public employee_id!: string | null;
  public check_in_time!: Date | null;
  public check_out_time!: Date | null;
  public face_image_url!: string | null;
  public verified!: boolean;
  public created_at!: Date;
}

export function initAttendanceLogModel(sequelize: Sequelize) {
  AttendanceLog.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      employee_id: { type: DataTypes.CHAR(36), allowNull: true },
      check_in_time: { type: DataTypes.DATE, allowNull: true },
      check_out_time: { type: DataTypes.DATE, allowNull: true },
      face_image_url: { type: DataTypes.STRING(255), allowNull: true },
      verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "attendance_logs",
      timestamps: false,
    }
  );
}
