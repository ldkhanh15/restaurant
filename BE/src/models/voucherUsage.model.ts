import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface VoucherUsageAttributes {
    id: string;
    voucher_id?: string | null;
    order_id?: string | null;
    user_id?: string | null;
    used_at?: Date;
}

type VoucherUsageCreation = Optional<VoucherUsageAttributes, 'id' | 'voucher_id' | 'order_id' | 'user_id' | 'used_at'>;

export class VoucherUsage extends Model<VoucherUsageAttributes, VoucherUsageCreation> implements VoucherUsageAttributes {
    public id!: string;
    public voucher_id!: string | null;
    public order_id!: string | null;
    public user_id!: string | null;
    public used_at!: Date;
}

export function initVoucherUsageModel(sequelize: Sequelize) {
    VoucherUsage.init({
        id: { type: DataTypes.CHAR(36), primaryKey: true },
        voucher_id: { type: DataTypes.CHAR(36), allowNull: true },
        order_id: { type: DataTypes.CHAR(36), allowNull: true },
        user_id: { type: DataTypes.CHAR(36), allowNull: true },
        used_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        sequelize,
        tableName: 'voucher_usages',
        timestamps: false,
    });
} 