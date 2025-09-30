import { Request, Response } from "express";
import { VoucherService } from "./voucher.service";

// created_by_cursor: true
export const VoucherController = {
    async list(_req: Request, res: Response) {
        try {
            const data = await VoucherService.list();
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async get(req: Request, res: Response) {
        try {
            const data = await VoucherService.get(req.params.id);
            if (!data) return res.status(404).json({ message: "Voucher not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await VoucherService.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await VoucherService.update(req.params.id, req.body);
            if (!data) return res.status(404).json({ message: "Voucher not found" });
            res.json({ data });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const ok = await VoucherService.remove(req.params.id);
            if (!ok) return res.status(404).json({ message: "Voucher not found" });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    },
}; 