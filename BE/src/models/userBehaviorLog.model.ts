import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface UserBehaviorLogAttributes {
  id: string;
  user_id?: string | null;
  action_type?: string | null;
  details?: object | null;
  timestamp?: Date;
}

type UserBehaviorLogCreation = Optional<
  UserBehaviorLogAttributes,
  "id" | "action_type" | "details" | "timestamp"
>;

export class UserBehaviorLog
  extends Model<UserBehaviorLogAttributes, UserBehaviorLogCreation>
  implements UserBehaviorLogAttributes
{
  public id!: string;
  public user_id!: string | null;
  public action_type!: string | null;
  public details!: object | null;
  public timestamp!: Date;
}

export function initUserBehaviorLogModel(sequelize: Sequelize) {
  UserBehaviorLog.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      user_id: { type: DataTypes.CHAR(36), allowNull: true },
      action_type: { type: DataTypes.STRING(50), allowNull: true },
      details: { type: DataTypes.JSON, allowNull: true },
      timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "user_behavior_logs",
      timestamps: false,
    }
  );
}
