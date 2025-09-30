import { AttendanceLog } from "../../models/index";
import { v4 as uuidv4 } from "uuid";

export const AttendanceService = {
    async list() {
        return AttendanceLog.findAll({ order: [["created_at", "DESC"]] });
    },

    async get(id: string) {
        return AttendanceLog.findByPk(id);
    },

    async create(payload: any) {
        const id = payload.id || uuidv4();
        const item = await AttendanceLog.create({ id, ...payload, created_at: new Date() });
        return item;
    },

    async update(id: string, payload: any) {
        const item = await AttendanceLog.findByPk(id);
        if (!item) return null;
        await item.update({ ...payload });
        return item;
    },

    async remove(id: string) {
        const item = await AttendanceLog.findByPk(id);
        if (!item) return false;
        await item.destroy();
        return true;
    },
}; 