import { Request, Response } from "express";
import { BlogPostService } from "./blog.service";

export const BlogPostController = {
  async list(_req: Request, res: Response) {
    try {
      const data = await BlogPostService.list();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const data = await BlogPostService.get(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Blog post not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await BlogPostService.create(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await BlogPostService.update(req.params.id, req.body);
      if (!data)
        return res.status(404).json({ message: "Blog post not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async publish(req: Request, res: Response) {
    try {
      const data = await BlogPostService.publish(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Blog post not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const ok = await BlogPostService.remove(req.params.id);
      if (!ok) return res.status(404).json({ message: "Blog post not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
