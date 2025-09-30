import { ChatSessionAttributes } from "../../models/chatSession.model";
import { ChatMessageAttributes } from "../../models/chatMessage.model";

export interface CreateChatSessionDTO {
  user_id: string;
  handled_by?: string;
  subject?: string;
  status?: ChatSessionAttributes["status"];
  priority?: "low" | "medium" | "high";
  metadata?: object;
}

export interface UpdateChatSessionDTO extends Partial<CreateChatSessionDTO> {}

export interface CreateChatMessageDTO {
  session_id: string;
  content: string;
  sender_id?: string;
  sender_type: "user" | "system" | "human";
  message_type?: "text" | "image" | "file";
  metadata?: object;
}

export interface UpdateChatMessageDTO extends Partial<CreateChatMessageDTO> {}
