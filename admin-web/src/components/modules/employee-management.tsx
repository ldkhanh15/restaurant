"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import employeeApi from "../../services/employeeService";
import employeeShiftApi from "../../services/employeeShiftsService";
import attendanceApi from "../../services/attendanceService";
import payrollApi from "../../services/payrollService";
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
  RefreshCw,
} from "lucide-react";

import { EMPLOYEE_POSITIONS } from "@/lib/constants";
import { formatDateTimeVN } from "@/lib/utils";
import { set } from "date-fns";
import { is, se } from "date-fns/locale";
import { Employee } from "../../type/Employee";
import { EmployeeShift } from "../../type/EmployeeShift";
import { Attendance } from "../../type/Attendance";
import { Payroll } from "../../type/Payroll";
import { User } from "../../type/User";
import { uploadImageToCloudinary } from "@/services/cloudinaryService";

// Không sử dụng mockShifts nữa vì sẽ lấy dữ liệu từ API

// Không sử dụng mock data nữa

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [attendances, setAttendance] = useState<Attendance[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  const [unassignedUsers, setUnassignedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  const [selectedShift, setSelectedShift] = useState<EmployeeShift | null>(
    null
  );
  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isShiftCreateDialogOpen, setIsShiftCreateDialogOpen] = useState(false);
  const [isShiftViewDialogOpen, setIsShiftViewDialogOpen] = useState(false);
  const [isAttendanceCreateDialogOpen, setIsAttendanceCreateDialogOpen] =
    useState(false);
  const [isAttendanceEditDialogOpen, setIsAttendanceEditDialogOpen] =
    useState(false);
  const [isPayrollEditDialogOpen, setIsPayrollEditDialogOpen] = useState(false);
  const [isPayrollCreateDialogOpen, setIsPayrollCreateDialogOpen] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [shiftsCurrentPage, setShiftsCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShiftPages, setTotalShiftPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalShifts, setTotalShifts] = useState(0);
  const limit = 30;

  useEffect(() => {
    fetchEmployees();
  }, [currentPage]);

  // CRUD employees
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await employeeApi.getAllEmployees(
        currentPage,
        limit,
        searchTerm
      );

      // Adapt to the actual API response structure
      if (response && response.data) {
        // Check if data is directly an array
        console.log("Employee fetch response:", response);
        if (Array.isArray(response.data)) {
          toast.success("Tải danh sách nhân viên thành công");
          setEmployees(response.data);
          // if (response.pagination) {
          //   setTotalPages(response.pagination.totalPages || 1);
          //   setTotalEmployees(response.pagination.totalItems || 0);
          // } else {
          //   setTotalPages(1);
          //   setTotalEmployees(response.data.length);
          // }
        }
        // Check if response follows the structure with items inside data object
        else if (typeof response.data === "object" && response.data !== null) {
          // Check for items property in data object
          const data = response.data as any; // Type assertion to avoid TypeScript errors

          if (data.items && Array.isArray(data.items)) {
            setEmployees(data.items);
            // if (data.pagination) {
            //   setTotalPages(data.pagination.totalPages || 1);
            //   setTotalEmployees(data.pagination.totalItems || 0);
            // }
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
              toast.warning("Định dạng dữ liệu không đúng mong đợi");
            }
          }
        }
        // If data exists but doesn't match expected format
        else {
          setEmployees([]);
          console.error("Unexpected data format:", response.data);
          toast.warning("Định dạng dữ liệu không đúng mong đợi");
        }
      } else {
        setEmployees([]);
        console.error("No data in response");
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnassignedUsers = async () => {
    try {
      const response = await employeeApi.getAllUserUnassigned();

      // Xử lý các định dạng dữ liệu có thể có từ API
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // Nếu data trực tiếp là một mảng
          setUnassignedUsers(response.data);
        } else if (
          typeof response.data === "object" &&
          response.data !== null
        ) {
          // Kiểm tra nếu có thuộc tính items
          const dataObj = response.data as any;
          if (dataObj.items && Array.isArray(dataObj.items)) {
            setUnassignedUsers(dataObj.items);
          } else {
            // Tìm mảng đầu tiên trong đối tượng data
            const possibleArrays = Object.values(dataObj).filter(Array.isArray);
            if (possibleArrays.length > 0) {
              setUnassignedUsers(possibleArrays[0] as User[]);
            } else {
              setUnassignedUsers([]);
            }
          }
        } else {
          setUnassignedUsers([]);
        }
      } else {
        setUnassignedUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch unassigned users:", err);
      toast.error("Không thể tải danh sách người dùng chưa được phân công");
    }
  };

  const handleCreateEmployee = async (
    employeeData: Partial<Employee> & { file?: File }
  ) => {
    try {
      let faceImageUrl: string | undefined;
      if (employeeData.file instanceof File) {
        faceImageUrl = await uploadImageToCloudinary(employeeData.file, "dish");
      }
      const newEmployee = {
        user_id: employeeData.user_id,
        position: employeeData.position,
        face_image_url: faceImageUrl,
      };

      await employeeApi.createEmployee(newEmployee);
      setIsCreateDialogOpen(false);
      toast.success("Đã thêm nhân viên mới");
      fetchEmployees();
    } catch (err) {
      console.error("Failed to create employee:", err);
      toast.error("Không thể thêm nhân viên mới");
    }
  };

  const handleUpdateEmployee = async (id: string, employeeData: any) => {
    try {
      // Chuyển đổi dữ liệu để phù hợp với cấu trúc API mới
      const updatedData: Partial<Employee> = {
        position: employeeData.position,
        face_image_url: employeeData.face_image_url,
      };

      // Tạm thời bỏ qua việc cập nhật thông tin user
      // Cần bổ sung API riêng để cập nhật thông tin user nếu cần

      await employeeApi.updateEmployee(id, updatedData);
      setIsViewDialogOpen(false);
      toast.success("Đã cập nhật thông tin nhân viên");
      fetchEmployees();
    } catch (err) {
      console.error("Failed to update employee:", err);
      toast.error("Không thể cập nhật thông tin nhân viên");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await employeeApi.deleteEmployee(id);
      toast.success("Đã xóa nhân viên");
      fetchEmployees();
    } catch (err) {
      console.error("Failed to delete employee:", err);
      toast.error("Không thể xóa nhân viên");
    }
  };

  // CRUD shifts

  const fetchEmployeeShifts = async () => {
    setShiftError(null);
    setIsLoading(true);
    try {
      const response = await employeeShiftApi.getAllEmployeeShifts(
        shiftsCurrentPage,
        limit
      );

      if (response && response.data) {
        if (Array.isArray(response.data)) {
          setShifts(response.data);
          // if (response.pagination) {
          //   setTotalShiftPages(response.pagination.totalPages || 1);
          //   setTotalShifts(response.pagination.totalItems || 0);
          // } else {
          //   setTotalShiftPages(1);
          //   setTotalShifts(response.data.length);
          // }
        } else if (
          typeof response.data === "object" &&
          response.data !== null
        ) {
          const data = response.data as any;

          if (data.items && Array.isArray(data.items)) {
            setShifts(data.items);
            if (data.pagination) {
              setTotalShiftPages(data.pagination.totalPages || 1);
              setTotalShifts(data.pagination.totalItems || 0);
            }
          } else {
            const possibleArrays = Object.values(data).filter(Array.isArray);
            if (possibleArrays.length > 0) {
              const shiftsArray = possibleArrays[0] as EmployeeShift[];
              setShifts(shiftsArray);
              setTotalShiftPages(1);
              setTotalShifts(shiftsArray.length);
            } else {
              setShifts([]);
              console.error(
                "Unexpected data format - couldn't find array:",
                data
              );
              toast.warning("Định dạng dữ liệu ca làm việc không đúng mong đợi");
            }
          }
        } else {
          setShifts([]);
          console.error("Unexpected data format:", response.data);
          toast.warning("Định dạng dữ liệu ca làm việc không đúng mong đợi");
        }
      } else {
        setShifts([]);
        console.error("No data in response for shifts");
      }
    } catch (err) {
      console.error("Failed to fetch employee shifts:", err);
      setShiftError("Không thể tải danh sách ca làm việc của nhân viên");
      toast.error("Không thể tải danh sách ca làm việc của nhân viên");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShift = async (shiftData: any) => {
    try {
      await employeeShiftApi.createEmployeeShift(shiftData);
      setIsShiftCreateDialogOpen(false);
      toast.success("Đã thêm ca làm việc mới");
      fetchEmployeeShifts();
    } catch (err) {
      console.error("Failed to create shift:", err);
      toast.error("Không thể thêm ca làm việc mới");
    }
  };

  // Hàm xử lý cập nhật ca làm việc
  const handleUpdateShift = async (id: string, shiftData: any) => {
    try {
      await employeeShiftApi.updateEmployeeShift(id, shiftData);
      setIsShiftViewDialogOpen(false);
      toast.success("Đã cập nhật thông tin ca làm việc");
      fetchEmployeeShifts();
    } catch (err) {
      console.error("Failed to update shift:", err);
      toast.error("Không thể cập nhật thông tin ca làm việc");
    }
  };

  // Hàm xử lý xóa ca làm việc
  const handleDeleteShift = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa ca làm việc này?")) {
      try {
        // Sử dụng updateEmployeeShift với isDeleted: true để soft delete
        await employeeShiftApi.deleteEmployeeShift(id);
        toast.success("Đã xóa ca làm việc");
        fetchEmployeeShifts();
      } catch (err) {
        console.error("Failed to delete shift:", err);
        toast.error("Không thể xóa ca làm việc");
      }
    }
  };
  //CRUD attendance
  const fetchAttendanceLogs = async () => {
    setIsLoading(true);
    try {
      const response = await attendanceApi.getAllAttendanceLogs();
      if (response && response.data) {
        console.log("attendance call:", response.data);
        setAttendance(response.data as Attendance[]);
        setIsAttendanceEditDialogOpen(false);
        setIsAttendanceCreateDialogOpen(false);
      } else {
        setAttendance([]);
      }
    } catch (err) {
      console.error("Failed to fetch attendance logs:", err);
      toast.error("Không thể tải danh sách nhật ký chấm công");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEmployeeAttendance = async (attendanceData: any) => {
    try {
      await attendanceApi.createAttendanceLog(attendanceData);
      setIsAttendanceEditDialogOpen(false);
      setIsAttendanceCreateDialogOpen(false);
      toast.success("Đã thêm nhân viên mới");
      fetchAttendanceLogs();
    } catch (err) {
      console.error("Failed to create employee:", err);
      toast.error("Không thể thêm nhân viên mới");
    }
  };

  const handleUpdateEmployeeAttendance = async (
    id: string,
    attendanceData: any
  ) => {
    try {
      // Chuyển đổi dữ liệu để phù hợp với cấu trúc API mới
      const updatedData: Partial<Attendance> = {
        employee_id: attendanceData.employee_id,
        check_in_time: attendanceData.check_in_time,
        check_out_time: attendanceData.check_out_time,
      };

      // Tạm thời bỏ qua việc cập nhật thông tin user
      // Cần bổ sung API riêng để cập nhật thông tin user nếu cần

      await attendanceApi.updateAttendanceLog(id, updatedData);
      setIsAttendanceEditDialogOpen(false);
      setIsAttendanceCreateDialogOpen(false);
      toast.success("Đã cập nhật thông tin nhân viên");
      fetchAttendanceLogs();
    } catch (err) {
      console.error("Failed to update employee:", err);
      toast.error("Không thể cập nhật thông tin nhân viên");
    }
  };

  const handleDeleteEmployeeAttendance = async (id: string) => {
    try {
      await attendanceApi.deleteAttendanceLog(id);
      toast.success("Đã xóa nhân viên");
      fetchAttendanceLogs();
    } catch (err) {
      console.error("Failed to delete employee:", err);
      toast.error("Không thể xóa nhân viên");
    }
  };

  console.log("payroll:", payrolls);

  //CRUD payroll
  const fetchPayrollRecords = async () => {
    setIsLoading(true);
    try {
      const respo = await payrollApi.getAllPayrollRecords();
      if (respo && respo.data) {
        console.log("payroll call:", respo.data);
        setPayrolls(respo.data);
      } else {
        setPayrolls([]);
      }
    } catch (err) {
      console.error("Failed to fetch payroll records:", err);
      toast.error("Không thể tải danh sách bảng lương");
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreatePayrollRecord = async (payrollData: any) => {
    try {
      await payrollApi.createPayrollRecord(payrollData);
      setIsPayrollCreateDialogOpen(false);
      setIsPayrollEditDialogOpen(false);
      toast.success("Đã thêm bảng lương mới");
      fetchPayrollRecords();
    } catch (err) {
      console.error("Failed to create payroll record:", err);
      toast.error("Không thể thêm bảng lương mới");
    }
  };
  const handleUpdatePayrollRecord = async (id: string, payrollData: any) => {
    try {
      // Chuyển đổi dữ liệu để phù hợp với cấu trúc API mới nếu cần
      // const updatedData: Partial<Payroll> = {
      //   employee_id: payrollData.employee_id, // Thêm các trường khác nếu cần
      //   period_start: payrollData.period_start,
      //   period_end: payrollData.period_end,
      // };

      await payrollApi.updatePayrollRecord(id, payrollData);
      setIsPayrollCreateDialogOpen(false);
      setIsPayrollEditDialogOpen(false);
      toast.success("Đã cập nhật bảng lương");
      fetchPayrollRecords();
    } catch (err) {
      console.error("Failed to update payroll record:", err);
      toast.error("Không thể cập nhật bảng lương");
    }
  };

  const handleDeletePayroll = async (id: string) => {
    try {
      await payrollApi.deletePayrollRecord(id);
      toast.success("Đã xóa bảng lương");
      fetchPayrollRecords();
    } catch (err) {
      console.error("Failed to delete payroll record:", err);
      toast.error("Không thể xóa bảng lương");
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEmployees();
  };

  // Hàm xử lý thêm ca làm việc mới
  const filteredEmployees = employees.filter((employee) => {
    const matchesPosition =
      positionFilter === "all" || employee.position === positionFilter;
    return matchesPosition;
  });

  // Since status is not directly available in the current data structure,
  // we're temporarily setting activeEmployees to the total number of employees

  const activeEmployees = employees.length;
  const todayShifts = shifts.length;
  const currentlyWorking = shifts.filter((s) => {
    const now = new Date();
    return s.start_time <= now && s.end_time >= now;
  }).length;

  return (
    <div className="space-y-6">
      <h1>Quản lý nhân viên 123</h1>
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
          <TabsTrigger
            onClick={() => {
              fetchEmployeeShifts();
            }}
            value="shifts"
          >
            Ca làm việc
          </TabsTrigger>
          <TabsTrigger
            onClick={() => {
              fetchAttendanceLogs();
            }}
            value="attendance"
          >
            Chấm công
          </TabsTrigger>
          <TabsTrigger
            onClick={() => {
              fetchPayrollRecords();
            }}
            value="payroll"
          >
            Lương
          </TabsTrigger>
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
                  Tìm kiếm
                </Button>
              </div>

              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Chức vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chức vụ</SelectItem>
                  {EMPLOYEE_POSITIONS.map((pos) => (
                    <SelectItem key={pos.key} value={pos.label}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (open) {
                  fetchUnassignedUsers();
                }
                setPreviewImage(null);
              }}
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

                    console.log("formData:", formData);
                    // Cấu trúc dữ liệu mới chỉ yêu cầu user_id và position
                    const newEmployee = {
                      user_id: formData.get("user_id") as string, // ID là kiểu string trong API mới
                      position: formData.get("position") as string,
                      file: formData.get("face_image_url") as File,
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
                        <Label htmlFor="user_id">Chọn người dùng</Label>
                        <Select name="user_id" required>
                          <SelectTrigger id="user_id" className="w-full">
                            <SelectValue placeholder="Chọn người dùng" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedUsers.length > 0 ? (
                              unassignedUsers.map((user) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id.toString()}
                                >
                                  {user.full_name} - {user.email}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-users" disabled>
                                Không có người dùng khả dụng
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="position">Vị trí</Label>
                        <Select name="position" defaultValue="" required>
                          <SelectTrigger id="position">
                            <SelectValue placeholder="Chọn vị trí" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYEE_POSITIONS.map((pos) => (
                              <SelectItem key={pos.key} value={pos.label}>
                                {pos.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 🖼️ Upload ảnh */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="face_image">Tải lên hình ảnh</Label>
                        <Input
                          id="face_image"
                          name="face_image_url"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () =>
                                setPreviewImage(reader.result as string);
                              reader.readAsDataURL(file);
                              console.log("Selected file:", file);
                              console.log("reader:", reader);
                            }
                          }}
                        />
                        {previewImage && (
                          <img
                            src={previewImage}
                            alt="Xem trước hình ảnh"
                            className="mt-2 max-h-48 rounded-md border"
                          />
                        )}
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
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nhân viên</TableHead>
                        <TableHead>Vị trí</TableHead>
                        {/* <TableFHead>Lương</TableFHead> */}
                        {/* <TableHead>Trạng thái</TableHead> */}
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell>#{employee.id.slice(-4)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={
                                      employee.face_image_url ||
                                      "/placeholder.svg"
                                    }
                                    alt={
                                      employee.user?.full_name || "Nhân viên"
                                    }
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
                            <TableCell>
                              {employee.position || "Chưa phân công"}
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
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Bạn có chắc chắn muốn xóa nhân viên này?"
                                      )
                                    ) {
                                      handleDeleteEmployee(employee.id);
                                    }
                                  }}
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
                        src={
                          selectedEmployee.face_image_url || "/placeholder.svg"
                        }
                        alt={selectedEmployee.user?.full_name || "Nhân viên"}
                      />
                      <AvatarFallback className="text-lg">
                        {selectedEmployee.user?.full_name
                          ? selectedEmployee.user?.full_name.charAt(0)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {selectedEmployee.user?.full_name || "Không có tên"}
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedEmployee.position || "Chưa có vị trí"}
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);

                      // Chỉ cập nhật các trường thuộc về Employee
                      const updatedEmployee = {
                        position: formData.get("position") as string,
                        face_image_url: formData.get("image_url") as string,
                        // Các trường khác cần được cập nhật thông qua API user
                      };
                      console.log(
                        "face_image_url:",
                        updatedEmployee.face_image_url
                      );
                      handleUpdateEmployee(
                        selectedEmployee.id,
                        updatedEmployee
                      );
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit_full_name">Họ và tên</Label>
                        <Input
                          id="edit_full_name"
                          name="full_name"
                          defaultValue={selectedEmployee.user?.full_name || ""}
                          required
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit_email">Email</Label>
                        <Input
                          id="edit_email"
                          name="email"
                          type="email"
                          defaultValue={selectedEmployee.user?.email || ""}
                          required
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit_phone">Image url</Label>
                        <Input
                          id="edit_phone"
                          name="image_url"
                          defaultValue={selectedEmployee.face_image_url || ""}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="position">Vị trí</Label>
                        <Select name="position" defaultValue="" required>
                          <SelectTrigger id="position">
                            <SelectValue placeholder="Chọn vị trí" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYEE_POSITIONS.map((pos) => (
                              <SelectItem key={pos.key} value={pos.label}>
                                {pos.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          handleDeleteEmployee(selectedEmployee.id)
                        }
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
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Dialog
              open={isShiftCreateDialogOpen}
              onOpenChange={(open) => {
                setIsShiftCreateDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm ca làm việc
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);

                    const startTime = formData.get("start_time") as string;
                    const endTime = formData.get("end_time") as string;

                    const newShift = {
                      employee_id: formData.get("employee_id") as string,
                      start_time: new Date(startTime),
                      end_time: new Date(endTime),
                    };

                    handleCreateShift(newShift);
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Thêm ca làm việc mới</DialogTitle>
                    <DialogDescription>
                      Tạo ca làm việc mới cho nhân viên
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="employee_id">Chọn nhân viên</Label>
                        <Select name="employee_id" required>
                          <SelectTrigger id="employee_id" className="w-full">
                            <SelectValue placeholder="Chọn nhân viên" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.length > 0 ? (
                              employees.map((employee) => (
                                <SelectItem
                                  key={employee.id}
                                  value={employee.id.toString()}
                                >
                                  {employee.user?.full_name +
                                    "(" +
                                    employee.id.toString().slice(-4) +
                                    ")" || "Nhân viên không xác định"}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-employees" disabled>
                                Không có nhân viên khả dụng
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start_time">Thời gian bắt đầu</Label>
                        <Input
                          id="start_time"
                          name="start_time"
                          type="datetime-local"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end_time">Thời gian kết thúc</Label>
                        <Input
                          id="end_time"
                          name="end_time"
                          type="datetime-local"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Thêm ca làm việc</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ca làm việc</CardTitle>
              <CardDescription>
                Quản lý lịch làm việc của nhân viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Đang tải dữ liệu...</span>
                </div>
              ) : shiftError ? (
                <div className="flex justify-center items-center py-8 text-destructive">
                  <AlertCircle className="h-8 w-8 mr-2" />
                  <span>{shiftError}</span>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nhân viên</TableHead>
                        <TableHead>Thời gian bắt đầu</TableHead>
                        <TableHead>Thời gian kết thúc</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shifts.length > 0 ? (
                        shifts.map((shift) => {
                          // Format dates for display
                          const startTime = new Date(
                            shift.start_time
                          ).toLocaleString("vi-VN");
                          const endTime = new Date(
                            shift.end_time
                          ).toLocaleString("vi-VN");
                          return (
                            <TableRow key={shift.id}>
                              <TableCell>#{shift.id.slice(-4)}</TableCell>
                              <TableCell className="font-medium">
                                {employees.find(
                                  (e) => e.id === shift.employee_id
                                )?.user?.full_name || "Không xác định"}
                              </TableCell>
                              <TableCell>{startTime}</TableCell>
                              <TableCell>{endTime}</TableCell>

                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedShift(shift);
                                      setIsShiftViewDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteShift(shift.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Không có ca làm việc nào
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {totalShiftPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setShiftsCurrentPage(
                            Math.max(1, shiftsCurrentPage - 1)
                          )
                        }
                        disabled={shiftsCurrentPage === 1}
                      >
                        Trước
                      </Button>
                      <div className="flex items-center mx-2">
                        Trang {shiftsCurrentPage} / {totalShiftPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setShiftsCurrentPage(
                            Math.min(totalShiftPages, shiftsCurrentPage + 1)
                          )
                        }
                        disabled={shiftsCurrentPage === totalShiftPages}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Dialog for viewing/editing shifts */}
          <Dialog
            open={isShiftViewDialogOpen}
            onOpenChange={setIsShiftViewDialogOpen}
          >
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Chi tiết ca làm việc</DialogTitle>
                <DialogDescription>
                  Xem và chỉnh sửa thông tin ca làm việc
                </DialogDescription>
              </DialogHeader>

              {selectedShift && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);

                    const startTime = formData.get("start_time") as string;
                    const endTime = formData.get("end_time") as string;

                    const updatedShift = {
                      employee_id: formData.get("employee_id") as string,
                      start_time: new Date(startTime),
                      end_time: new Date(endTime),
                    };

                    handleUpdateShift(selectedShift.id, updatedShift);
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit_employee_id">Chọn nhân viên</Label>
                        <Select
                          name="employee_id"
                          defaultValue={selectedShift.employee_id}
                          required
                        >
                          <SelectTrigger
                            id="edit_employee_id"
                            className="w-full"
                          >
                            <SelectValue placeholder="Chọn nhân viên" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.length > 0 ? (
                              employees.map((employee) => (
                                <SelectItem
                                  key={employee.id}
                                  value={employee.id.toString()}
                                >
                                  {employee.user?.full_name ||
                                    "Nhân viên không xác định"}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-employees" disabled>
                                Không có nhân viên khả dụng
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit_start_time">
                          Thời gian bắt đầu
                        </Label>
                        <Input
                          id="edit_start_time"
                          name="start_time"
                          type="datetime-local"
                          defaultValue={formatDateTimeVN(
                            selectedShift.start_time
                          )}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit_end_time">
                          Thời gian kết thúc
                        </Label>
                        <Input
                          id="edit_end_time"
                          name="end_time"
                          type="datetime-local"
                          defaultValue={formatDateTimeVN(
                            selectedShift.end_time
                          )}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        handleDeleteShift(selectedShift.id);
                        setIsShiftViewDialogOpen(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa ca làm việc
                    </Button>
                    <Button type="submit">
                      <Edit className="h-4 w-4 mr-2" />
                      Cập nhật
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Create  attendance */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Dialog
              open={isAttendanceCreateDialogOpen || isAttendanceEditDialogOpen}
              onOpenChange={(open) => {
                if (isAttendanceCreateDialogOpen) {
                  setIsAttendanceCreateDialogOpen(open);
                } else if (isAttendanceEditDialogOpen) {
                  setIsAttendanceEditDialogOpen(open);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setIsAttendanceCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chấm công
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);

                    const startTime = formData.get("start_time") as string;
                    const endTime = formData.get("end_time") as string;

                    const newAttendance = {
                      employee_id: formData.get("employee_id") as string,
                      check_in_time: new Date(startTime),
                      check_out_time: new Date(endTime),
                      verified: true,
                    };

                    if (isAttendanceEditDialogOpen && selectedAttendance) {
                      handleUpdateEmployeeAttendance(
                        selectedAttendance.id,
                        newAttendance
                      );
                      console.log("Updating attendance:", newAttendance);
                      return;
                    } else {
                      handleCreateEmployeeAttendance(newAttendance);
                      console.log("Creating attendance:", newAttendance);
                    }
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>
                      {isAttendanceEditDialogOpen
                        ? "Cập nhật chấm công"
                        : "Tạo chấm công"}
                    </DialogTitle>
                    <DialogDescription>
                      {isAttendanceEditDialogOpen
                        ? "Cập nhật thông tin chấm công"
                        : "Nhập thông tin chấm công"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="employee_id">Chọn nhân viên</Label>
                        <Select
                          name="employee_id"
                          required
                          defaultValue={
                            isAttendanceEditDialogOpen && selectedAttendance
                              ? selectedAttendance.employee_id?.toString()
                              : undefined
                          }
                        >
                          <SelectTrigger id="employee_id" className="w-full">
                            <SelectValue placeholder="Chọn nhân viên" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.length > 0 ? (
                              // Nếu đang ở chế độ tạo mới và có nhân viên
                              employees.map((employee) => (
                                <SelectItem
                                  key={employee.id}
                                  value={employee.id.toString()}
                                >
                                  {employee.user?.full_name
                                    ? `${employee.user.full_name} (${employee.id
                                        .toString()
                                        .slice(-4)})`
                                    : "Nhân viên không xác định"}
                                </SelectItem>
                              ))
                            ) : (
                              // Nếu không có nhân viên nào
                              <SelectItem value="no-employees" disabled>
                                Không có nhân viên khả dụng
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start_time">Thời gian check in</Label>
                        <Input
                          id="start_time"
                          name="start_time"
                          type="datetime-local"
                          defaultValue={
                            isAttendanceEditDialogOpen &&
                            selectedAttendance &&
                            selectedAttendance.check_in_time
                              ? formatDateTimeVN(
                                  selectedAttendance.check_in_time
                                )
                              : undefined
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end_time">Thời gian check out</Label>
                        <Input
                          id="end_time"
                          name="end_time"
                          type="datetime-local"
                          defaultValue={
                            isAttendanceEditDialogOpen &&
                            selectedAttendance &&
                            selectedAttendance.check_out_time
                              ? formatDateTimeVN(
                                  selectedAttendance.check_out_time
                                )
                              : undefined
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {isAttendanceEditDialogOpen
                        ? "Cập nhật chấm công"
                        : "Thêm chấm công"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chấm công hôm nay</CardTitle>
              <CardDescription>
                Theo dõi giờ vào ra của nhân viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Giờ vào</TableHead>
                      <TableHead>Giờ ra</TableHead>
                      <TableHead>Xác thực</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances.length > 0 ? (
                      attendances.map((attendance) => (
                        <TableRow key={attendance.id}>
                          <TableCell>{attendance.id.slice(-4)}</TableCell>
                          <TableCell className="font-medium">
                            {employees.find(
                              (e) => e.id === attendance.employee_id
                            )?.user?.full_name || "Không xác định"}
                          </TableCell>
                          <TableCell>
                            {attendance.check_in_time
                              ? new Date(
                                  attendance.check_in_time
                                ).toLocaleString("vi-VN")
                              : ""}
                          </TableCell>
                          <TableCell>
                            {attendance.check_out_time ? (
                              new Date(
                                attendance.check_out_time
                              ).toLocaleString("vi-VN")
                            ) : (
                              <span className="text-muted-foreground">
                                Chưa ra
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                attendance.verified
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {attendance.verified
                                ? "Đã xác thực"
                                : "Chưa xác thực"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAttendance(attendance);
                                  setIsAttendanceEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteEmployeeAttendance(attendance.id)
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
                          Không có bản ghi chấm công nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          {/* Edit and Create */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Dialog
              open={isPayrollCreateDialogOpen || isPayrollEditDialogOpen}
              onOpenChange={(open) => {
                if (isPayrollCreateDialogOpen) {
                  setIsPayrollCreateDialogOpen(open);
                } else if (isPayrollEditDialogOpen) {
                  setIsPayrollEditDialogOpen(open);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setIsPayrollCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm bản lương
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);

                    const employeeId = formData.get("employee_id") as string;
                    const periodStart = formData.get("period_start") as string;
                    const periodEnd = formData.get("period_end") as string;
                    const hoursWorked = parseFloat(
                      formData.get("hours_worked") as string
                    );
                    const basePay = parseFloat(
                      formData.get("base_pay") as string
                    );
                    const bonus = parseFloat(formData.get("bonus") as string);
                    const taxes = parseFloat(formData.get("taxes") as string);
                    const netPay = parseFloat(
                      formData.get("net_pay") as string
                    );
                    const advanceSalary = parseFloat(
                      formData.get("advance_salary") as string
                    );

                    const newPayroll = {
                      employee_id: employeeId,
                      period_start: new Date(periodStart),
                      period_end: new Date(periodEnd),
                      hours_worked: hoursWorked,
                      base_pay: basePay,
                      bonus: bonus,
                      taxes: taxes,
                      net_pay: netPay,
                      advance_salary: advanceSalary,
                    };

                    if (isPayrollEditDialogOpen && selectedPayroll) {
                      handleUpdatePayrollRecord(selectedPayroll.id, newPayroll);
                      console.log("Updating payroll:", newPayroll);
                    } else {
                      handleCreatePayrollRecord(newPayroll);
                      console.log("Creating payroll:", newPayroll);
                    }
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>
                      {isPayrollCreateDialogOpen
                        ? "Thêm bản lương"
                        : "Sửa bản lương"}
                    </DialogTitle>
                    <DialogDescription>
                      {isPayrollCreateDialogOpen
                        ? "Tạo bản lương mới"
                        : "Cập nhật bản lương"}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="employee_id">Chọn nhân viên</Label>
                        <Select
                          name="employee_id"
                          required
                          defaultValue={
                            isPayrollEditDialogOpen && selectedPayroll
                              ? selectedPayroll.employee_id?.toString()
                              : undefined
                          }
                        >
                          <SelectTrigger id="employee_id" className="w-full">
                            <SelectValue placeholder="Chọn nhân viên" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.length > 0 ? (
                              // Nếu đang ở chế độ tạo mới và có nhân viên
                              employees.map((employee) => (
                                <SelectItem
                                  key={employee.id}
                                  value={employee.id.toString()}
                                >
                                  {employee.user?.full_name
                                    ? `${employee.user.full_name} (${employee.id
                                        .toString()
                                        .slice(-4)})`
                                    : "Nhân viên không xác định"}
                                </SelectItem>
                              ))
                            ) : (
                              // Nếu không có nhân viên nào
                              <SelectItem value="no-employees" disabled>
                                Không có nhân viên khả dụng
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="period_start">Kỳ hạn từ</Label>
                        <Input
                          id="period_start"
                          name="period_start"
                          type="date"
                          defaultValue={
                            isPayrollEditDialogOpen &&
                            selectedPayroll?.period_start
                              ? new Date(selectedPayroll.period_start)
                                  .toISOString()
                                  .slice(0, 10)
                              : undefined
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="period_end">Kỳ hạn đến</Label>
                        <Input
                          id="period_end"
                          name="period_end"
                          type="date"
                          defaultValue={
                            isPayrollEditDialogOpen &&
                            selectedPayroll?.period_end
                              ? new Date(selectedPayroll.period_end)
                                  .toISOString()
                                  .slice(0, 10)
                              : undefined
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="hours_worked">Số giờ làm việc</Label>
                        <Input
                          id="hours_worked"
                          name="hours_worked"
                          type="number"
                          step="0.01"
                          defaultValue={
                            isPayrollEditDialogOpen && selectedPayroll
                              ? selectedPayroll.hours_worked || undefined
                              : undefined
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="base_pay">Lương cơ bản</Label>
                        <Input
                          id="base_pay"
                          name="base_pay"
                          type="number"
                          step="0.01"
                          defaultValue={
                            isPayrollEditDialogOpen && selectedPayroll
                              ? selectedPayroll.base_pay || undefined
                              : undefined
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bonus">Thưởng</Label>
                        <Input
                          id="bonus"
                          name="bonus"
                          type="number"
                          step="0.01"
                          defaultValue={
                            isPayrollEditDialogOpen && selectedPayroll
                              ? selectedPayroll.bonus || undefined
                              : undefined
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="taxes">Thuế</Label>
                        <Input
                          id="taxes"
                          name="taxes"
                          type="number"
                          step="0.01"
                          defaultValue={
                            isPayrollEditDialogOpen && selectedPayroll
                              ? selectedPayroll.taxes || undefined
                              : undefined
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="net_pay">Lương ròng</Label>
                        <Input
                          id="net_pay"
                          name="net_pay"
                          type="number"
                          step="0.01"
                          defaultValue={
                            isPayrollEditDialogOpen && selectedPayroll
                              ? selectedPayroll.net_pay || undefined
                              : undefined
                          }
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="advance_salary">Tạm ứng</Label>
                        <Input
                          id="advance_salary"
                          name="advance_salary"
                          type="number"
                          step="0.01"
                          defaultValue={
                            isPayrollEditDialogOpen && selectedPayroll
                              ? selectedPayroll.advance_salary || undefined
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {isPayrollEditDialogOpen
                        ? "Cập nhật bảng lương"
                        : "Thêm bảng lương"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Bảng lương </CardTitle>
              <CardDescription>
                Quản lý lương và thưởng nhân viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Employee name</TableHead>
                      <TableHead>Period start</TableHead>
                      <TableHead>Period end</TableHead>
                      <TableHead>Hours worked</TableHead>
                      <TableHead>Base pay</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Taxes</TableHead>
                      <TableHead>Net pay</TableHead>
                      <TableHead>Advance salary</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrolls.length > 0 ? (
                      payrolls?.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell className="font-medium">
                            {payroll.id.slice(-4)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {employees.find((e) => e.id === payroll.employee_id)
                              ?.user?.full_name || "Không xác định"}
                          </TableCell>
                          <TableCell>
                            {payroll.period_start ? (
                              new Date(payroll.period_start).toLocaleString(
                                "vi-VN"
                              )
                            ) : (
                              <span className="text-muted-foreground">
                                Chưa ra
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {payroll.period_end ? (
                              new Date(payroll.period_end).toLocaleString(
                                "vi-VN"
                              )
                            ) : (
                              <span className="text-muted-foreground">
                                Chưa ra
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {payroll?.hours_worked?.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell>
                            {payroll?.base_pay?.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell className="font-medium text-primary">
                            {payroll?.bonus?.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell>
                            {payroll?.taxes?.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell>
                            {payroll?.net_pay?.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell>
                            {payroll?.advance_salary?.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayroll(payroll);
                                  setIsPayrollEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => handleDeletePayroll(payroll.id)}
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
                          colSpan={11}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Không có bản ghi chấm công nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
