export type Payroll = {
  id: string;
  employee_id?: string;
  period_start?: Date;
  period_end?: Date;
  hours_worked?: number;
  base_pay?: number;
  bonus?: number;
  taxes?: number;
  net_pay?: number;
  advance_salary?: number;
};
