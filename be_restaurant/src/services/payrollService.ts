import { BaseService } from "./baseService"
import Payroll from "../models/Payroll"
import Employee from "../models/Employee"

class PayrollService extends BaseService<Payroll> {
  constructor() {
    super(Payroll)
  }

  async findAllWithEmployee(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: Employee, as: "employee" }],
    })
  }
}

export default new PayrollService()
