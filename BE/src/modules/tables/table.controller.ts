import { Request, Response } from "express";
import { TableService } from "./table.service";

export const TableController = {
  async list(req: Request, res: Response) {
    try {
      const data = await TableService.list(req.query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const data = await TableService.get(req.params.id);
      if (!data) return res.status(404).json({ message: "Table not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await TableService.create(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await TableService.update(req.params.id, req.body);
      if (!data) return res.status(404).json({ message: "Table not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const success = await TableService.delete(req.params.id);
      if (!success) return res.status(404).json({ message: "Table not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      if (
        !["available", "occupied", "reserved", "maintenance"].includes(status)
      ) {
        return res.status(400).json({ message: "Invalid table status" });
      }

      const data = await TableService.updateStatus(req.params.id, status);
      if (!data) return res.status(404).json({ message: "Table not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async assignToGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.body;
      const data = await TableService.assignToGroup(req.params.id, groupId);
      if (!data) return res.status(404).json({ message: "Table not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async findAvailable(req: Request, res: Response) {
    try {
      const { capacity, datetime } = req.query;
      if (!capacity || !datetime) {
        return res
          .status(400)
          .json({ message: "Capacity and datetime are required" });
      }

      const data = await TableService.findAvailable(
        Number(capacity),
        new Date(datetime as string)
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getTableGroups(req: Request, res: Response) {
    try {
      const data = await TableService.getTableGroups();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async createTableGroup(req: Request, res: Response) {
    try {
      const data = await TableService.createTableGroup(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateTableGroup(req: Request, res: Response) {
    try {
      const data = await TableService.updateTableGroup(req.params.id, req.body);
      if (!data)
        return res.status(404).json({ message: "Table group not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async deleteTableGroup(req: Request, res: Response) {
    try {
      const success = await TableService.deleteTableGroup(req.params.id);
      if (!success)
        return res.status(404).json({ message: "Table group not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
