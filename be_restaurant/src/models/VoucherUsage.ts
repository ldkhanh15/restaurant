import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface VoucherUsageAttributes {
  id: string
  voucher_id?: string
  order_id?: string
  user_id?: string
  used_at?: Date
}

interface VoucherUsageCreationAttributes extends Optional<VoucherUsageAttributes, "id"> {}

class VoucherUsage
  extends Model<VoucherUsageAttributes, VoucherUsageCreationAttributes>
  implements VoucherUsageAttributes
{
  public id!: string
  public voucher_id?: string
  public order_id?: string
  public user_id?: string
  public used_at?: Date
}

VoucherUsage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vouchers",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    used_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "voucher_usages",
    timestamps: true,
    createdAt: "used_at",
    updatedAt: false,
  },
)

export default VoucherUsage
