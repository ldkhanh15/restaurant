import { Op } from "sequelize";
import ChatSession from "../models/ChatSession";
import ChatMessage from "../models/ChatMessage";
import { User } from "../models";

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
  // Ensure only one active session per user
  if (userId) {
    const existingActive = await ChatSession.findOne({
      where: { user_id: userId, status: "active" },
    });
    if (existingActive) {
      return existingActive;
    }
  }

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

export const getSessionsByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await ChatSession.findAndCountAll({
    where: { user_id: userId },
    include: [
      {
        model: User,
        as: "user",
      },
    ],
    order: [["start_time", "DESC"]],
    limit,
    offset,
  });
  return { rows, count };
};

export interface ChatSessionFilters {
  page?: number;
  limit?: number;
  customer_name?: string;
  status?: string;
  sort_by?: "start_time" | "last_message";
  sort_order?: "ASC" | "DESC";
}

export const getAllSessions = async (filters: ChatSessionFilters = {}) => {
  const {
    page = 1,
    limit = 10,
    customer_name,
    status,
    sort_by = "last_message",
    sort_order = "DESC",
  } = filters;
  const offset = (page - 1) * limit;

  const where: any = {};

  // Filter by status
  if (status && status !== "all") {
    where.status = status;
  }

  // Filter by customer name (username or full_name)
  const userWhere: any = {};
  if (customer_name) {
    userWhere[Op.or] = [
      { username: { [Op.like]: `%${customer_name}%` } },
      { full_name: { [Op.like]: `%${customer_name}%` } },
    ];
  }

  // Build include with optional user filter
  const include: any[] = [];
  if (Object.keys(userWhere).length > 0) {
    include.push({
      model: User,
      as: "user",
      where: userWhere,
      required: true,
    });
  } else {
    include.push({
      model: User,
      as: "user",
    });
  }

  // Include messages for sorting by last message
  if (sort_by === "last_message") {
    include.push({
      model: ChatMessage,
      as: "messages",
      attributes: ["timestamp"],
      separate: true,
      limit: 1,
      order: [["timestamp", "DESC"]],
    });
  }

  // Determine sort order
  let order: any[];
  if (sort_by === "last_message") {
    // Sort by the latest message timestamp
    // This requires a subquery or we sort after fetching
    order = [["start_time", sort_order]];
  } else {
    order = [[sort_by || "start_time", sort_order || "DESC"]];
  }

  const { rows, count } = await ChatSession.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order,
    distinct: true, // Important for count when using includes
  });

  // If sorting by last message, sort results after fetching
  if (sort_by === "last_message") {
    rows.sort((a, b) => {
      const aLastMessage =
        (a as any).messages?.[0]?.timestamp || a.start_time || new Date(0);
      const bLastMessage =
        (b as any).messages?.[0]?.timestamp || b.start_time || new Date(0);
      const aTime = new Date(aLastMessage).getTime();
      const bTime = new Date(bLastMessage).getTime();
      return sort_order === "DESC" ? bTime - aTime : aTime - bTime;
    });
  }

  return { rows, count, page, limit };
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
  senderId?: string | null;
  status?: "pending" | "sent" | "delivered" | "read" | "failed";
}

export const addMessage = async ({
  sessionId,
  senderType,
  messageText,
  senderId,
  status,
}: AddMessageParams) => {
  const message = await ChatMessage.create({
    session_id: sessionId,
    sender_type: senderType,
    message_text: messageText,
    sender_id: senderId || null,
    status: status || "sent",
  });

  // Update session last activity (if needed)
  // Note: message_count and last_activity fields were removed from simplified model

  return message;
};

export const getMessagesBySession = async (
  sessionId: string,
  page: number = 1,
  limit: number = 50
) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await ChatMessage.findAndCountAll({
    where: { session_id: sessionId },
    order: [["timestamp", "ASC"]],
    limit,
    offset,
  });
  return { rows, count };
};

export const markMessagesRead = async (
  sessionId: string,
  messageIds?: string[]
) => {
  const where: any = { session_id: sessionId, is_read: false };
  if (messageIds && messageIds.length > 0) {
    where.id = messageIds;
  }
  const [count] = await ChatMessage.update(
    { is_read: true, status: "read" },
    { where }
  );
  return { updated: count };
};

export const closeSession = async (sessionId: string) => {
  const session = await ChatSession.findByPk(sessionId);
  if (!session) return null;
  session.set("status", "closed");
  session.set("end_time", new Date());
  await session.save();
  return session;
};

export const reopenSession = async (sessionId: string) => {
  const session = await ChatSession.findByPk(sessionId);
  if (!session) return null;
  session.set("status", "active");
  session.set("end_time", null);
  await session.save();
  return session;
};

// Get or create session for user - ensures only one active session per user
export const getOrCreateUserSession = async (userId: string) => {
  // First try to find existing active session
  let session = await ChatSession.findOne({
    where: { user_id: userId, status: "active" },
  });

  if (!session) {
    // Create new session if none exists
    session = await createSession({
      userId,
      channel: "web",
      context: {},
      botEnabled: true,
    });
  }

  return session;
};

// Get active session for user
export const getActiveUserSession = async (userId: string) => {
  return ChatSession.findOne({
    where: { user_id: userId, status: "active" },
  });
};
