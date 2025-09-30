import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface PayrollAttributes {
  id: string;
  employee_id?: string | null;
  period_start: Date;
  period_end: Date;
  hours_worked?: number | null;
  base_pay?: number | null;
  bonus?: number | null;
  taxes?: number | null;
  net_pay?: number | null;
  advance_salary?: number | null;
}

type PayrollCreation = Optional<
  PayrollAttributes,
  | "id"
  | "hours_worked"
  | "base_pay"
  | "bonus"
  | "taxes"
  | "net_pay"
  | "advance_salary"
>;

export class Payroll
  extends Model<PayrollAttributes, PayrollCreation>
  implements PayrollAttributes
{
  public id!: string;
  public employee_id!: string | null;
  public period_start!: Date;
  public period_end!: Date;
  public hours_worked!: number | null;
  public base_pay!: number | null;
  public bonus!: number | null;
  public taxes!: number | null;
  public net_pay!: number | null;
  public advance_salary!: number | null;
}

export function initPayrollModel(sequelize: Sequelize) {
  Payroll.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      employee_id: { type: DataTypes.CHAR(36), allowNull: true },
      period_start: { type: DataTypes.DATEONLY, allowNull: false },
      period_end: { type: DataTypes.DATEONLY, allowNull: false },
      hours_worked: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      base_pay: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      bonus: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      taxes: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      net_pay: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      advance_salary: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    {
      sequelize,
      tableName: "payroll",
      timestamps: false,
    }
  );
}
