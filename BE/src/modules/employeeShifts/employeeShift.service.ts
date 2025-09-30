import { EmployeeShift } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import {
  CreateEmployeeShiftDTO,
  UpdateEmployeeShiftDTO,
} from "../../types/dtos/employee.dto";

export const EmployeeShiftService = {
  async list() {
    return EmployeeShift.findAll({
      order: [["start_time", "DESC"]],
      include: ["employee"],
    });
  },

  async get(id: string) {
    return EmployeeShift.findByPk(id, {
      include: ["employee", "attendance_logs"],
    });
  },

  async create(payload: CreateEmployeeShiftDTO) {
    const id = payload.id || uuidv4();
    const shift = await EmployeeShift.create({
      id,
      ...payload,
      status: payload.status || "scheduled",
      created_at: new Date(),
    });
    return this.get(shift.id);
  },

  async update(id: string, payload: UpdateEmployeeShiftDTO) {
    const shift = await EmployeeShift.findByPk(id);
    if (!shift) return null;

    await shift.update({
      ...payload,
      updated_at: new Date(),
    });

    return this.get(id);
  },

  async remove(id: string) {
    const shift = await EmployeeShift.findByPk(id);
    if (!shift) return false;

    await shift.destroy();
    return true;
  },

  async getEmployeeShifts(
    employeeId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { employee_id: employeeId };

    if (startDate && endDate) {
      where.start_time = {
        [Op.between]: [startDate, endDate],
      };
    }

    return EmployeeShift.findAll({
      where,
      order: [["start_time", "ASC"]],
      include: ["attendance_logs"],
    });
  },
};
