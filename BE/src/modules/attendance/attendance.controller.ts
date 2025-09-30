import { Request, Response } from "express";
import { AttendanceService } from "./attendance.service";

export const AttendanceController = {
    async list(_req: Request, res: Response) {
        try {
            const data = await AttendanceService.list();
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async get(req: Request, res: Response) {
        try {
            const data = await AttendanceService.get(req.params.id);
            if (!data) return res.status(404).json({ message: "Attendance not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await AttendanceService.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await AttendanceService.update(req.params.id, req.body);
            if (!data) return res.status(404).json({ message: "Attendance not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const ok = await AttendanceService.remove(req.params.id);
            if (!ok) return res.status(404).json({ message: "Attendance not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },
}; 