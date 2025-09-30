import { Request, Response } from "express";
import { ChatService } from "./chat.service";

export const ChatController = {
  async listSessions(req: Request, res: Response) {
    try {
      const data = await ChatService.listSessions(req.query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getSession(req: Request, res: Response) {
    try {
      const data = await ChatService.getSession(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Chat session not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async createSession(req: Request, res: Response) {
    try {
      const data = await ChatService.createSession(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateSession(req: Request, res: Response) {
    try {
      const data = await ChatService.updateSession(req.params.id, req.body);
      if (!data)
        return res.status(404).json({ message: "Chat session not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async closeSession(req: Request, res: Response) {
    try {
      const data = await ChatService.closeSession(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Chat session not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async addMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const message = await ChatService.addMessage(id, req.body);
      if (!message)
        return res.status(404).json({ message: "Chat session not found" });
      res.status(201).json({ data: message });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getMessages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      const data = await ChatService.getMessages(
        id,
        Number(limit) || 50,
        Number(offset) || 0
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
