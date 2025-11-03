import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface SupplierAttributes {
  id: string
  name: string
  contact?: string
  created_at?: Date
  deleted_at?: Date | null
}

interface SupplierCreationAttributes extends Optional<SupplierAttributes, "id"> {}

class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes> implements SupplierAttributes {
  public id!: string
  public name!: string
  public contact?: string
  public created_at?: Date
  public deleted_at?: Date | null
}

Supplier.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contact: {
      type: DataTypes.STRING(100),
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
    tableName: "suppliers",
    timestamps: true,
    paranoid: false,
    createdAt: "created_at",
    updatedAt: false,
    deletedAt: "deleted_at",
  },
)

export default Supplier
