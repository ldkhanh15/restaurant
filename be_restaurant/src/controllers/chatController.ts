import type { Request, Response, NextFunction } from "express";
import {
  createChatSession,
  disableBot,
  enableBot,
  listMessages,
  listUserSessions,
  sendMessage,
} from "../services/chatService";
import { getIO } from "../sockets";

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
    res.status(201).json(session);
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
    if (!userId) return res.status(400).json({ message: "Missing user id" });
    const sessions = await listUserSessions(userId);
    res.json(sessions);
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
    const messages = await listMessages(id);
    res.json(messages);
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
    const saved = await sendMessage(
      io,
      id,
      sender_type || "user",
      message_text,
      userId
    );
    res.status(201).json(saved);
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
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
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
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (err) {
    next(err);
  }
};
