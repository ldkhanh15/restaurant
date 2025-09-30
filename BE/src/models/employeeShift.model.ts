import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface EmployeeShiftAttributes {
  id: string;
  employee_id?: string | null;
  start_time: Date;
  end_time: Date;
}

type EmployeeShiftCreation = Optional<EmployeeShiftAttributes, "id">;

export class EmployeeShift
  extends Model<EmployeeShiftAttributes, EmployeeShiftCreation>
  implements EmployeeShiftAttributes
{
  public id!: string;
  public employee_id!: string | null;
  public start_time!: Date;
  public end_time!: Date;
}

export function initEmployeeShiftModel(sequelize: Sequelize) {
  EmployeeShift.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      employee_id: { type: DataTypes.CHAR(36), allowNull: true },
      start_time: { type: DataTypes.DATE, allowNull: false },
      end_time: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: "employee_shifts",
      timestamps: false,
    }
  );
}
