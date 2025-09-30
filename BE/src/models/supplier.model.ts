import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SupplierAttributes {
  id: string;
  name: string;
  contact?: string | null;
  created_at?: Date;
  deleted_at?: Date | null;
}

type SupplierCreation = Optional<
  SupplierAttributes,
  "id" | "contact" | "created_at" | "deleted_at"
>;

export class Supplier
  extends Model<SupplierAttributes, SupplierCreation>
  implements SupplierAttributes
{
  public id!: string;
  public name!: string;
  public contact!: string | null;
  public created_at!: Date;
  public deleted_at!: Date | null;
}

export function initSupplierModel(sequelize: Sequelize) {
  Supplier.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      contact: { type: DataTypes.STRING(100), allowNull: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "suppliers",
      timestamps: false,
    }
  );
}
