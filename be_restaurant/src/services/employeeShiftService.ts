import { BaseService } from "./baseService"
import EmployeeShift from "../models/EmployeeShift"
import Employee from "../models/Employee"

class EmployeeShiftService extends BaseService<EmployeeShift> {
  constructor() {
    super(EmployeeShift)
  }

  async findAllWithEmployee(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: Employee, as: "employee" }],
    })
  }
}

export default new EmployeeShiftService()
