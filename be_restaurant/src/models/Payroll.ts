import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface PayrollAttributes {
  id: string
  employee_id?: string
  period_start: Date
  period_end: Date
  hours_worked?: number
  base_pay?: number
  bonus?: number
  taxes?: number
  net_pay?: number
  advance_salary?: number
}

interface PayrollCreationAttributes extends Optional<PayrollAttributes, "id"> {}

class Payroll extends Model<PayrollAttributes, PayrollCreationAttributes> implements PayrollAttributes {
  public id!: string
  public employee_id?: string
  public period_start!: Date
  public period_end!: Date
  public hours_worked?: number
  public base_pay?: number
  public bonus?: number
  public taxes?: number
  public net_pay?: number
  public advance_salary?: number
}

Payroll.init(
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
    period_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    period_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hours_worked: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    base_pay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    bonus: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    taxes: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    net_pay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    advance_salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "payroll",
    timestamps: false,
  },
)

export default Payroll
