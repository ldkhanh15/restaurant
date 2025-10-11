import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface UserBehaviorLogAttributes {
  id: string
  user_id?: string
  item_id?: string
  action_type?: string
  search_query?: string
  timestamp?: Date
}

interface UserBehaviorLogCreationAttributes extends Optional<UserBehaviorLogAttributes, "id"> {}

class UserBehaviorLog
  extends Model<UserBehaviorLogAttributes, UserBehaviorLogCreationAttributes>
  implements UserBehaviorLogAttributes
{
  public id!: string
  public user_id?: string
  public item_id?: string
  public action_type?: string
  public search_query?: string
  public timestamp?: Date
}

UserBehaviorLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    item_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    action_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    search_query: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "user_behavior_logs",
    timestamps: true,
    createdAt: "timestamp",
    updatedAt: false,
  },
)

export default UserBehaviorLog
