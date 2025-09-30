import { Voucher } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { getIO } from "../../sockets/io";
import {
  CreateVoucherDTO,
  UpdateVoucherDTO,
} from "../../types/dtos/voucher.dto";

export const VoucherService = {
  async list() {
    return Voucher.findAll({
      order: [["created_at", "DESC"]],
      where: { deleted_at: null },
    });
  },

  async get(id: string) {
    return Voucher.findByPk(id);
  },

  async create(payload: CreateVoucherDTO) {
    const id = payload.id || uuidv4();
    const voucher = await Voucher.create({
      id,
      ...payload,
      current_uses: 0,
      created_at: new Date(),
    });

    getIO().emit("voucher-created", voucher);
    return voucher;
  },

  async update(id: string, payload: UpdateVoucherDTO) {
    const voucher = await Voucher.findByPk(id);
    if (!voucher) return null;

    await voucher.update(payload);
    getIO().emit("voucher-updated", voucher);
    return voucher;
  },

  async remove(id: string) {
    const voucher = await Voucher.findByPk(id);
    if (!voucher) return false;

    await voucher.update({ deleted_at: new Date() });
    getIO().emit("voucher-deleted", { id });
    return true;
  },
};
