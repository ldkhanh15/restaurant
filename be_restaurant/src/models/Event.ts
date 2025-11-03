import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface EventAttributes {
  id: string
  name: string
  description?: string
  price: number
  inclusions?: any
  decorations?: any
  created_at?: Date
  deleted_at?: Date | null
}

interface EventCreationAttributes extends Optional<EventAttributes, "id"> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  public id!: string
  public name!: string
  public description?: string
  public price!: number
  public inclusions?: any
  public decorations?: any
  public created_at?: Date
  public deleted_at?: Date | null
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    inclusions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    decorations: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
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
    tableName: "events",
    timestamps: true,
    paranoid: false,
    createdAt: "created_at",
    updatedAt: false,
    deletedAt: "deleted_at",
  },
)

export default Event
