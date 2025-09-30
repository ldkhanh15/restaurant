import { VoucherUsage, Voucher } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { getIO } from "../../sockets/io";
import {
  CreateVoucherUsageDTO,
  UpdateVoucherUsageDTO,
} from "../../types/dtos/voucher.dto";
import { sequelize } from "../../config/database";

export const VoucherUsageService = {
  async list() {
    return VoucherUsage.findAll({
      order: [["used_at", "DESC"]],
      include: [Voucher],
    });
  },

  async get(id: string) {
    return VoucherUsage.findByPk(id, {
      include: [Voucher],
    });
  },

  async create(payload: CreateVoucherUsageDTO) {
    const t = await sequelize.transaction();

    try {
      const id = payload.id || uuidv4();
      const voucher = await Voucher.findByPk(payload.voucher_id, {
        transaction: t,
      });

      if (!voucher) {
        await t.rollback();
        throw new Error("Voucher not found");
      }

      if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
        await t.rollback();
        throw new Error("Voucher usage limit exceeded");
      }

      const usage = await VoucherUsage.create(
        {
          id,
          ...payload,
          used_at: new Date(),
        },
        { transaction: t }
      );

      await voucher.increment("current_uses", { transaction: t });

      await t.commit();
      getIO().emit("voucher-usage-created", usage);
      return this.get(usage.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async update(id: string, payload: UpdateVoucherUsageDTO) {
    const usage = await VoucherUsage.findByPk(id);
    if (!usage) return null;

    await usage.update(payload);
    getIO().emit("voucher-usage-updated", usage);
    return this.get(id);
  },

  async remove(id: string) {
    const t = await sequelize.transaction();

    try {
      const usage = await VoucherUsage.findByPk(id, {
        include: [Voucher],
        transaction: t,
      });

      if (!usage) {
        await t.rollback();
        return false;
      }

      if (usage.voucher) {
        await usage.voucher.decrement("current_uses", { transaction: t });
      }

      await usage.destroy({ transaction: t });

      await t.commit();
      getIO().emit("voucher-usage-deleted", { id });
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
