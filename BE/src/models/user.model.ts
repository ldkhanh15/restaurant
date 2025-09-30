import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface UserAttributes {
  id: string;
  username: string;
  email: string;
  phone?: string | null;
  password_hash: string;
  role: 'customer' | 'employee' | 'admin';
  full_name?: string | null;
  preferences?: object | null;
  ranking?: 'regular' | 'vip' | 'platinum';
  points?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
type UserCreation = Optional<UserAttributes, 'id'|'phone'|'full_name'|'preferences'|'ranking'|'points'|'created_at'|'updated_at'|'deleted_at'>;

export class User extends Model<UserAttributes, UserCreation> implements UserAttributes {
  public id!: string;
  public username!: string;
  public email!: string;
  public phone!: string | null;
  public password_hash!: string;
  public role!: 'customer' | 'employee' | 'admin';
  public full_name!: string | null;
  public preferences!: object | null;
  public ranking!: 'regular' | 'vip' | 'platinum';
  public points!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
}

export function initUserModel(sequelize: Sequelize) {
  User.init({
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('customer','employee','admin'), allowNull: false, defaultValue: 'customer' },
    full_name: { type: DataTypes.STRING(100), allowNull: true },
    preferences: { type: DataTypes.JSON, allowNull: true },
    ranking: { type: DataTypes.ENUM('regular','vip','platinum'), defaultValue: 'regular' },
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'users',
    timestamps: false
  });
}
