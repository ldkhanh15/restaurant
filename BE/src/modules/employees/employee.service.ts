import { Employee, AttendanceLog } from "../../models/employee.model";
import { v4 as uuidv4 } from "uuid";
import {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  CreateAttendanceLogDTO,
} from "../../types/dtos/employee.dto";
import { Op } from "sequelize";

export const EmployeeService = {
  async list() {
    return Employee.findAll({
      include: ["user", "shifts", "attendance_logs", "payrolls"],
      order: [["created_at", "DESC"]],
    });
  },

  async get(id: string) {
    return Employee.findByPk(id, {
      include: ["user", "shifts", "attendance_logs", "payrolls"],
    });
  },

  async create(payload: CreateEmployeeDTO) {
    const id = payload.id || uuidv4();
    const employee = await Employee.create({
      id,
      ...payload,
      created_at: new Date(),
    });
    return this.get(employee.id);
  },

  async update(id: string, payload: UpdateEmployeeDTO) {
    const employee = await Employee.findByPk(id);
    if (!employee) return null;

    await employee.update({
      ...payload,
      updated_at: new Date(),
    });
    return this.get(id);
  },

  async remove(id: string) {
    const employee = await Employee.findByPk(id);
    if (!employee) return false;
    await employee.destroy();
    return true;
  },

  async checkIn(id: string, faceImageUrl: string) {
    const employee = await Employee.findByPk(id);
    if (!employee) return null;

    // Check if there's already an active attendance log
    const existingLog = await AttendanceLog.findOne({
      where: {
        employee_id: id,
        check_out_time: null,
      },
    });

    if (existingLog) {
      throw new Error("Employee already checked in");
    }

    // Find current or upcoming shift
    const currentShift = await EmployeeShift.findOne({
      where: {
        employee_id: id,
        start_time: {
          [Op.lte]: new Date(),
        },
        end_time: {
          [Op.gte]: new Date(),
        },
      },
    });

    const log = await AttendanceLog.create({
      id: uuidv4(),
      employee_id: id,
      shift_id: currentShift?.id,
      check_in_time: new Date(),
      face_image_url: faceImageUrl,
      status: "pending_verification",
    });

    return log;
  },

  async checkOut(id: string) {
    const activeLog = await AttendanceLog.findOne({
      where: {
        employee_id: id,
        check_out_time: null,
      },
    });

    if (!activeLog) {
      throw new Error("No active check-in found");
    }

    await activeLog.update({
      check_out_time: new Date(),
      updated_at: new Date(),
    });

    return activeLog;
  },
};
