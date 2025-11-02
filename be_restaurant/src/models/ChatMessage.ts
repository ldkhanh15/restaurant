import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ChatMessageAttributes {
  id: string;
  session_id?: string;
  sender_type: "user" | "bot" | "human";
  sender_id?: string | null;
  message_text: string;
  timestamp?: Date;
}

interface ChatMessageCreationAttributes
  extends Optional<ChatMessageAttributes, "id"> {}

class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes
{
  public id!: string;
  public session_id?: string;
  public sender_type!: "user" | "bot" | "human";
  public sender_id?: string | null;
  public message_text!: string;
  public timestamp?: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "chat_sessions",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    sender_type: {
      type: DataTypes.ENUM("user", "bot", "human"),
      allowNull: false,
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "chat_messages",
    timestamps: true,
    createdAt: "timestamp",
    updatedAt: false,
  }
);

export default ChatMessage;
