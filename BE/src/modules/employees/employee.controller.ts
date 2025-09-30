import { Request, Response } from "express";
import { EmployeeService } from "./employee.service";

export const EmployeeController = {
  async list(_req: Request, res: Response) {
    const data = await EmployeeService.list();
    res.json({ data });
  },

  async get(req: Request, res: Response) {
    const data = await EmployeeService.get(req.params.id);
    if (!data) return res.status(404).json({ message: "Employee not found" });
    res.json({ data });
  },

  async create(req: Request, res: Response) {
    const data = await EmployeeService.create(req.body);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response) {
    const data = await EmployeeService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Employee not found" });
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    const ok = await EmployeeService.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: "Employee not found" });
    res.json({ success: true });
  },

  async checkIn(req: Request, res: Response) {
    const { id } = req.params;
    const { face_image_url } = req.body;
    const data = await EmployeeService.checkIn(id, face_image_url);
    if (!data) return res.status(404).json({ message: "Employee not found" });
    res.json({ data });
  },

  async checkOut(req: Request, res: Response) {
    const { id } = req.params;
    const data = await EmployeeService.checkOut(id);
    if (!data)
      return res.status(404).json({ message: "No active check-in found" });
    res.json({ data });
  },
};
