export const EMPLOYEE_POSITIONS = [
  { key: "chef", label: "Bếp trưởng" },
  { key: "assistant_chef", label: "Phụ bếp" },
  { key: "waiter", label: "Phục vụ" },
  { key: "cashier", label: "Thu ngân" },
  { key: "manager", label: "Quản lý" },
] as const;

export type EmployeePosition = (typeof EMPLOYEE_POSITIONS)[number];

export const EMPLOYEE_DEPARTMENTS = [
  "Bếp",
  "Phục vụ",
  "Thu ngân",
  "Quản lý",
] as const;

export const userRoles = [
  { key: "customer", label: "Khách hàng" },
  { key: "employee", label: "Nhân viên" },
  { key: "admin", label: "Quản trị viên" },
] as const;

export type EmployeeDepartment = (typeof EMPLOYEE_DEPARTMENTS)[number];

export const EMPLOYEE_STATUS = ["active", "inactive", "on_leave"] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[number];
