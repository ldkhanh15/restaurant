import { Request, Response } from "express";
import { PayrollService } from "./payroll.service";

export const PayrollController = {
  async list(_req: Request, res: Response) {
    try {
      const data = await PayrollService.list();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const data = await PayrollService.get(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Payroll record not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async getByEmployee(req: Request, res: Response) {
    try {
      const data = await PayrollService.getByEmployee(req.params.employeeId);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async calculate(req: Request, res: Response) {
    try {
      const { employee_id, period_start, period_end } = req.body;
      const data = await PayrollService.calculatePayroll(
        employee_id,
        new Date(period_start),
        new Date(period_end)
      );
      if (!data) return res.status(404).json({ message: "Employee not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await PayrollService.create(req.body);
      if (!data) return res.status(404).json({ message: "Employee not found" });
      res.status(201).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await PayrollService.update(req.params.id, req.body);
      if (!data)
        return res.status(404).json({ message: "Payroll record not found" });
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const ok = await PayrollService.remove(req.params.id);
      if (!ok)
        return res.status(404).json({ message: "Payroll record not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  },
};
