import { BaseService } from "./baseService"
import Voucher from "../models/Voucher"
import VoucherUsage from "../models/VoucherUsage"
import { Op } from "sequelize"

class VoucherService extends BaseService<Voucher> {
  constructor() {
    super(Voucher)
  }

  async findActiveVouchers() {
    const now = new Date()
    return await this.model.findAll({
      where: {
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now },
      },
    })
  }

  async findUserVouchers(userId: string) {
    const now = new Date()
    const allVouchers = await this.model.findAll({ where: { isActive: true } })
    const usedVoucherIds = (
      await VoucherUsage.findAll({
        where: { user_id: userId },
        attributes: ["voucher_id"],
      })
    ).map((usage: any) => usage.voucher_id)

    const activeVouchers: Voucher[] = []
    const usedVouchers: Voucher[] = []
    const expiredVouchers: Voucher[] = []

    allVouchers.forEach((voucher) => {
      const isUsed = usedVoucherIds.includes((voucher as any).id)
      const isExpired = new Date((voucher as any).endDate) < now

      if (isUsed) {
        usedVouchers.push(voucher)
      } else if (isExpired) {
        expiredVouchers.push(voucher)
      } else {
        // Voucher is not used and not expired, check if it's currently valid and started
        if (new Date((voucher as any).startDate) <= now) {
          activeVouchers.push(voucher)
        }
      }
    })

    return { activeVouchers, usedVouchers, expiredVouchers }
  }
}

export default new VoucherService()
