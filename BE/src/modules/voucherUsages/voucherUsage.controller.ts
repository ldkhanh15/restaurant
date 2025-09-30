import { Request, Response } from "express";
import { VoucherUsageService } from "./voucherUsage.service";

// created_by_cursor: true
export const VoucherUsageController = {
    async list(_req: Request, res: Response) {
        try {
            const data = await VoucherUsageService.list();
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async get(req: Request, res: Response) {
        try {
            const data = await VoucherUsageService.get(req.params.id);
            if (!data) return res.status(404).json({ message: "Voucher usage not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await VoucherUsageService.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await VoucherUsageService.update(req.params.id, req.body);
            if (!data) return res.status(404).json({ message: "Voucher usage not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const ok = await VoucherUsageService.remove(req.params.id);
            if (!ok) return res.status(404).json({ message: "Voucher usage not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },
}; 