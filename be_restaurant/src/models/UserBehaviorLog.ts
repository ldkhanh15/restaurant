import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface UserBehaviorLogAttributes {
  id: string
  user_id?: string
  action_type?: string
  details?: any
  timestamp?: Date
}

interface UserBehaviorLogCreationAttributes extends Optional<UserBehaviorLogAttributes, "id"> {}

class UserBehaviorLog
  extends Model<UserBehaviorLogAttributes, UserBehaviorLogCreationAttributes>
  implements UserBehaviorLogAttributes
{
  public id!: string
  public user_id?: string
  public action_type?: string
  public details?: any
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
    action_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
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
