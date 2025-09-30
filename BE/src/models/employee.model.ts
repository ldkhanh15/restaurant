import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface EmployeeAttributes {
  id: string;
  user_id?: string | null;
  position?: string | null;
  face_image_url?: string | null;
  created_at?: Date;
  deleted_at?: Date | null;
}

type EmployeeCreation = Optional<
  EmployeeAttributes,
  "id" | "position" | "face_image_url" | "created_at" | "deleted_at"
>;

export class Employee
  extends Model<EmployeeAttributes, EmployeeCreation>
  implements EmployeeAttributes
{
  public id!: string;
  public user_id!: string | null;
  public position!: string | null;
  public face_image_url!: string | null;
  public created_at!: Date;
  public deleted_at!: Date | null;
}

export function initEmployeeModel(sequelize: Sequelize) {
  Employee.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      user_id: { type: DataTypes.CHAR(36), allowNull: true },
      position: { type: DataTypes.STRING(50), allowNull: true },
      face_image_url: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "employees",
      timestamps: false,
    }
  );
}
