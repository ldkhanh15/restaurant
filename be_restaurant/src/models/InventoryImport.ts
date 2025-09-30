import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface InventoryImportAttributes {
  id: string
  reason?: string
  total_price: number
  employee_id?: string
  supplier_id?: string
  timestamp?: Date
}

interface InventoryImportCreationAttributes extends Optional<InventoryImportAttributes, "id"> {}

class InventoryImport
  extends Model<InventoryImportAttributes, InventoryImportCreationAttributes>
  implements InventoryImportAttributes
{
  public id!: string
  public reason?: string
  public total_price!: number
  public employee_id?: string
  public supplier_id?: string
  public timestamp?: Date
}

InventoryImport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "employees",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "suppliers",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "inventory_imports",
    timestamps: true,
    createdAt: "timestamp",
    updatedAt: false,
  },
)

export default InventoryImport
