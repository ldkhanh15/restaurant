import { EmployeeAttributes } from "../../models/employee.model";
import { EmployeeShiftAttributes } from "../../models/employeeShift.model";
import { AttendanceLogAttributes } from "../../models/attendance.model";
import { PayrollAttributes } from "../../models/payroll.model";

export interface CreateEmployeeDTO {
  user_id?: string;
  position?: string;
  face_image_url?: string;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {}

export interface CreateEmployeeShiftDTO {
  employee_id: string;
  start_time: Date;
  end_time: Date;
  break_minutes?: number;
  position?: string;
  status?: EmployeeShiftAttributes["status"];
  notes?: string;
}

export interface UpdateEmployeeShiftDTO
  extends Partial<CreateEmployeeShiftDTO> {}

export interface CreateAttendanceLogDTO {
  employee_id: string;
  shift_id?: string;
  check_in_time: Date;
  check_out_time?: Date;
  face_image_url?: string;
  location?: object;
  status?: AttendanceLogAttributes["status"];
  verified_by?: string;
  notes?: string;
}

export interface UpdateAttendanceLogDTO
  extends Partial<CreateAttendanceLogDTO> {}

export interface CreatePayrollDTO {
  employee_id: string;
  period_start: Date;
  period_end: Date;
  base_salary: number;
  overtime_hours?: number;
  overtime_rate?: number;
  deductions?: {
    type: string;
    amount: number;
    description?: string;
  }[];
  bonuses?: {
    type: string;
    amount: number;
    description?: string;
  }[];
  total_amount?: number;
  status?: PayrollAttributes["status"];
  paid_at?: Date;
  payment_method?: string;
  notes?: string;
}

export interface UpdatePayrollDTO extends Partial<CreatePayrollDTO> {}
