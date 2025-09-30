import { ChatSession, ChatMessage, User } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import {
  CreateChatSessionDTO,
  UpdateChatSessionDTO,
  CreateChatMessageDTO,
} from "../../types/dtos/chat.dto";

export const ChatService = {
  async listSessions(filters?: Partial<CreateChatSessionDTO>) {
    return ChatSession.findAll({
      where: filters,
      include: [
        {
          model: User,
          attributes: ["id", "full_name", "email"],
        },
        {
          model: ChatMessage,
          limit: 1,
          order: [["timestamp", "DESC"]],
        },
      ],
      order: [["start_time", "DESC"]],
    });
  },

  async getSession(id: string) {
    return ChatSession.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "full_name", "email"],
        },
        {
          model: ChatMessage,
          order: [["timestamp", "ASC"]],
        },
      ],
    });
  },

  async createSession(payload: CreateChatSessionDTO) {
    const id = payload.id || uuidv4();
    const session = await ChatSession.create({
      id,
      ...payload,
      start_time: new Date(),
      status: payload.status || "active",
    });
    return this.getSession(session.id);
  },

  async updateSession(id: string, payload: UpdateChatSessionDTO) {
    const session = await ChatSession.findByPk(id);
    if (!session) return null;
    await session.update(payload);
    return this.getSession(id);
  },

  async closeSession(id: string) {
    const session = await ChatSession.findByPk(id);
    if (!session) return null;
    await session.update({
      status: "closed",
      end_time: new Date(),
    });
    return this.getSession(id);
  },

  async addMessage(sessionId: string, payload: CreateChatMessageDTO) {
    const session = await ChatSession.findByPk(sessionId);
    if (!session) return null;

    const message = await ChatMessage.create({
      id: uuidv4(),
      session_id: sessionId,
      ...payload,
      timestamp: new Date(),
    });

    // If message is from human agent, update session
    if (payload.sender_type === "human") {
      await session.update({ handled_by: payload.sender_id });
    }

    return message;
  },

  async getMessages(sessionId: string, limit = 50, offset = 0) {
    return ChatMessage.findAll({
      where: { session_id: sessionId },
      order: [["timestamp", "ASC"]],
      limit,
      offset,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "full_name", "email"],
        },
      ],
    });
  },
};
