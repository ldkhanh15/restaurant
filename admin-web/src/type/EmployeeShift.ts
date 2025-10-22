import { Employee } from "./Employee";

export type EmployeeShift = {
  id: string;
  employee_id?: string;
  start_time: Date;
  end_time: Date;
  Employee?: Employee;
};
