import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface DishAttributes {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category_id: string;
  media_urls?: object | null;
  is_best_seller?: boolean;
  seasonal?: boolean;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
type DishCreation = Optional<DishAttributes, 'id'|'description'|'media_urls'|'is_best_seller'|'seasonal'|'active'|'created_at'|'updated_at'|'deleted_at'>;

export class Dish extends Model<DishAttributes, DishCreation> implements DishAttributes {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public category_id!: string;
  public media_urls!: object | null;
  public is_best_seller!: boolean;
  public seasonal!: boolean;
  public active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
}

export function initDishModel(sequelize: Sequelize) {
  Dish.init({
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    category_id: { type: DataTypes.CHAR(36), allowNull: false },
    media_urls: { type: DataTypes.JSON, allowNull: true },
    is_best_seller: { type: DataTypes.BOOLEAN, defaultValue: false },
    seasonal: { type: DataTypes.BOOLEAN, defaultValue: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'dishes',
    timestamps: false
  });
}
