import { Employee } from "./Employee";

export type Attendance = {
  id: string;
  employee_id?: string;
  check_in_time?: Date;
  check_out_time?: Date;
  face_image_url?: string;
  verified: boolean;
  created_at?: Date;
  Employee?: Employee;
};
