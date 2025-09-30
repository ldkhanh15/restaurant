import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface UserAttributes {
  id: string
  username: string
  email: string
  phone?: string
  password_hash: string
  role: "customer" | "employee" | "admin"
  full_name?: string
  preferences?: any
  ranking: "regular" | "vip" | "platinum"
  points: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "ranking" | "points"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string
  public username!: string
  public email!: string
  public phone?: string
  public password_hash!: string
  public role!: "customer" | "employee" | "admin"
  public full_name?: string
  public preferences?: any
  public ranking!: "regular" | "vip" | "platinum"
  public points!: number
  public created_at?: Date
  public updated_at?: Date
  public deleted_at?: Date | null
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("customer", "employee", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ranking: {
      type: DataTypes.ENUM("regular", "vip", "platinum"),
      defaultValue: "regular",
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
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
    tableName: "users",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
)

export default User
