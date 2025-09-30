import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface OrderItemAttributes {
  id: string;
  order_id?: string | null;
  dish_id?: string | null;
  quantity: number;
  price: number;
  customizations?: object | null;
  status?: 'pending'|'completed';
  estimated_wait_time?: number | null;
  completed_at?: Date | null;
  created_at?: Date;
}
type OrderItemCreation = Optional<OrderItemAttributes, 'id'|'order_id'|'dish_id'|'customizations'|'status'|'estimated_wait_time'|'completed_at'|'created_at'>;

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreation> implements OrderItemAttributes {
  public id!: string;
  public order_id!: string | null;
  public dish_id!: string | null;
  public quantity!: number;
  public price!: number;
  public customizations!: object | null;
  public status!: 'pending'|'completed';
  public estimated_wait_time!: number | null;
  public completed_at!: Date | null;
  public created_at!: Date;
}

export function initOrderItemModel(sequelize: Sequelize) {
  OrderItem.init({
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    order_id: { type: DataTypes.CHAR(36), allowNull: true },
    dish_id: { type: DataTypes.CHAR(36), allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    customizations: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.ENUM('pending','completed'), defaultValue: 'pending' },
    estimated_wait_time: { type: DataTypes.INTEGER, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    tableName: 'order_items',
    timestamps: false
  });
}
