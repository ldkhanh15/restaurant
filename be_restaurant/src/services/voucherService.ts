import { BaseService } from "./baseService";
import Voucher from "../models/Voucher";
import { Op } from "sequelize";

class VoucherService extends BaseService<Voucher> {
  constructor() {
    super(Voucher);
  }

  async findActiveVouchers() {
    const now = new Date();
    return await this.model.findAll({
      where: {
        active: true,
        expiry_date: { [Op.gte]: now },
      },
    });
  }
}

export default new VoucherService();
