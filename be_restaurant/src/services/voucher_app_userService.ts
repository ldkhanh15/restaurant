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
    // Build where clause and cast to any to accommodate Sequelize's complex Op types
    const where: any = {
      // Use fields defined on Voucher model: `active` and `expiry_date`.
      active: true,
      [Op.or]: [
        // expiry_date may be null (no expiry) or in the future
        { expiry_date: { [Op.is]: null } },
        { expiry_date: { [Op.gte]: now } },
      ],
    }

    return await this.model.findAll({ where })
  }

  async findUserVouchers(userId: string) {
    const now = new Date()
    // Only consider vouchers that are marked active in DB
    const allVouchers = await this.model.findAll({ where: { active: true } })
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
      const v: any = voucher as any
      const isUsed = usedVoucherIds.includes(v.id)

      // expiry_date may be null -> never expires
      const isExpired = v.expiry_date ? new Date(v.expiry_date) < now : false

      if (isUsed) {
        usedVouchers.push(voucher)
      } else if (isExpired) {
        expiredVouchers.push(voucher)
      } else {
        // active and not used/expired -> available to use
        activeVouchers.push(voucher)
      }
    })

    return { activeVouchers, usedVouchers, expiredVouchers }
  }

  /**
   * Return all vouchers in the system (admin-style listing). Excludes nothing by default.
   */
  async findAllVouchers(options: any = {}) {
    // Accept optional Sequelize findAll options from caller (pagination, where, etc.)
    const opts: any = {
      order: [["created_at", "DESC"]],
      ...options,
    }

    return await this.model.findAll(opts)
  }

  /**
   * Generic finder that returns { rows, count } to support paginated controllers.
   * If `options.limit` is provided, uses `findAndCountAll` to return pagination metadata.
   */
  async find(options: any = {}) {
    if (options && (options.limit || options.offset)) {
      const result = await this.model.findAndCountAll(options)
      return { rows: result.rows, count: result.count }
    }

    const rows = await this.model.findAll(options)
    return { rows, count: Array.isArray(rows) ? rows.length : 0 }
  }
}

export default new VoucherService()
