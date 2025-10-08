"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import employeeApi from "../../src/services/employeeService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  DollarSign,
  Calendar,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: "customer" | "employee" | "admin";
  full_name: string;
  ranking: "regular" | "vip" | "platinum";
  points: number;
  created_at: string;
  deleted_at?: string;
  preferences?: any;
}

interface Employee {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  status: "active" | "inactive" | "terminated";
  face_image_url?: string;
  created_at: string;
  user?: User;
}

interface EmployeeShift {
  id: number;
  employee_id: number;
  employee_name: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  status: "scheduled" | "in_progress" | "completed" | "missed";
  actual_start?: string;
  actual_end?: string;
}

interface AttendanceLog {
  id: number;
  employee_id: number;
  employee_name: string;
  check_in_time: string;
  check_out_time?: string;
  verified: boolean;
  face_image_url?: string;
  location: string;
  notes?: string;
}

interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  overtime_hours: number;
  overtime_pay: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: "draft" | "approved" | "paid";
}

// const mockEmployees: Employee[] = [
//   {
//     id: 1,
//     user_id: 3,
//     full_name: "Lê Quân C",
//     email: "lequanc@email.com",
//     phone: "0912345678",
//     position: "Bếp trưởng",
//     department: "Bếp",
//     hire_date: "2024-01-15",
//     salary: 15000000,
//     status: "active",
//     face_image_url: "/placeholder.svg?key=emp1",
//     created_at: "2024-01-15",
//   },
//   {
//     id: 2,
//     user_id: 5,
//     full_name: "Nguyễn Thị D",
//     email: "nguyenthid@email.com",
//     phone: "0923456789",
//     position: "Phục vụ",
//     department: "Phục vụ",
//     hire_date: "2024-02-01",
//     salary: 8000000,
//     status: "active",
//     created_at: "2024-02-01",
//   },
//   {
//     id: 3,
//     user_id: 6,
//     full_name: "Trần Văn E",
//     email: "tranvane@email.com",
//     phone: "0934567890",
//     position: "Thu ngân",
//     department: "Phục vụ",
//     hire_date: "2024-02-15",
//     salary: 9000000,
//     status: "active",
//     created_at: "2024-02-15",
//   },
//   {
//     id: 4,
//     user_id: 7,
//     full_name: "Phạm Thị F",
//     email: "phamthif@email.com",
//     phone: "0945678901",
//     position: "Phụ bếp",
//     department: "Bếp",
//     hire_date: "2024-03-01",
//     salary: 7000000,
//     status: "inactive",
//     created_at: "2024-03-01",
//   },
// ];

const mockShifts: EmployeeShift[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: "Lê Quân C",
    shift_date: "2024-03-20",
    start_time: "08:00",
    end_time: "16:00",
    break_duration: 60,
    status: "completed",
    actual_start: "07:55",
    actual_end: "16:10",
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: "Nguyễn Thị D",
    shift_date: "2024-03-20",
    start_time: "10:00",
    end_time: "22:00",
    break_duration: 90,
    status: "in_progress",
    actual_start: "10:05",
  },
  {
    id: 3,
    employee_id: 3,
    employee_name: "Trần Văn E",
    shift_date: "2024-03-20",
    start_time: "16:00",
    end_time: "24:00",
    break_duration: 60,
    status: "scheduled",
  },
];

const mockAttendance: AttendanceLog[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: "Lê Quân C",
    check_in_time: "2024-03-20T07:55:00",
    check_out_time: "2024-03-20T16:10:00",
    verified: true,
    face_image_url: "/placeholder.svg?key=face1",
    location: "Cửa chính",
    notes: "Đúng giờ",
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: "Nguyễn Thị D",
    check_in_time: "2024-03-20T10:05:00",
    verified: true,
    location: "Cửa chính",
  },
];

const mockPayroll: PayrollRecord[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: "Lê Quân C",
    period_start: "2024-03-01",
    period_end: "2024-03-31",
    base_salary: 15000000,
    overtime_hours: 8,
    overtime_pay: 500000,
    bonus: 1000000,
    deductions: 200000,
    net_pay: 16300000,
    status: "approved",
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: "Nguyễn Thị D",
    period_start: "2024-03-01",
    period_end: "2024-03-31",
    base_salary: 8000000,
    overtime_hours: 12,
    overtime_pay: 400000,
    bonus: 500000,
    deductions: 100000,
    net_pay: 8800000,
    status: "paid",
  },
];

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts] = useState<EmployeeShift[]>(mockShifts);
  const [attendance] = useState<AttendanceLog[]>(mockAttendance);
  const [payroll] = useState<PayrollRecord[]>(mockPayroll);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const limit = 30;
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, [currentPage]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await employeeApi.getAllEmployees(
        currentPage,
        limit,
        searchTerm
      );
      console.log("Fetched Employees:", response);

      // Adapt to the actual API response structure
      if (response && response.data) {
        // Check if data is directly an array
        if (Array.isArray(response.data)) {
          setEmployees(response.data);
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
            setTotalEmployees(response.pagination.totalItems || 0);
          } else {
            setTotalPages(1);
            setTotalEmployees(response.data.length);
          }
        }
        // Check if response follows the structure with items inside data object
        else if (typeof response.data === "object" && response.data !== null) {
          // Check for items property in data object
          const data = response.data as any; // Type assertion to avoid TypeScript errors

          if (data.items && Array.isArray(data.items)) {
            setEmployees(data.items);
            if (data.pagination) {
              setTotalPages(data.pagination.totalPages || 1);
              setTotalEmployees(data.pagination.totalItems || 0);
            }
          } else {
            // Handle other object structures - try to extract any array we can find
            const possibleArrays = Object.values(data).filter(Array.isArray);
            if (possibleArrays.length > 0) {
              const employeesArray = possibleArrays[0] as Employee[];
              setEmployees(employeesArray);
              setTotalPages(1);
              setTotalEmployees(employeesArray.length);
            } else {
              setEmployees([]);
              console.error(
                "Unexpected data format - couldn't find array:",
                data
              );
              toast({
                title: "Cảnh báo",
                description: "Định dạng dữ liệu không đúng mong đợi",
              });
            }
          }
        }
        // If data exists but doesn't match expected format
        else {
          setEmployees([]);
          console.error("Unexpected data format:", response.data);
          toast({
            title: "Cảnh báo",
            description: "Định dạng dữ liệu không đúng mong đợi",
          });
        }
      } else {
        setEmployees([]);
        console.error("No data in response");
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setError("Không thể tải danh sách nhân viên");
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhân viên",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEmployees();
  };

  const handleCreateEmployee = async (
    employeeData: Omit<Employee, "id" | "created_at">
  ) => {
    try {
      await employeeApi.createEmployee(employeeData);
      setIsCreateDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Đã thêm nhân viên mới",
      });
      fetchEmployees();
    } catch (err) {
      console.error("Failed to create employee:", err);
      toast({
        title: "Lỗi",
        description: "Không thể thêm nhân viên mới",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEmployee = async (
    id: number,
    employeeData: Partial<Employee>
  ) => {
    try {
      await employeeApi.updateEmployee(id.toString(), employeeData);
      setIsViewDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin nhân viên",
      });
      fetchEmployees();
    } catch (err) {
      console.error("Failed to update employee:", err);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin nhân viên",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    try {
      await employeeApi.deleteEmployee(id.toString());
      toast({
        title: "Thành công",
        description: "Đã xóa nhân viên",
      });
      fetchEmployees();
    } catch (err) {
      console.error("Failed to delete employee:", err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhân viên",
        variant: "destructive",
      });
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" || employee.status === statusFilter;

    return matchesDepartment && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">Đang làm việc</Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Tạm nghỉ</Badge>
        );
      case "terminated":
        return <Badge className="bg-red-100 text-red-800">Đã nghỉ việc</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getShiftStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Đã lên lịch
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Đang làm
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Hoàn thành
          </Badge>
        );
      case "missed":
        return <Badge className="bg-red-100 text-red-800">Vắng mặt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const departments = [...new Set(employees.map((e) => e.department))];
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const todayShifts = shifts.filter(
    (s) => s.shift_date === "2024-03-20"
  ).length;
  const currentlyWorking = shifts.filter(
    (s) => s.status === "in_progress"
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang làm việc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeEmployees}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ca hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todayShifts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang trong ca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {currentlyWorking}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Nhân viên</TabsTrigger>
          <TabsTrigger value="shifts">Ca làm việc</TabsTrigger>
          <TabsTrigger value="attendance">Chấm công</TabsTrigger>
          <TabsTrigger value="payroll">Lương</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm flex">
                <div className="flex-grow mr-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Tìm kiếm nhân viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                </div>
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="h-4 w-4 mr-2" />
                  Tìm
                </Button>
              </div>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang làm việc</SelectItem>
                  <SelectItem value="inactive">Tạm nghỉ</SelectItem>
                  <SelectItem value="terminated">Đã nghỉ việc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const newEmployee = {
                      user_id: parseInt(formData.get("user_id") as string) || 0,
                      full_name: formData.get("full_name") as string,
                      email: formData.get("email") as string,
                      phone: formData.get("phone") as string,
                      position: formData.get("position") as string,
                      department: formData.get("department") as string,
                      hire_date: formData.get("hire_date") as string,
                      salary: parseInt(formData.get("salary") as string) || 0,
                      status: formData.get("status") as
                        | "active"
                        | "inactive"
                        | "terminated",
                      face_image_url:
                        (formData.get("face_image_url") as string) || undefined,
                    };
                    handleCreateEmployee(newEmployee);
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Thêm nhân viên mới</DialogTitle>
                    <DialogDescription>
                      Tạo hồ sơ nhân viên mới
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="user_id">User ID</Label>
                        <Input
                          id="user_id"
                          name="user_id"
                          type="number"
                          placeholder="Nhập user ID"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="full_name">Họ và tên</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Nhập email"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="Nhập số điện thoại"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="position">Vị trí</Label>
                        <Input
                          id="position"
                          name="position"
                          placeholder="Nhập vị trí"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="department">Phòng ban</Label>
                        <Select name="department" defaultValue="Bếp">
                          <SelectTrigger id="department">
                            <SelectValue placeholder="Chọn phòng ban" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bếp">Bếp</SelectItem>
                            <SelectItem value="Phục vụ">Phục vụ</SelectItem>
                            <SelectItem value="Quản lý">Quản lý</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="salary">Lương cơ bản</Label>
                        <Input
                          id="salary"
                          name="salary"
                          type="number"
                          placeholder="0"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hire_date">Ngày vào làm</Label>
                        <Input
                          id="hire_date"
                          name="hire_date"
                          type="date"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="status">Trạng thái</Label>
                        <Select name="status" defaultValue="active">
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Hoạt động</SelectItem>
                            <SelectItem value="inactive">Tạm nghỉ</SelectItem>
                            <SelectItem value="terminated">
                              Đã nghỉ việc
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="face_image_url">URL Hình ảnh</Label>
                        <Input
                          id="face_image_url"
                          name="face_image_url"
                          placeholder="Nhập URL hình ảnh"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Thêm nhân viên</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Employees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách nhân viên</CardTitle>
              <CardDescription>
                Quản lý thông tin nhân viên ({filteredEmployees.length} nhân
                viên)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Đang tải dữ liệu...</span>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8 text-destructive">
                  <AlertCircle className="h-8 w-8 mr-2" />
                  <span>{error}</span>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nhân viên</TableHead>
                        <TableHead>Vị trí</TableHead>
                        <TableHead>Lương</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell>#{employee.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={
                                      employee.face_image_url ||
                                      "/placeholder.svg"
                                    }
                                    alt={employee.user?.full_name}
                                  />
                                  <AvatarFallback>
                                    {employee.user?.full_name
                                      ? employee.user?.full_name.charAt(0)
                                      : "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {employee.user?.full_name || "Không có tên"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {employee.user?.email || "Không có email"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell className="font-medium">
                              {employee.salary
                                ? employee.salary.toLocaleString("vi-VN")
                                : 0}
                              đ
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(employee.status || "unknown")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() =>
                                    handleDeleteEmployee(employee.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Không có nhân viên nào
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Trước
                      </Button>
                      <div className="flex items-center mx-2">
                        Trang {currentPage} / {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ca làm việc hôm nay</CardTitle>
              <CardDescription>
                Quản lý lịch làm việc của nhân viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Ca làm việc</TableHead>
                    <TableHead>Thời gian thực tế</TableHead>
                    <TableHead>Nghỉ giải lao</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">
                        {shift.employee_name}
                      </TableCell>
                      <TableCell>
                        {shift.start_time} - {shift.end_time}
                      </TableCell>
                      <TableCell>
                        {shift.actual_start && (
                          <div className="text-sm">
                            <p>Vào: {shift.actual_start}</p>
                            {shift.actual_end && <p>Ra: {shift.actual_end}</p>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{shift.break_duration} phút</TableCell>
                      <TableCell>{getShiftStatusBadge(shift.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chấm công hôm nay</CardTitle>
              <CardDescription>
                Theo dõi giờ vào ra của nhân viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Giờ vào</TableHead>
                    <TableHead>Giờ ra</TableHead>
                    <TableHead>Vị trí</TableHead>
                    <TableHead>Xác thực</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.employee_name}
                      </TableCell>
                      <TableCell>
                        {new Date(log.check_in_time).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        {log.check_out_time ? (
                          new Date(log.check_out_time).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        ) : (
                          <span className="text-muted-foreground">Chưa ra</span>
                        )}
                      </TableCell>
                      <TableCell>{log.location}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.verified
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {log.verified ? "Đã xác thực" : "Chưa xác thực"}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bảng lương tháng 3/2024</CardTitle>
              <CardDescription>
                Quản lý lương và thưởng nhân viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Lương cơ bản</TableHead>
                    <TableHead>Tăng ca</TableHead>
                    <TableHead>Thưởng</TableHead>
                    <TableHead>Khấu trừ</TableHead>
                    <TableHead>Thực lĩnh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.employee_name}
                      </TableCell>
                      <TableCell>
                        {record.base_salary.toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{record.overtime_hours}h</p>
                          <p className="text-muted-foreground">
                            {record.overtime_pay.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.bonus.toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell>
                        {record.deductions.toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {record.net_pay.toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            record.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : record.status === "approved"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          {record.status === "paid"
                            ? "Đã trả"
                            : record.status === "approved"
                            ? "Đã duyệt"
                            : "Nháp"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thông tin nhân viên</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={selectedEmployee.face_image_url || "/placeholder.svg"}
                    alt={selectedEmployee.full_name || "Nhân viên"}
                  />
                  <AvatarFallback className="text-lg">
                    {selectedEmployee.full_name
                      ? selectedEmployee.full_name.charAt(0)
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedEmployee.full_name || "Không có tên"}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedEmployee.position || "Chưa có vị trí"}
                  </p>
                  {getStatusBadge(selectedEmployee.status || "unknown")}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updatedEmployee = {
                    full_name: formData.get("full_name") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string,
                    position: formData.get("position") as string,
                    department: formData.get("department") as string,
                    hire_date: formData.get("hire_date") as string,
                    salary: parseInt(formData.get("salary") as string) || 0,
                    status: formData.get("status") as
                      | "active"
                      | "inactive"
                      | "terminated",
                  };
                  handleUpdateEmployee(selectedEmployee.id, updatedEmployee);
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_full_name">Họ và tên</Label>
                    <Input
                      id="edit_full_name"
                      name="full_name"
                      defaultValue={selectedEmployee.full_name}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      name="email"
                      type="email"
                      defaultValue={selectedEmployee.email}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_phone">Số điện thoại</Label>
                    <Input
                      id="edit_phone"
                      name="phone"
                      defaultValue={selectedEmployee.phone}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_position">Vị trí</Label>
                    <Input
                      id="edit_position"
                      name="position"
                      defaultValue={selectedEmployee.position}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_department">Phòng ban</Label>
                    <Select
                      name="department"
                      defaultValue={selectedEmployee.department}
                    >
                      <SelectTrigger id="edit_department">
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bếp">Bếp</SelectItem>
                        <SelectItem value="Phục vụ">Phục vụ</SelectItem>
                        <SelectItem value="Quản lý">Quản lý</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_hire_date">Ngày vào làm</Label>
                    <Input
                      id="edit_hire_date"
                      name="hire_date"
                      type="date"
                      defaultValue={selectedEmployee.hire_date || ""}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_salary">Lương cơ bản</Label>
                    <Input
                      id="edit_salary"
                      name="salary"
                      type="number"
                      defaultValue={selectedEmployee.salary || 0}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_status">Trạng thái</Label>
                    <Select
                      name="status"
                      defaultValue={selectedEmployee.status || "active"}
                    >
                      <SelectTrigger id="edit_status">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="inactive">Tạm nghỉ</SelectItem>
                        <SelectItem value="terminated">Đã nghỉ việc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa nhân viên
                  </Button>
                  <Button type="submit">
                    <Edit className="h-4 w-4 mr-2" />
                    Cập nhật
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
