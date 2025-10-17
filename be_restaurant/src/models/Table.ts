import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface TableAttributes {
  id: string
  table_number: string
  capacity: number
  deposit: number
  cancel_minutes: number
  location?: string
  status: "available" | "occupied" | "cleaning" | "reserved"
  panorama_urls?: any
  amenities?: any
  description?: string
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface TableCreationAttributes
  extends Optional<TableAttributes, "id" | "deposit" | "cancel_minutes" | "status"> {}

class Table extends Model<TableAttributes, TableCreationAttributes> implements TableAttributes {
  public id!: string
  public table_number!: string
  public capacity!: number
  public deposit!: number
  public cancel_minutes!: number
  public location?: any
  public status!: "available" | "occupied" | "cleaning" | "reserved"
  public panorama_urls?: any
  public amenities?: any
  public description?: string
  public created_at?: Date
  public updated_at?: Date
  public deleted_at?: Date | null
}

Table.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    table_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: 'table_number_unique',
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    deposit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    cancel_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("available", "occupied", "cleaning", "reserved"),
      defaultValue: "available",
    },
    panorama_urls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    amenities: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "tables",
    timestamps: true,
    paranoid: false,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
)

export default Table
