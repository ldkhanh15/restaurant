import { BaseService } from "./baseService"
import AttendanceLog from "../models/AttendanceLog"
import Employee from "../models/Employee"

class AttendanceLogService extends BaseService<AttendanceLog> {
  constructor() {
    super(AttendanceLog)
  }

  async findAllWithEmployee(options?: any) {
    return await this.findAll({
      ...options,
      include: [{ model: Employee, as: "employee" }],
    })
  }
}

export default new AttendanceLogService()
