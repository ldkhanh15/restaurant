import { BaseService } from "./baseService"
import Voucher from "../models/Voucher"

class VoucherService extends BaseService<Voucher> {
  constructor() {
    super(Voucher)
  }

  async findActiveVouchers() {
    const now = new Date()
    return await this.model.findAll({
      where: {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    })
  }
}

export default new VoucherService()
