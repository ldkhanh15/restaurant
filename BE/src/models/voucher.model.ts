import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface VoucherAttributes {
  id: string;
  code: string;
  discount_type: 'percentage'|'fixed';
  value: number;
  expiry_date?: Date | null;
  max_uses?: number;
  current_uses?: number;
  min_order_value?: number;
  active?: boolean;
  created_at?: Date;
  deleted_at?: Date | null;
}
type VoucherCreation = Optional<VoucherAttributes, 'id'|'expiry_date'|'max_uses'|'current_uses'|'min_order_value'|'active'|'created_at'|'deleted_at'>;

export class Voucher extends Model<VoucherAttributes, VoucherCreation> implements VoucherAttributes {
  public id!: string;
  public code!: string;
  public discount_type!: 'percentage'|'fixed';
  public value!: number;
  public expiry_date!: Date | null;
  public max_uses!: number;
  public current_uses!: number;
  public min_order_value!: number;
  public active!: boolean;
  public created_at!: Date;
  public deleted_at!: Date | null;
}

export function initVoucherModel(sequelize: Sequelize) {
  Voucher.init({
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    discount_type: { type: DataTypes.ENUM('percentage','fixed'), allowNull: false },
    value: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
    max_uses: { type: DataTypes.INTEGER, defaultValue: 0 },
    current_uses: { type: DataTypes.INTEGER, defaultValue: 0 },
    min_order_value: { type: DataTypes.INTEGER, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'vouchers',
    timestamps: false
  });
}
