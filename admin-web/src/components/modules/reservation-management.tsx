"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  Plus,
  Edit,
  Eye,
  CalendarIcon,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Move,
  RotateCcw,
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface Reservation {
  id: number
  customer_name: string
  customer_phone: string
  customer_email?: string
  reservation_time: string
  num_people: number
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show"
  table_id?: number
  table_number?: number
  preferences?: any
  special_requests?: string
  created_at: string
  updated_at: string
}

interface RestaurantTable {
  id: number
  table_number: number
  capacity: number
  status: "available" | "occupied" | "reserved" | "maintenance"
  location: string
  group_id?: number
  group_name?: string
  position: {
    x: number
    y: number
  }
  rotation?: number
  shape?: "rectangle" | "circle" | "square"
}

const mockTables: RestaurantTable[] = [
  {
    id: 1,
    table_number: 1,
    capacity: 2,
    status: "available",
    location: "Tầng 1 - Cửa sổ",
    position: { x: 50, y: 100 },
    shape: "circle",
  },
  {
    id: 2,
    table_number: 2,
    capacity: 4,
    status: "occupied",
    location: "Tầng 1 - Trung tâm",
    position: { x: 200, y: 150 },
    shape: "rectangle",
  },
  {
    id: 3,
    table_number: 3,
    capacity: 4,
    status: "reserved",
    location: "Tầng 1 - Góc",
    position: { x: 350, y: 100 },
    shape: "rectangle",
  },
  {
    id: 4,
    table_number: 4,
    capacity: 6,
    status: "available",
    location: "Tầng 1 - VIP",
    group_id: 1,
    group_name: "VIP Area",
    position: { x: 500, y: 200 },
    shape: "rectangle",
  },
  {
    id: 5,
    table_number: 5,
    capacity: 8,
    status: "available",
    location: "Tầng 2 - Sân thượng",
    group_id: 2,
    group_name: "Rooftop",
    position: { x: 100, y: 300 },
    shape: "rectangle",
  },
  {
    id: 6,
    table_number: 6,
    capacity: 2,
    status: "maintenance",
    location: "Tầng 1 - Cửa sổ",
    position: { x: 300, y: 300 },
    shape: "circle",
  },
  {
    id: 7,
    table_number: 7,
    capacity: 4,
    status: "available",
    location: "Tầng 2 - Ban công",
    position: { x: 450, y: 350 },
    shape: "square",
  },
  {
    id: 8,
    table_number: 8,
    capacity: 6,
    status: "reserved",
    location: "Tầng 2 - VIP",
    group_id: 1,
    group_name: "VIP Area",
    position: { x: 250, y: 250 },
    shape: "rectangle",
  },
]

const mockReservations: Reservation[] = [
  {
    id: 1,
    customer_name: "Nguyễn Văn A",
    customer_phone: "0901234567",
    customer_email: "nguyenvana@email.com",
    reservation_time: "2024-03-20T19:00:00",
    num_people: 4,
    status: "confirmed",
    table_id: 3,
    table_number: 3,
    preferences: { dietary: "vegetarian", seating: "quiet" },
    special_requests: "Sinh nhật, cần bánh kem",
    created_at: "2024-03-18T10:30:00",
    updated_at: "2024-03-18T10:30:00",
  },
  {
    id: 2,
    customer_name: "Trần Thị B",
    customer_phone: "0907654321",
    customer_email: "tranthib@email.com",
    reservation_time: "2024-03-20T20:30:00",
    num_people: 2,
    status: "pending",
    special_requests: "Bàn gần cửa sổ",
    created_at: "2024-03-19T14:15:00",
    updated_at: "2024-03-19T14:15:00",
  },
  {
    id: 3,
    customer_name: "Lê Quân C",
    customer_phone: "0912345678",
    reservation_time: "2024-03-21T18:00:00",
    num_people: 6,
    status: "confirmed",
    table_id: 8,
    table_number: 8,
    preferences: { occasion: "business" },
    special_requests: "Họp kinh doanh, cần yên tĩnh",
    created_at: "2024-03-19T16:45:00",
    updated_at: "2024-03-19T17:00:00",
  },
  {
    id: 4,
    customer_name: "Phạm Thị D",
    customer_phone: "0923456789",
    reservation_time: "2024-03-19T19:30:00",
    num_people: 3,
    status: "completed",
    table_id: 1,
    table_number: 1,
    created_at: "2024-03-18T09:20:00",
    updated_at: "2024-03-19T21:00:00",
  },
  {
    id: 5,
    customer_name: "Hoàng Văn E",
    customer_phone: "0934567890",
    reservation_time: "2024-03-20T12:00:00",
    num_people: 8,
    status: "cancelled",
    special_requests: "Tiệc công ty",
    created_at: "2024-03-17T11:30:00",
    updated_at: "2024-03-19T09:15:00",
  },
]

export function ReservationManagement() {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations)
  const [tables, setTables] = useState<RestaurantTable[]>(mockTables)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date())
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [draggedReservation, setDraggedReservation] = useState<Reservation | null>(null)
  const [draggedTable, setDraggedTable] = useState<RestaurantTable | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLayoutMode, setIsLayoutMode] = useState(false)
  const floorPlanRef = useRef<HTMLDivElement>(null)

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_phone.includes(searchTerm) ||
      reservation.id.toString().includes(searchTerm)

    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter

    const matchesDate =
      !dateFilter || new Date(reservation.reservation_time).toDateString() === dateFilter.toDateString()

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Chờ xác nhận
          </Badge>
        )
      case "confirmed":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã xác nhận
          </Badge>
        )
      case "seated":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Users className="h-3 w-3 mr-1" />
            Đã nhận bàn
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Hoàn thành
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Đã hủy
          </Badge>
        )
      case "no_show":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            Không đến
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTableStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Trống</Badge>
      case "occupied":
        return <Badge className="bg-red-100 text-red-800">Có khách</Badge>
      case "reserved":
        return <Badge className="bg-blue-100 text-blue-800">Đã đặt</Badge>
      case "maintenance":
        return <Badge className="bg-gray-100 text-gray-800">Bảo trì</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const updateReservationStatus = (reservationId: number, newStatus: string) => {
    setReservations(
      reservations.map((reservation) =>
        reservation.id === reservationId
          ? { ...reservation, status: newStatus as any, updated_at: new Date().toISOString() }
          : reservation,
      ),
    )
  }

  const assignTable = (reservationId: number, tableId: number) => {
    const table = tables.find((t) => t.id === tableId)
    setReservations(
      reservations.map((reservation) =>
        reservation.id === reservationId
          ? {
              ...reservation,
              table_id: tableId,
              table_number: table?.table_number,
              updated_at: new Date().toISOString(),
            }
          : reservation,
      ),
    )
    // Update table status to reserved if it was available
    if (table && table.status === "available") {
      setTables(tables.map((t) => (t.id === tableId ? { ...t, status: "reserved" as const } : t)))
    }
  }

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    today: reservations.filter((r) => new Date(r.reservation_time).toDateString() === new Date().toDateString()).length,
    availableTables: tables.filter((t) => t.status === "available").length,
  }

  const handleReservationDragStart = (e: React.DragEvent, reservation: Reservation) => {
    setDraggedReservation(reservation)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleReservationDragEnd = () => {
    setDraggedReservation(null)
    setIsDragging(false)
  }

  const handleTableDrop = (e: React.DragEvent, table: RestaurantTable) => {
    e.preventDefault()
    if (draggedReservation && table.status === "available") {
      assignTable(draggedReservation.id, table.id)
      // Update table status to reserved
      setTables(tables.map((t) => (t.id === table.id ? { ...t, status: "reserved" as const } : t)))
    }
  }

  const handleTableDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleTableLayoutDragStart = (e: React.DragEvent, table: RestaurantTable) => {
    if (!isLayoutMode) return
    setDraggedTable(table)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleTableLayoutDragEnd = () => {
    setDraggedTable(null)
  }

  const handleFloorPlanDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedTable && floorPlanRef.current) {
      const rect = floorPlanRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setTables(
        tables.map((t) =>
          t.id === draggedTable.id ? { ...t, position: { x: Math.max(0, x - 40), y: Math.max(0, y - 40) } } : t,
        ),
      )
    }
  }

  const handleFloorPlanDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const rotateTable = (tableId: number) => {
    setTables(tables.map((t) => (t.id === tableId ? { ...t, rotation: ((t.rotation || 0) + 45) % 360 } : t)))
  }

  const resetLayout = () => {
    setTables(mockTables)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng đặt bàn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bàn trống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.availableTables}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reservations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reservations">Danh sách đặt bàn</TabsTrigger>
          <TabsTrigger value="tables">Sơ đồ bàn</TabsTrigger>
          <TabsTrigger value="floor-plan">Bố trí sàn</TabsTrigger>
        </TabsList>

        <TabsContent value="reservations" className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm đặt bàn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="seated">Đã nhận bàn</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                  <SelectItem value="no_show">Không đến</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48 justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Đặt bàn mới
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tạo đặt bàn mới</DialogTitle>
                  <DialogDescription>Tạo đặt bàn mới cho khách hàng</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="customer-name">Tên khách hàng</Label>
                      <Input id="customer-name" placeholder="Nhập tên khách hàng" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customer-phone">Số điện thoại</Label>
                      <Input id="customer-phone" placeholder="Nhập số điện thoại" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-email">Email (tùy chọn)</Label>
                    <Input id="customer-email" type="email" placeholder="Nhập email" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="reservation-date">Ngày đặt</Label>
                      <Input id="reservation-date" type="date" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reservation-time">Giờ đặt</Label>
                      <Input id="reservation-time" type="time" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="num-people">Số người</Label>
                      <Input id="num-people" type="number" min="1" placeholder="1" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="table-select">Bàn (tùy chọn)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn bàn" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables
                            .filter((t) => t.status === "available")
                            .map((table) => (
                              <SelectItem key={table.id} value={table.id.toString()}>
                                Bàn {table.table_number} ({table.capacity} người) - {table.location}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="special-requests">Yêu cầu đặc biệt</Label>
                    <Textarea id="special-requests" placeholder="Ghi chú yêu cầu đặc biệt..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Tạo đặt bàn</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reservations List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách đặt bàn</CardTitle>
                  <CardDescription>
                    Kéo thả đặt bàn vào bàn trống để phân bàn ({filteredReservations.length} đặt bàn)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        draggable={reservation.status === "confirmed" && !reservation.table_id}
                        onDragStart={(e) => handleReservationDragStart(e, reservation)}
                        onDragEnd={handleReservationDragEnd}
                        className={`p-4 border rounded-lg transition-all ${
                          reservation.status === "confirmed" && !reservation.table_id
                            ? "cursor-move hover:shadow-md hover:border-primary/50"
                            : ""
                        } ${draggedReservation?.id === reservation.id ? "opacity-50" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">#{reservation.id}</span>
                              {getStatusBadge(reservation.status)}
                              {reservation.status === "confirmed" && !reservation.table_id && (
                                <Badge variant="outline" className="text-xs">
                                  <Move className="h-3 w-3 mr-1" />
                                  Kéo để phân bàn
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{reservation.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{reservation.customer_phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              {new Date(reservation.reservation_time).toLocaleDateString("vi-VN")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(reservation.reservation_time).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {reservation.num_people} người
                            </span>
                            {reservation.table_number && (
                              <span className="font-medium text-blue-600">Bàn {reservation.table_number}</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Table Assignment */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Bàn trống</CardTitle>
                  <CardDescription>Thả đặt bàn vào đây để phân bàn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tables
                      .filter((table) => table.status === "available")
                      .map((table) => (
                        <div
                          key={table.id}
                          onDrop={(e) => handleTableDrop(e, table)}
                          onDragOver={handleTableDragOver}
                          className={`p-3 border-2 border-dashed rounded-lg transition-all ${
                            isDragging
                              ? "border-primary bg-primary/5 hover:bg-primary/10"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Bàn {table.table_number}</p>
                              <p className="text-sm text-muted-foreground">
                                <Users className="h-3 w-3 inline mr-1" />
                                {table.capacity} người
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Trống</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{table.location}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Sơ đồ bàn nhà hàng</h3>
              <p className="text-sm text-muted-foreground">Quản lý trạng thái và vị trí các bàn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`border-l-4 ${
                  table.status === "available"
                    ? "border-l-green-500"
                    : table.status === "occupied"
                      ? "border-l-red-500"
                      : table.status === "reserved"
                        ? "border-l-blue-500"
                        : "border-l-gray-500"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Bàn {table.table_number}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {table.capacity} người
                      </CardDescription>
                    </div>
                    {getTableStatusBadge(table.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {table.location}
                  </div>
                  {table.group_name && (
                    <Badge variant="outline" className="text-xs">
                      {table.group_name}
                    </Badge>
                  )}
                  {table.status === "reserved" && (
                    <div className="text-xs text-blue-600">
                      {reservations
                        .filter((r) => r.table_id === table.id && r.status === "confirmed")
                        .map((r) => (
                          <div key={r.id}>
                            {r.customer_name} -{" "}
                            {new Date(r.reservation_time).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="floor-plan" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Bố trí sàn nhà hàng</h3>
              <p className="text-sm text-muted-foreground">Kéo thả để sắp xếp lại vị trí bàn. Nhấp để xoay bàn.</p>
            </div>
            <div className="flex gap-2">
              <Button variant={isLayoutMode ? "default" : "outline"} onClick={() => setIsLayoutMode(!isLayoutMode)}>
                <Move className="h-4 w-4 mr-2" />
                {isLayoutMode ? "Thoát chế độ sắp xếp" : "Chế độ sắp xếp"}
              </Button>
              <Button variant="outline" onClick={resetLayout}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Đặt lại
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div
                ref={floorPlanRef}
                className="relative bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg"
                style={{ height: "600px", width: "100%" }}
                onDrop={handleFloorPlanDrop}
                onDragOver={handleFloorPlanDragOver}
              >
                {/* Floor Plan Grid */}
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ccc" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Tables */}
                {tables.map((table) => {
                  const tableStyle = {
                    position: "absolute" as const,
                    left: `${table.position.x}px`,
                    top: `${table.position.y}px`,
                    transform: `rotate(${table.rotation || 0}deg)`,
                    cursor: isLayoutMode ? "move" : "pointer",
                    zIndex: draggedTable?.id === table.id ? 1000 : 1,
                  }

                  return (
                    <div
                      key={table.id}
                      style={tableStyle}
                      draggable={isLayoutMode}
                      onDragStart={(e) => handleTableLayoutDragStart(e, table)}
                      onDragEnd={handleTableLayoutDragEnd}
                      onClick={() => isLayoutMode && rotateTable(table.id)}
                      className={`
                        w-20 h-20 border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all
                        ${
                          table.status === "available"
                            ? "bg-green-100 border-green-500 text-green-800"
                            : table.status === "occupied"
                              ? "bg-red-100 border-red-500 text-red-800"
                              : table.status === "reserved"
                                ? "bg-blue-100 border-blue-500 text-blue-800"
                                : "bg-gray-100 border-gray-500 text-gray-800"
                        }
                        ${table.shape === "circle" ? "rounded-full" : table.shape === "square" ? "rounded-lg" : "rounded-md"}
                        ${isLayoutMode ? "hover:shadow-lg hover:scale-105" : ""}
                        ${draggedTable?.id === table.id ? "opacity-50" : ""}
                      `}
                    >
                      <div className="text-center">
                        <div className="font-bold">{table.table_number}</div>
                        <div className="text-xs">{table.capacity}p</div>
                      </div>
                    </div>
                  )
                })}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-sm border">
                  <h4 className="font-medium text-sm mb-2">Chú thích</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
                      <span>Trống</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
                      <span>Đã đặt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
                      <span>Có khách</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-100 border border-gray-500 rounded"></div>
                      <span>Bảo trì</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {isLayoutMode && (
                  <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Hướng dẫn:</p>
                      <p>• Kéo bàn để di chuyển</p>
                      <p>• Nhấp để xoay bàn</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Reservation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đặt bàn #{selectedReservation?.id}</DialogTitle>
            <DialogDescription>Thông tin chi tiết về đặt bàn</DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Khách hàng</Label>
                  <p className="text-sm">{selectedReservation.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReservation.customer_phone}</p>
                  {selectedReservation.customer_email && (
                    <p className="text-sm text-muted-foreground">{selectedReservation.customer_email}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Thời gian đặt bàn</Label>
                  <p className="text-sm">
                    {new Date(selectedReservation.reservation_time).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedReservation.reservation_time).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Số người</Label>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedReservation.num_people} người</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bàn</Label>
                  <p className="text-sm">
                    {selectedReservation.table_number ? `Bàn ${selectedReservation.table_number}` : "Chưa chọn bàn"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trạng thái</Label>
                  {getStatusBadge(selectedReservation.status)}
                </div>
              </div>

              {selectedReservation.special_requests && (
                <div>
                  <Label className="text-sm font-medium">Yêu cầu đặc biệt</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedReservation.special_requests}</p>
                </div>
              )}

              {selectedReservation.preferences && (
                <div>
                  <Label className="text-sm font-medium">Sở thích khách hàng</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <pre className="text-xs text-muted-foreground">
                      {JSON.stringify(selectedReservation.preferences, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Đặt lúc: {new Date(selectedReservation.created_at).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cập nhật: {new Date(selectedReservation.updated_at).toLocaleString("vi-VN")}
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
