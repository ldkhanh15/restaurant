import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface ChatSessionAttributes {
  id: string;
  user_id?: string | null;
  is_authenticated?: boolean;
  channel?: "web" | "app" | "zalo";
  context?: object | null;
  start_time?: Date;
  end_time?: Date | null;
  status?: "active" | "closed";
  handled_by?: "bot" | "human";
}

type ChatSessionCreation = Optional<
  ChatSessionAttributes,
  | "id"
  | "is_authenticated"
  | "channel"
  | "context"
  | "start_time"
  | "end_time"
  | "status"
  | "handled_by"
>;

export class ChatSession
  extends Model<ChatSessionAttributes, ChatSessionCreation>
  implements ChatSessionAttributes
{
  public id!: string;
  public user_id!: string | null;
  public is_authenticated!: boolean;
  public channel!: "web" | "app" | "zalo";
  public context!: object | null;
  public start_time!: Date;
  public end_time!: Date | null;
  public status!: "active" | "closed";
  public handled_by!: "bot" | "human";
}

export function initChatSessionModel(sequelize: Sequelize) {
  ChatSession.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      user_id: { type: DataTypes.CHAR(36), allowNull: true },
      is_authenticated: { type: DataTypes.BOOLEAN, defaultValue: false },
      channel: {
        type: DataTypes.ENUM("web", "app", "zalo"),
        defaultValue: "web",
      },
      context: { type: DataTypes.JSON, allowNull: true },
      start_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      end_time: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM("active", "closed"),
        defaultValue: "active",
      },
      handled_by: { type: DataTypes.ENUM("bot", "human"), defaultValue: "bot" },
    },
    {
      sequelize,
      tableName: "chat_sessions",
      timestamps: false,
    }
  );
}
