import type { Request, Response, NextFunction } from "express";
import {
  createChatSession,
  disableBot,
  enableBot,
  listMessages,
  listUserSessions,
  sendMessage,
  listAllSessions,
  closeChatSession,
  reopenChatSession,
} from "../services/chatService";
import { getIO } from "../sockets";
import {
  buildPaginationResult,
  getPaginationParams,
} from "../utils/pagination";

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id || req.body.user_id;
    const { channel = "web", context = {}, botEnabled = true } = req.body || {};
    const session = await createChatSession(
      userId,
      channel,
      context,
      botEnabled
    );
    res.status(201).json({ status: "success", data: session });
  } catch (err) {
    next(err);
  }
};

export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(400)
        .json({ status: "error", message: "Missing user id" });
    const { page = 1, limit = 10 } = getPaginationParams(req.query);
    const result = await listUserSessions(userId, page, limit);
    const paginatedResult = buildPaginationResult(
      result.rows,
      result.count,
      page,
      limit
    );
    res.json({ status: "success", data: paginatedResult });
  } catch (err) {
    next(err);
  }
};

// Get active session for current user (returns first active session or creates new one)
export const getActiveUserSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing user id" });
    }

    // Get active session
    const { getActiveSession, getUserSession } = await import(
      "../services/chatService"
    );

    let activeSession = await getActiveSession(userId);

    // If no active session, create one
    if (!activeSession) {
      activeSession = await getUserSession(userId);
    }

    if (!activeSession) {
      return res
        .status(404)
        .json({ status: "error", message: "No session found" });
    }

    res.json({ status: "success", data: activeSession });
  } catch (err) {
    next(err);
  }
};

export const getAllSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10 } = getPaginationParams(req.query);
    const { customer_name, status, sort_by, sort_order } = req.query;

    const result = await listAllSessions(page, limit, {
      customer_name: customer_name as string,
      status: status as string,
      sort_by: (sort_by as "start_time" | "last_message") || undefined,
      sort_order: (sort_order as "ASC" | "DESC") || undefined,
    });
    const paginatedResult = buildPaginationResult(
      result.rows,
      result.count,
      page,
      limit
    );
    res.json({ status: "success", data: paginatedResult });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = getPaginationParams(req.query);
    const result = await listMessages(id, page, limit);
    const paginatedResult = buildPaginationResult(
      result.rows,
      result.count,
      page,
      limit
    );
    res.json({ status: "success", data: paginatedResult });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // session id
    const { message_ids } = req.body as { message_ids?: string[] };
    const result = await (
      await import("../services/chatService")
    ).markMessagesAsRead(id, message_ids);
    res.json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

export const postMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const io = getIO();
    const { id } = req.params;
    const { message_text, sender_type } = req.body;
    const userId = req.user?.id;
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : undefined;
    const saved = await sendMessage(
      io,
      id,
      sender_type || "user",
      message_text,
      userId,
      token
    );
    res.status(201).json({ status: "success", data: saved });
  } catch (err) {
    next(err);
  }
};

export const closeSessionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const session = await closeChatSession(id);
    if (!session)
      return res
        .status(404)
        .json({ status: "error", message: "Session not found" });
    res.json({ status: "success", data: session });
  } catch (err) {
    next(err);
  }
};

export const reopenSessionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const session = await reopenChatSession(id);
    if (!session)
      return res
        .status(404)
        .json({ status: "error", message: "Session not found" });
    res.json({ status: "success", data: session });
  } catch (err) {
    next(err);
  }
};

export const enableBotMode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const session = await enableBot(id);
    if (!session)
      return res
        .status(404)
        .json({ status: "error", message: "Session not found" });
    res.json({ status: "success", data: session });
  } catch (err) {
    next(err);
  }
};

export const disableBotMode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const session = await disableBot(id);
    if (!session)
      return res
        .status(404)
        .json({ status: "error", message: "Session not found" });
    res.json({ status: "success", data: session });
  } catch (err) {
    next(err);
  }
};
