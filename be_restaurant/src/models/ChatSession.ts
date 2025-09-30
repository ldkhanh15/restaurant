import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface ChatSessionAttributes {
  id: string
  user_id?: string
  is_authenticated: boolean
  channel: "web" | "app" | "zalo"
  context?: any
  start_time?: Date
  end_time?: Date
  status: "active" | "closed"
  handled_by: "bot" | "human"
}

interface ChatSessionCreationAttributes
  extends Optional<ChatSessionAttributes, "id" | "is_authenticated" | "channel" | "status" | "handled_by"> {}

class ChatSession extends Model<ChatSessionAttributes, ChatSessionCreationAttributes> implements ChatSessionAttributes {
  public id!: string
  public user_id?: string
  public is_authenticated!: boolean
  public channel!: "web" | "app" | "zalo"
  public context?: any
  public start_time?: Date
  public end_time?: Date
  public status!: "active" | "closed"
  public handled_by!: "bot" | "human"
}

ChatSession.init(
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
      onDelete: "SET NULL",
    },
    is_authenticated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    channel: {
      type: DataTypes.ENUM("web", "app", "zalo"),
      defaultValue: "web",
    },
    context: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "closed"),
      defaultValue: "active",
    },
    handled_by: {
      type: DataTypes.ENUM("bot", "human"),
      defaultValue: "bot",
    },
  },
  {
    sequelize,
    tableName: "chat_sessions",
    timestamps: false,
  },
)

export default ChatSession
