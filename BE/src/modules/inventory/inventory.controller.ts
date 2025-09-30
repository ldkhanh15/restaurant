import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";

export const InventoryController = {
  async listImports(_req: Request, res: Response) {
    try {
      const data = await InventoryService.listImports();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getImport(req: Request, res: Response) {
    try {
      const data = await InventoryService.getImport(req.params.id);
      if (!data) return res.status(404).json({ message: "Import not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async createImport(req: Request, res: Response) {
    try {
      const data = await InventoryService.createImport(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateImport(req: Request, res: Response) {
    try {
      const data = await InventoryService.updateImport(req.params.id, req.body);
      if (!data) return res.status(404).json({ message: "Import not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async removeImport(req: Request, res: Response) {
    try {
      const ok = await InventoryService.removeImport(req.params.id);
      if (!ok) return res.status(404).json({ message: "Import not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
