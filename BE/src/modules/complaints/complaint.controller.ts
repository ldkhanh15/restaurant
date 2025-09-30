import { Request, Response } from "express";
import { ComplaintService } from "./complaint.service";

export const ComplaintController = {
  async list(req: Request, res: Response) {
    try {
      const data = await ComplaintService.list(req.query);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const data = await ComplaintService.get(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Complaint not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await ComplaintService.create(req.body);
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await ComplaintService.update(req.params.id, req.body);
      if (!data)
        return res.status(404).json({ message: "Complaint not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, resolution } = req.body;
      const data = await ComplaintService.updateStatus(
        req.params.id,
        status,
        resolution
      );
      if (!data)
        return res.status(404).json({ message: "Complaint not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async assign(req: Request, res: Response) {
    try {
      const { assignedToId } = req.body;
      const data = await ComplaintService.assign(req.params.id, assignedToId);
      if (!data)
        return res.status(404).json({ message: "Complaint not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async addResponse(req: Request, res: Response) {
    try {
      const { response, respondentId } = req.body;
      const data = await ComplaintService.addResponse(
        req.params.id,
        response,
        respondentId
      );
      if (!data)
        return res.status(404).json({ message: "Complaint not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getUserComplaints(req: Request, res: Response) {
    try {
      const data = await ComplaintService.getUserComplaints(req.params.userId);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
