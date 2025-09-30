import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface EmployeeAttributes {
  id: string
  user_id?: string
  position?: string
  face_image_url?: string
  created_at?: Date
  deleted_at?: Date | null
}

interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, "id"> {}

class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  public id!: string
  public user_id?: string
  public position?: string
  public face_image_url?: string
  public created_at?: Date
  public deleted_at?: Date | null
}

Employee.init(
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
    position: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    face_image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
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
    tableName: "employees",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: false,
    deletedAt: "deleted_at",
  },
)

export default Employee
