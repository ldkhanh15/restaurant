import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface OrderAttributes {
  id: string;
  user_id?: string | null;
  reservation_id?: string | null;
  table_id?: string | null;
  table_group_id?: string | null;
  voucher_id?: string | null;
  status?: 'pending'|'preparing'|'ready'|'delivered'|'paid'|'cancelled';
  total_amount: number;
  customizations?: object | null;
  notes?: string | null;
  payment_status?: 'pending'|'paid'|'failed';
  payment_method?: 'zalopay'|'momo'|'cash'|null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
type OrderCreation = Optional<OrderAttributes, 'id'|'user_id'|'reservation_id'|'table_id'|'table_group_id'|'voucher_id'|'status'|'customizations'|'notes'|'payment_status'|'payment_method'|'created_at'|'updated_at'|'deleted_at'>;

export class Order extends Model<OrderAttributes, OrderCreation> implements OrderAttributes {
  public id!: string;
  public user_id!: string | null;
  public reservation_id!: string | null;
  public table_id!: string | null;
  public table_group_id!: string | null;
  public voucher_id!: string | null;
  public status!: 'pending'|'preparing'|'ready'|'delivered'|'paid'|'cancelled';
  public total_amount!: number;
  public customizations!: object | null;
  public notes!: string | null;
  public payment_status!: 'pending'|'paid'|'failed';
  public payment_method!: 'zalopay'|'momo'|'cash'|null;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
}

export function initOrderModel(sequelize: Sequelize) {
  Order.init({
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    user_id: { type: DataTypes.CHAR(36), allowNull: true },
    reservation_id: { type: DataTypes.CHAR(36), allowNull: true },
    table_id: { type: DataTypes.CHAR(36), allowNull: true },
    table_group_id: { type: DataTypes.CHAR(36), allowNull: true },
    voucher_id: { type: DataTypes.CHAR(36), allowNull: true },
    status: { type: DataTypes.ENUM('pending','preparing','ready','delivered','paid','cancelled'), defaultValue: 'pending' },
    total_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    customizations: { type: DataTypes.JSON, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    payment_status: { type: DataTypes.ENUM('pending','paid','failed'), defaultValue: 'pending' },
    payment_method: { type: DataTypes.ENUM('zalopay','momo','cash'), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'orders',
    timestamps: false
  });
}
