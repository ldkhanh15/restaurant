import {
  Payroll,
  Employee,
  EmployeeShift,
  AttendanceLog,
} from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import {
  CreatePayrollDTO,
  UpdatePayrollDTO,
} from "../../types/dtos/employee.dto";
import { Op } from "sequelize";

export const PayrollService = {
  async list() {
    return Payroll.findAll({
      include: ["employee"],
      order: [["period_end", "DESC"]],
    });
  },

  async get(id: string) {
    return Payroll.findByPk(id, {
      include: ["employee"],
    });
  },

  async getByEmployee(employeeId: string) {
    return Payroll.findAll({
      where: { employee_id: employeeId },
      order: [["period_end", "DESC"]],
    });
  },

  async calculatePayroll(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CreatePayrollDTO | null> {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) return null;

    // Get all shifts in the period
    const shifts = await EmployeeShift.findAll({
      where: {
        employee_id: employeeId,
        start_time: { [Op.between]: [startDate, endDate] },
      },
      include: ["attendance_logs"],
    });

    // Calculate total hours worked and overtime
    let totalHours = 0;
    let overtimeHours = 0;

    for (const shift of shifts) {
      const attendance = shift.attendance_logs?.[0];
      if (attendance?.check_in_time && attendance?.check_out_time) {
        const hours =
          (attendance.check_out_time.getTime() -
            attendance.check_in_time.getTime()) /
          (1000 * 60 * 60);

        // Standard shift is 8 hours
        if (hours > 8) {
          totalHours += 8;
          overtimeHours += hours - 8;
        } else {
          totalHours += hours;
        }
      }
    }

    // Calculate base pay and overtime pay
    const hourlyRate = employee.base_salary / (8 * 22); // Assuming 22 working days per month
    const basePay = totalHours * hourlyRate;
    const overtimePay = overtimeHours * (hourlyRate * 1.5); // Overtime rate is 1.5x

    return {
      employee_id: employeeId,
      period_start: startDate,
      period_end: endDate,
      base_salary: basePay,
      overtime_hours: overtimeHours,
      overtime_rate: hourlyRate * 1.5,
      total_amount: basePay + overtimePay,
      status: "pending",
    };
  },

  async create(payload: CreatePayrollDTO) {
    const id = payload.id || uuidv4();

    // If calculation is needed
    if (!payload.total_amount) {
      const calculated = await this.calculatePayroll(
        payload.employee_id,
        payload.period_start,
        payload.period_end
      );
      if (!calculated) return null;
      payload = { ...calculated, id };
    }

    const payroll = await Payroll.create({
      id,
      ...payload,
      created_at: new Date(),
    });

    return this.get(payroll.id);
  },

  async update(id: string, payload: UpdatePayrollDTO) {
    const payroll = await Payroll.findByPk(id);
    if (!payroll) return null;

    await payroll.update({
      ...payload,
      updated_at: new Date(),
    });

    return this.get(id);
  },

  async remove(id: string) {
    const payroll = await Payroll.findByPk(id);
    if (!payroll) return false;
    await payroll.destroy();
    return true;
  },
};
