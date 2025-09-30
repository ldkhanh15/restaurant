"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit, Eye, Clock, CheckCircle, DollarSign, Calendar } from "lucide-react"

interface Employee {
  id: number
  user_id: number
  full_name: string
  email: string
  phone: string
  position: string
  department: string
  hire_date: string
  salary: number
  status: "active" | "inactive" | "terminated"
  face_image_url?: string
  created_at: string
}

interface EmployeeShift {
  id: number
  employee_id: number
  employee_name: string
  shift_date: string
  start_time: string
  end_time: string
  break_duration: number
  status: "scheduled" | "in_progress" | "completed" | "missed"
  actual_start?: string
  actual_end?: string
}

interface AttendanceLog {
  id: number
  employee_id: number
  employee_name: string
  check_in_time: string
  check_out_time?: string
  verified: boolean
  face_image_url?: string
  location: string
  notes?: string
}

interface PayrollRecord {
  id: number
  employee_id: number
  employee_name: string
  period_start: string
  period_end: string
  base_salary: number
  overtime_hours: number
  overtime_pay: number
  bonus: number
  deductions: number
  net_pay: number
  status: "draft" | "approved" | "paid"
}

const mockEmployees: Employee[] = [
  {
    id: 1,
    user_id: 3,
    full_name: "Lê Quân C",
    email: "lequanc@email.com",
    phone: "0912345678",
    position: "Bếp trưởng",
    department: "Bếp",
    hire_date: "2024-01-15",
    salary: 15000000,
    status: "active",
    face_image_url: "/placeholder.svg?key=emp1",
    created_at: "2024-01-15",
  },
  {
    id: 2,
    user_id: 5,
    full_name: "Nguyễn Thị D",
    email: "nguyenthid@email.com",
    phone: "0923456789",
    position: "Phục vụ",
    department: "Phục vụ",
    hire_date: "2024-02-01",
    salary: 8000000,
    status: "active",
    created_at: "2024-02-01",
  },
  {
    id: 3,
    user_id: 6,
    full_name: "Trần Văn E",
    email: "tranvane@email.com",
    phone: "0934567890",
    position: "Thu ngân",
    department: "Phục vụ",
    hire_date: "2024-02-15",
    salary: 9000000,
    status: "active",
    created_at: "2024-02-15",
  },
  {
    id: 4,
    user_id: 7,
    full_name: "Phạm Thị F",
    email: "phamthif@email.com",
    phone: "0945678901",
    position: "Phụ bếp",
    department: "Bếp",
    hire_date: "2024-03-01",
    salary: 7000000,
    status: "inactive",
    created_at: "2024-03-01",
  },
]

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
]

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
]

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
]

export function EmployeeManagement() {
  const [employees] = useState<Employee[]>(mockEmployees)
  const [shifts] = useState<EmployeeShift[]>(mockShifts)
  const [attendance] = useState<AttendanceLog[]>(mockAttendance)
  const [payroll] = useState<PayrollRecord[]>(mockPayroll)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Đang làm việc</Badge>
      case "inactive":
        return <Badge className="bg-yellow-100 text-yellow-800">Tạm nghỉ</Badge>
      case "terminated":
        return <Badge className="bg-red-100 text-red-800">Đã nghỉ việc</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getShiftStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Đã lên lịch
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Đang làm
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Hoàn thành
          </Badge>
        )
      case "missed":
        return <Badge className="bg-red-100 text-red-800">Vắng mặt</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const departments = [...new Set(employees.map((e) => e.department))]
  const activeEmployees = employees.filter((e) => e.status === "active").length
  const todayShifts = shifts.filter((s) => s.shift_date === "2024-03-20").length
  const currentlyWorking = shifts.filter((s) => s.status === "in_progress").length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng nhân viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang làm việc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ca hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayShifts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang trong ca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentlyWorking}</div>
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
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm nhân viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Thêm nhân viên mới</DialogTitle>
                  <DialogDescription>Tạo hồ sơ nhân viên mới</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="emp-name">Họ và tên</Label>
                      <Input id="emp-name" placeholder="Nhập họ và tên" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="emp-email">Email</Label>
                      <Input id="emp-email" type="email" placeholder="Nhập email" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="emp-phone">Số điện thoại</Label>
                      <Input id="emp-phone" placeholder="Nhập số điện thoại" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="emp-position">Vị trí</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vị trí" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chef">Bếp trưởng</SelectItem>
                          <SelectItem value="cook">Phụ bếp</SelectItem>
                          <SelectItem value="waiter">Phục vụ</SelectItem>
                          <SelectItem value="cashier">Thu ngân</SelectItem>
                          <SelectItem value="manager">Quản lý</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="emp-department">Phòng ban</Label>
                      <Select>
                        <SelectTrigger>
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
                      <Label htmlFor="emp-salary">Lương cơ bản</Label>
                      <Input id="emp-salary" type="number" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emp-hire-date">Ngày vào làm</Label>
                    <Input id="emp-hire-date" type="date" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Thêm nhân viên</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Employees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách nhân viên</CardTitle>
              <CardDescription>Quản lý thông tin nhân viên ({filteredEmployees.length} nhân viên)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Vị trí</TableHead>
                    <TableHead>Phòng ban</TableHead>
                    <TableHead>Ngày vào làm</TableHead>
                    <TableHead>Lương</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.face_image_url || "/placeholder.svg"} alt={employee.full_name} />
                            <AvatarFallback>{employee.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.full_name}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>{new Date(employee.hire_date).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell className="font-medium">{employee.salary.toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ca làm việc hôm nay</CardTitle>
              <CardDescription>Quản lý lịch làm việc của nhân viên</CardDescription>
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
                      <TableCell className="font-medium">{shift.employee_name}</TableCell>
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
              <CardDescription>Theo dõi giờ vào ra của nhân viên</CardDescription>
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
                      <TableCell className="font-medium">{log.employee_name}</TableCell>
                      <TableCell>
                        {new Date(log.check_in_time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {log.check_out_time ? (
                          new Date(log.check_out_time).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        ) : (
                          <span className="text-muted-foreground">Chưa ra</span>
                        )}
                      </TableCell>
                      <TableCell>{log.location}</TableCell>
                      <TableCell>
                        <Badge className={log.verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
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
              <CardDescription>Quản lý lương và thưởng nhân viên</CardDescription>
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
                      <TableCell className="font-medium">{record.employee_name}</TableCell>
                      <TableCell>{record.base_salary.toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{record.overtime_hours}h</p>
                          <p className="text-muted-foreground">{record.overtime_pay.toLocaleString("vi-VN")}đ</p>
                        </div>
                      </TableCell>
                      <TableCell>{record.bonus.toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>{record.deductions.toLocaleString("vi-VN")}đ</TableCell>
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
                          {record.status === "paid" ? "Đã trả" : record.status === "approved" ? "Đã duyệt" : "Nháp"}
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
                    alt={selectedEmployee.full_name}
                  />
                  <AvatarFallback className="text-lg">{selectedEmployee.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEmployee.full_name}</h3>
                  <p className="text-muted-foreground">{selectedEmployee.position}</p>
                  {getStatusBadge(selectedEmployee.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedEmployee.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Số điện thoại</Label>
                  <p className="text-sm">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phòng ban</Label>
                  <Badge variant="outline">{selectedEmployee.department}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ngày vào làm</Label>
                  <p className="text-sm">{new Date(selectedEmployee.hire_date).toLocaleDateString("vi-VN")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Lương cơ bản</Label>
                  <p className="text-sm font-semibold text-primary">
                    {selectedEmployee.salary.toLocaleString("vi-VN")}đ
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Thời gian làm việc</Label>
                  <p className="text-sm">
                    {Math.floor(
                      (new Date().getTime() - new Date(selectedEmployee.hire_date).getTime()) /
                        (1000 * 60 * 60 * 24 * 30),
                    )}{" "}
                    tháng
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
