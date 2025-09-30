import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface AttendanceLogAttributes {
  id: string
  employee_id?: string
  check_in_time?: Date
  check_out_time?: Date
  face_image_url?: string
  verified: boolean
  created_at?: Date
}

interface AttendanceLogCreationAttributes extends Optional<AttendanceLogAttributes, "id" | "verified"> {}

class AttendanceLog
  extends Model<AttendanceLogAttributes, AttendanceLogCreationAttributes>
  implements AttendanceLogAttributes
{
  public id!: string
  public employee_id?: string
  public check_in_time?: Date
  public check_out_time?: Date
  public face_image_url?: string
  public verified!: boolean
  public created_at?: Date
}

AttendanceLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "employees",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    check_in_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    check_out_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    face_image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "attendance_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
)

export default AttendanceLog
