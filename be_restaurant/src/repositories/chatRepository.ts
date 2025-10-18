import ChatSession from "../models/ChatSession";
import ChatMessage from "../models/ChatMessage";

export interface CreateSessionParams {
  userId?: string;
  channel?: "web" | "app" | "zalo";
  context?: any;
  botEnabled?: boolean;
}

export const createSession = async ({
  userId,
  channel = "web",
  context = {},
  botEnabled = true,
}: CreateSessionParams) => {
  const session = await ChatSession.create({
    user_id: userId,
    is_authenticated: Boolean(userId),
    channel,
    context,
    status: "active",
    handled_by: botEnabled ? "bot" : "human",
    bot_enabled: botEnabled,
  });
  return session;
};

export const getSessionsByUser = async (userId: string) => {
  return ChatSession.findAll({
    where: { user_id: userId },
    order: [["start_time", "DESC"]],
  });
};

export const getSessionById = async (sessionId: string) => {
  return ChatSession.findByPk(sessionId);
};

export const setBotEnabled = async (sessionId: string, enabled: boolean) => {
  const session = await ChatSession.findByPk(sessionId);
  if (!session) return null;
  session.set("bot_enabled", enabled);
  session.set("handled_by", enabled ? "bot" : "human");
  await session.save();
  return session;
};

export interface AddMessageParams {
  sessionId: string;
  senderType: "user" | "bot" | "human";
  messageText: string;
}

export const addMessage = async ({
  sessionId,
  senderType,
  messageText,
}: AddMessageParams) => {
  return ChatMessage.create({
    session_id: sessionId,
    sender_type: senderType,
    message_text: messageText,
  });
};

export const getMessagesBySession = async (sessionId: string) => {
  return ChatMessage.findAll({
    where: { session_id: sessionId },
    order: [["timestamp", "ASC"]],
  });
};

export const closeSession = async (sessionId: string) => {
  const session = await ChatSession.findByPk(sessionId);
  if (!session) return null;
  session.set("status", "closed");
  session.set("end_time", new Date());
  await session.save();
  return session;
};
