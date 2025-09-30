import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface EmployeeShiftAttributes {
  id: string
  employee_id?: string
  start_time: Date
  end_time: Date
}

interface EmployeeShiftCreationAttributes extends Optional<EmployeeShiftAttributes, "id"> {}

class EmployeeShift
  extends Model<EmployeeShiftAttributes, EmployeeShiftCreationAttributes>
  implements EmployeeShiftAttributes
{
  public id!: string
  public employee_id?: string
  public start_time!: Date
  public end_time!: Date
}

EmployeeShift.init(
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
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "employee_shifts",
    timestamps: false,
  },
)

export default EmployeeShift
