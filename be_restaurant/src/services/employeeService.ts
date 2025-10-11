import { BaseService } from "./baseService"
import Employee from "../models/Employee"
import User from "../models/User"

class EmployeeService extends BaseService<Employee> {
  constructor() {
    super(Employee)
  }

  async findAllWithUser(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: User, as: "user" }],
    })
  }

  async findByIdWithUser(id: string) {
    return await this.findById(id, {
      include: [{ model: User, as: "user" }],
    })
  }
}

export default new EmployeeService()
