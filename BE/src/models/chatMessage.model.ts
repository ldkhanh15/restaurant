import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface ChatMessageAttributes {
  id: string;
  session_id?: string | null;
  sender_type: "user" | "bot" | "human";
  message_text: string;
  timestamp?: Date;
}

type ChatMessageCreation = Optional<ChatMessageAttributes, "id" | "timestamp">;

export class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreation>
  implements ChatMessageAttributes
{
  public id!: string;
  public session_id!: string | null;
  public sender_type!: "user" | "bot" | "human";
  public message_text!: string;
  public timestamp!: Date;
}

export function initChatMessageModel(sequelize: Sequelize) {
  ChatMessage.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      session_id: { type: DataTypes.CHAR(36), allowNull: true },
      sender_type: {
        type: DataTypes.ENUM("user", "bot", "human"),
        allowNull: false,
      },
      message_text: { type: DataTypes.TEXT, allowNull: false },
      timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "chat_messages",
      timestamps: false,
    }
  );
}
