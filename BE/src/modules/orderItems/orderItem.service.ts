import { OrderItem } from "../../models/index";
import { v4 as uuidv4 } from "uuid";

export const OrderItemService = {
    async list() {
        return OrderItem.findAll({ order: [["created_at", "DESC"]] });
    },

    async get(id: string) {
        return OrderItem.findByPk(id);
    },

    async create(payload: any) {
        const id = payload.id || uuidv4();
        const item = await OrderItem.create({ id, ...payload, created_at: new Date() });
        return item;
    },

    async update(id: string, payload: any) {
        const item = await OrderItem.findByPk(id);
        if (!item) return null;
        await item.update({ ...payload });
        return item;
    },

    async remove(id: string) {
        const item = await OrderItem.findByPk(id);
        if (!item) return false;
        await item.destroy();
        return true;
    },
}; 