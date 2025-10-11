import { BaseService } from "./baseService"
import VoucherUsage from "../models/VoucherUsage"

class VoucherUsageService extends BaseService<VoucherUsage> {
  constructor() {
    super(VoucherUsage)
  }
}

export default new VoucherUsageService()