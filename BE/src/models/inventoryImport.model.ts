import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface InventoryImportAttributes {
  id: string;
  reason?: string | null;
  total_price: number;
  employee_id?: string | null;
  supplier_id?: string | null;
  timestamp?: Date;
}

type InventoryImportCreation = Optional<
  InventoryImportAttributes,
  "id" | "reason" | "timestamp"
>;

export class InventoryImport
  extends Model<InventoryImportAttributes, InventoryImportCreation>
  implements InventoryImportAttributes
{
  public id!: string;
  public reason!: string | null;
  public total_price!: number;
  public employee_id!: string | null;
  public supplier_id!: string | null;
  public timestamp!: Date;
}

export function initInventoryImportModel(sequelize: Sequelize) {
  InventoryImport.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      reason: { type: DataTypes.STRING(255), allowNull: true },
      total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      employee_id: { type: DataTypes.CHAR(36), allowNull: true },
      supplier_id: { type: DataTypes.CHAR(36), allowNull: true },
      timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "inventory_imports",
      timestamps: false,
    }
  );
}
