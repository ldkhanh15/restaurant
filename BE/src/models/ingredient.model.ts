import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface IngredientAttributes {
  id: string;
  name: string;
  unit: string;
  barcode?: string | null;
  rfid?: string | null;
  min_stock_level?: number;
  current_stock?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
type IngredientCreation = Optional<IngredientAttributes, 'id'|'barcode'|'rfid'|'min_stock_level'|'current_stock'|'created_at'|'updated_at'|'deleted_at'>;

export class Ingredient extends Model<IngredientAttributes, IngredientCreation> implements IngredientAttributes {
  public id!: string;
  public name!: string;
  public unit!: string;
  public barcode!: string | null;
  public rfid!: string | null;
  public min_stock_level!: number;
  public current_stock!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
}

export function initIngredientModel(sequelize: Sequelize) {
  Ingredient.init({
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: false },
    barcode: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    rfid: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    min_stock_level: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    current_stock: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'ingredients',
    timestamps: false
  });
}
