"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Clock, Users, MapPin, CheckCircle, Eye, PartyPopper, Heart, Sparkles, Gift } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

// Mock data for tables and reservations
const floors = [
  { id: "floor-1", name: "Tầng 1", description: "Khu vực chính với view sân vườn" },
  { id: "floor-2", name: "Tầng 2", description: "Không gian riêng tư và lãng mạn" },
]

const tables = [
  {
    id: "table-1",
    name: "T1",
    capacity: 4,
    floor_id: "floor-1",
    position: { x: 100, y: 100 },
    features: ["near_window", "garden_view"],
    status: "available",
  },
  {
    id: "table-2",
    name: "T2",
    capacity: 2,
    floor_id: "floor-1",
    position: { x: 200, y: 100 },
    features: ["romantic", "quiet"],
    status: "reserved",
  },
  {
    id: "table-3",
    name: "T3",
    capacity: 6,
    floor_id: "floor-1",
    position: { x: 300, y: 100 },
    features: ["family_friendly", "spacious"],
    status: "available",
  },
  {
    id: "table-4",
    name: "T4",
    capacity: 8,
    floor_id: "floor-1",
    position: { x: 150, y: 200 },
    features: ["large_group", "central"],
    status: "occupied",
  },
  {
    id: "table-5",
    name: "T5",
    capacity: 4,
    floor_id: "floor-2",
    position: { x: 120, y: 80 },
    features: ["private", "balcony"],
    status: "available",
  },
  {
    id: "table-6",
    name: "T6",
    capacity: 2,
    floor_id: "floor-2",
    position: { x: 250, y: 80 },
    features: ["romantic", "city_view"],
    status: "available",
  },
]

const tableGroups = [
  {
    id: "group-1",
    name: "Nhóm VIP 1",
    capacity: 12,
    floor_id: "floor-2",
    tables: ["table-7", "table-8", "table-9"],
    features: ["private_room", "karaoke", "projector"],
    price_per_hour: 500000,
  },
  {
    id: "group-2",
    name: "Nhóm Gia Đình",
    capacity: 10,
    floor_id: "floor-1",
    tables: ["table-10", "table-11"],
    features: ["family_friendly", "playground_view"],
    price_per_hour: 300000,
  },
]

const eventTypes = [
  {
    id: "birthday",
    name: "Tiệc Sinh Nhật",
    description: "Tổ chức tiệc sinh nhật với trang trí đặc biệt",
    icon: PartyPopper,
    color: "bg-pink-500",
    minGuests: 5,
    extraServices: ["Bánh sinh nhật", "Trang trí bàn", "Nhạc nền", "Chụp ảnh"],
    additionalCost: 200000,
  },
  {
    id: "anniversary",
    name: "Kỷ Niệm",
    description: "Không gian lãng mạn cho ngày đặc biệt",
    icon: Heart,
    color: "bg-red-500",
    minGuests: 2,
    extraServices: ["Trang trí lãng mạn", "Nến thơm", "Hoa tươi", "Menu đặc biệt"],
    additionalCost: 150000,
  },
  {
    id: "celebration",
    name: "Tiệc Mừng",
    description: "Ăn mừng thành công, thăng tiến",
    icon: Sparkles,
    color: "bg-yellow-500",
    minGuests: 4,
    extraServices: ["Trang trí festive", "Champagne", "Bánh mừng", "Photographer"],
    additionalCost: 300000,
  },
  {
    id: "surprise",
    name: "Tiệc Bất Ngờ",
    description: "Tổ chức bất ngờ cho người thân",
    icon: Gift,
    color: "bg-purple-500",
    minGuests: 6,
    extraServices: ["Trang trí bí mật", "Coordination", "Surprise setup", "Video recording"],
    additionalCost: 250000,
  },
]

const timeSlots = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
]

interface ReservationData {
  date: Date | undefined
  time: string
  num_people: number
  customer_name: string
  customer_phone: string
  customer_email: string
  preferences: Record<string, any>
  special_requests: string
  selected_table?: string
  selected_group?: string
  event_type?: string
  event_details?: string
  selected_services?: string[]
}

// Giả lập API để lấy các khung giờ đã được đặt
const fetchBookedSlots = async (tableId: string, date: Date): Promise<string[]> => {
  console.log(`Fetching booked slots for table ${tableId} on ${format(date, "yyyy-MM-dd")}`);
  // Trong ứng dụng thực tế, bạn sẽ gọi API backend ở đây
  // Ví dụ: const response = await apiClient.get(`/reservations/booked-slots?tableId=${tableId}&date=${format(date, "yyyy-MM-dd")}`);
  // return response.data;

  // Dữ liệu giả lập để minh họa
  if (tableId === 'table-2') {
    return ["18:00", "18:30", "19:00"]; // Bàn T2 đã được đặt vào các giờ này
  }
  if (tableId === 'table-4') {
    return ["19:00", "19:30"]; // Bàn T4 đã được đặt vào các giờ này
  }
  return [];
};

export default function ReservationBooking() {
  const [step, setStep] = useState<"form" | "table-selection" | "confirmation" | "success">("form")
  const [selectedFloor, setSelectedFloor] = useState("floor-1")
  const [showFloorPlan, setShowFloorPlan] = useState(false)
  const [reservationData, setReservationData] = useState<ReservationData>({
    date: new Date(),
    time: "",
    num_people: 2,
    customer_name: "Nguyễn Văn An",
    customer_phone: "0901234567",
    customer_email: "an.nguyen@email.com",
    preferences: {},
    special_requests: "",
    selected_services: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(timeSlots);

  // Effect để lọc các khung giờ khi ngày hoặc bàn được chọn thay đổi
  useEffect(() => {
    const filterTimeSlots = async () => {
      if (reservationData.date && (reservationData.selected_table || reservationData.selected_group)) {
        const tableOrGroupId = reservationData.selected_table || reservationData.selected_group!;
        const bookedSlots = await fetchBookedSlots(tableOrGroupId, reservationData.date);
        setAvailableTimeSlots(timeSlots.filter(slot => !bookedSlots.includes(slot)));
      }
    };
    filterTimeSlots();
  }, [reservationData.date, reservationData.selected_table, reservationData.selected_group]);

  const updateReservationData = (updates: Partial<ReservationData>) => {
    setReservationData((prev) => ({ ...prev, ...updates }))
  }

  const handleEventTypeChange = (eventTypeId: string) => {
    const eventType = eventTypes.find((e) => e.id === eventTypeId)
    if (eventType && reservationData.num_people < eventType.minGuests) {
      updateReservationData({
        event_type: eventTypeId,
        num_people: eventType.minGuests,
        selected_services: [],
      })
    } else {
      updateReservationData({
        event_type: eventTypeId,
        selected_services: [],
      })
    }
  }

  const handleServiceToggle = (service: string) => {
    const currentServices = reservationData.selected_services || []
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter((s) => s !== service)
      : [...currentServices, service]

    updateReservationData({ selected_services: updatedServices })
  }

  const calculateTotalCost = () => {
    let total = 0

    if (reservationData.selected_group) {
      const group = tableGroups.find((g) => g.id === reservationData.selected_group)
      if (group) {
        total += group.price_per_hour * 2 // Assume 2 hours
      }
    }

    if (reservationData.event_type) {
      const eventType = eventTypes.find((e) => e.id === reservationData.event_type)
      if (eventType) {
        total += eventType.additionalCost
      }
    }

    return total
  }

  const getAvailableTables = () => {
    return tables.filter((table) => table.status === "available" && table.capacity >= reservationData.num_people)
  }

  const getAvailableGroups = () => {
    return tableGroups.filter((group) => group.capacity >= reservationData.num_people)
  }

  const selectTable = (tableId: string) => {
    updateReservationData({ selected_table: tableId, selected_group: undefined })
  }

  const selectGroup = (groupId: string) => {
    updateReservationData({ selected_group: groupId, selected_table: undefined })
  }

  const proceedToTableSelection = () => {
    if (!reservationData.date || !reservationData.time || !reservationData.customer_name) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }
    setStep("table-selection")
  }

  const proceedToConfirmation = () => {
    if (!reservationData.selected_table && !reservationData.selected_group) {
      alert("Vui lòng chọn bàn hoặc nhóm bàn")
      return
    }
    setStep("confirmation")
  }

  const submitReservation = async () => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockReservationId = `RES-${Date.now()}`
    setReservationId(mockReservationId)
    setStep("success")
    setIsSubmitting(false)
  }

  const FloorPlan = ({ floorId }: { floorId: string }) => {
    const floorTables = tables.filter((table) => table.floor_id === floorId)

    return (
      <div className="relative w-full h-80 bg-muted/20 rounded-lg border border-border overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 400 300">
          {/* Floor background */}
          <rect width="400" height="300" fill="transparent" />

          {/* Tables */}
          {floorTables.map((table) => (
            <g key={table.id}>
              <circle
                cx={table.position.x}
                cy={table.position.y}
                r="25"
                fill={table.status === "available" ? "#22c55e" : table.status === "reserved" ? "#f59e0b" : "#ef4444"}
                fillOpacity="0.2"
                stroke={table.status === "available" ? "#22c55e" : table.status === "reserved" ? "#f59e0b" : "#ef4444"}
                strokeWidth="2"
                className={`cursor-pointer transition-all ${
                  table.status === "available" ? "hover:fill-opacity-40" : ""
                }`}
                onClick={() => table.status === "available" && selectTable(table.id)}
              />
              <text
                x={table.position.x}
                y={table.position.y - 5}
                textAnchor="middle"
                className="text-xs font-semibold fill-foreground"
              >
                {table.name}
              </text>
              <text
                x={table.position.x}
                y={table.position.y + 8}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {table.capacity} chỗ
              </text>
            </g>
          ))}

          {/* Legend */}
          <g transform="translate(10, 250)">
            <circle cx="10" cy="10" r="8" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="2" />
            <text x="25" y="15" className="text-xs fill-foreground">
              Trống
            </text>

            <circle cx="80" cy="10" r="8" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
            <text x="95" y="15" className="text-xs fill-foreground">
              Đã đặt
            </text>

            <circle cx="150" cy="10" r="8" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
            <text x="165" y="15" className="text-xs fill-foreground">
              Đang dùng
            </text>
          </g>
        </svg>
      </div>
    )
  }

  if (step === "success" && reservationId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Đặt Bàn Thành Công!</CardTitle>
            <CardDescription>Cảm ơn bạn đã đặt bàn tại nhà hàng của chúng tôi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="font-semibold">Mã đặt bàn: {reservationId}</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>📅 {reservationData.date ? format(reservationData.date, "dd/MM/yyyy", { locale: vi }) : ""}</p>
                <p>🕐 {reservationData.time}</p>
                <p>👥 {reservationData.num_people} người</p>
                {reservationData.selected_table && (
                  <p>🪑 Bàn: {tables.find((t) => t.id === reservationData.selected_table)?.name}</p>
                )}
                {reservationData.selected_group && (
                  <p>🏢 Nhóm: {tableGroups.find((g) => g.id === reservationData.selected_group)?.name}</p>
                )}
                {/* Show event type in success message */}
                {reservationData.event_type && (
                  <p>🎉 Sự kiện: {eventTypes.find((e) => e.id === reservationData.event_type)?.name}</p>
                )}
              </div>
            </div>
            <Separator />
            <div className="text-center text-sm text-muted-foreground">
              <p>Chúng tôi sẽ liên hệ với bạn để xác nhận trong vòng 15 phút</p>
            </div>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Đặt Bàn Mới
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Đặt Bàn</h1>
          <p className="text-muted-foreground">Đặt bàn trước để đảm bảo có chỗ ngồi tốt nhất</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${step === "form" ? "text-primary" : step === "table-selection" || step === "confirmation" || step === "success" ? "text-green-500" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === "form" ? "bg-primary text-primary-foreground" : step === "table-selection" || step === "confirmation" || step === "success" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
              >
                1
              </div>
              <span>Thông tin</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div
              className={`flex items-center space-x-2 ${step === "table-selection" ? "text-primary" : step === "confirmation" || step === "success" ? "text-green-500" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === "table-selection" ? "bg-primary text-primary-foreground" : step === "confirmation" || step === "success" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
              >
                2
              </div>
              <span>Chọn bàn</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div
              className={`flex items-center space-x-2 ${step === "confirmation" ? "text-primary" : step === "success" ? "text-green-500" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === "confirmation" ? "bg-primary text-primary-foreground" : step === "success" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
              >
                3
              </div>
              <span>Xác nhận</span>
            </div>
          </div>
        </div>

        {/* Step 1: Reservation Form */}
        {step === "form" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Đặt Bàn</CardTitle>
                <CardDescription>Vui lòng điền thông tin để đặt bàn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ngày đặt bàn *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reservationData.date
                            ? format(reservationData.date, "dd/MM/yyyy", { locale: vi })
                            : "Chọn ngày"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={reservationData.date}
                          onSelect={(date) => updateReservationData({ date })}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Giờ đặt bàn *</Label>
                    <Select value={reservationData.time} onValueChange={(time) => updateReservationData({ time })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giờ" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time} {timeSlots.includes(time) ? '' : '(Đã đặt)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Số lượng khách *</Label>
                  <Select
                    value={reservationData.num_people.toString()}
                    onValueChange={(value) => updateReservationData({ num_people: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} người
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Loại sự kiện (tùy chọn)</Label>
                  <Select
                    value={reservationData.event_type || "none"}
                    onValueChange={(value) =>
                      value !== "none"
                        ? handleEventTypeChange(value)
                        : updateReservationData({ event_type: undefined, selected_services: [] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sự kiện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có sự kiện đặc biệt</SelectItem>
                      {eventTypes.map((eventType) => (
                        <SelectItem key={eventType.id} value={eventType.id}>
                          {eventType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {reservationData.event_type && (
                  <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                    {(() => {
                      const selectedEvent = eventTypes.find((e) => e.id === reservationData.event_type)
                      if (!selectedEvent) return null
                      const IconComponent = selectedEvent.icon

                      return (
                        <>
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 ${selectedEvent.color} rounded-lg flex items-center justify-center`}
                            >
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{selectedEvent.name}</h4>
                              <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Chi tiết sự kiện</Label>
                            <Textarea
                              placeholder="Mô tả chi tiết về sự kiện của bạn..."
                              value={reservationData.event_details || ""}
                              onChange={(e) => updateReservationData({ event_details: e.target.value })}
                              rows={2}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label>Dịch vụ bổ sung</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedEvent.extraServices.map((service) => (
                                <div key={service} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={service}
                                    checked={reservationData.selected_services?.includes(service) || false}
                                    onCheckedChange={() => handleServiceToggle(service)}
                                  />
                                  <Label htmlFor={service} className="text-sm">
                                    {service}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            <p>
                              Phí sự kiện:{" "}
                              <span className="font-semibold text-primary">
                                {selectedEvent.additionalCost.toLocaleString("vi-VN")}đ
                              </span>
                            </p>
                            <p>Số khách tối thiểu: {selectedEvent.minGuests} người</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Thông Tin Liên Hệ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input
                        id="name"
                        value={reservationData.customer_name}
                        onChange={(e) => updateReservationData({ customer_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input
                        id="phone"
                        value={reservationData.customer_phone}
                        onChange={(e) => updateReservationData({ customer_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={reservationData.customer_email}
                      onChange={(e) => updateReservationData({ customer_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requests">Yêu cầu đặc biệt</Label>
                  <Textarea
                    id="requests"
                    placeholder="Ví dụ: Gần cửa sổ, khu vực yên tĩnh, kỷ niệm sinh nhật..."
                    value={reservationData.special_requests}
                    onChange={(e) => updateReservationData({ special_requests: e.target.value })}
                  />
                </div>

                <Button className="w-full" onClick={proceedToTableSelection}>
                  Tiếp tục chọn bàn
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sơ Đồ Nhà Hàng</CardTitle>
                  <CardDescription>Xem trước bố cục nhà hàng</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      {floors.map((floor) => (
                        <Button
                          key={floor.id}
                          variant={selectedFloor === floor.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedFloor(floor.id)}
                        >
                          {floor.name}
                        </Button>
                      ))}
                    </div>
                    <FloorPlan floorId={selectedFloor} />
                    <p className="text-sm text-muted-foreground">
                      {floors.find((f) => f.id === selectedFloor)?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Hữu Ích</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Thời gian đặt bàn: Tối đa 2 tiếng</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Nhóm từ 8 người trở lên vui lòng gọi trước</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Table Selection */}
        {step === "table-selection" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Chọn Bàn
                  <Dialog open={showFloorPlan} onOpenChange={setShowFloorPlan}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Xem sơ đồ
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Sơ Đồ Nhà Hàng</DialogTitle>
                        <DialogDescription>Chọn tầng để xem bố cục và chọn bàn</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          {floors.map((floor) => (
                            <Button
                              key={floor.id}
                              variant={selectedFloor === floor.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedFloor(floor.id)}
                            >
                              {floor.name}
                            </Button>
                          ))}
                        </div>
                        <FloorPlan floorId={selectedFloor} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>
                  Chọn bàn phù hợp cho {reservationData.num_people} người vào {reservationData.time} ngày{" "}
                  {reservationData.date ? format(reservationData.date, "dd/MM/yyyy", { locale: vi }) : ""}
                  {/* Show event type in table selection description */}
                  {reservationData.event_type && (
                    <span className="block mt-1 text-primary">
                      🎉 Sự kiện: {eventTypes.find((e) => e.id === reservationData.event_type)?.name}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAvailableTables().map((table) => (
                    <Card
                      key={table.id}
                      className={`cursor-pointer transition-all ${
                        reservationData.selected_table === table.id
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => selectTable(table.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">Bàn {table.name}</h3>
                          <Badge variant="secondary">{table.capacity} chỗ</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {floors.find((f) => f.id === table.floor_id)?.name}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {table.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature === "near_window"
                                ? "Gần cửa sổ"
                                : feature === "garden_view"
                                  ? "View sân vườn"
                                  : feature === "romantic"
                                    ? "Lãng mạn"
                                    : feature === "quiet"
                                      ? "Yên tĩnh"
                                      : feature === "family_friendly"
                                        ? "Thân thiện gia đình"
                                        : feature === "spacious"
                                          ? "Rộng rãi"
                                          : feature === "large_group"
                                            ? "Nhóm lớn"
                                            : feature === "central"
                                              ? "Trung tâm"
                                              : feature === "private"
                                                ? "Riêng tư"
                                                : feature === "balcony"
                                                  ? "Ban công"
                                                  : feature === "city_view"
                                                    ? "View thành phố"
                                                    : feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {getAvailableGroups().length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="font-semibold mb-4">Nhóm Bàn (Phòng Riêng)</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {getAvailableGroups().map((group) => (
                          <Card
                            key={group.id}
                            className={`cursor-pointer transition-all ${
                              reservationData.selected_group === group.id
                                ? "ring-2 ring-primary bg-primary/5"
                                : "hover:shadow-md"
                            }`}
                            onClick={() => selectGroup(group.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">{group.name}</h3>
                                <Badge variant="secondary">{group.capacity} chỗ</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {floors.find((f) => f.id === group.floor_id)?.name}
                              </p>
                              <p className="text-sm font-medium text-primary mb-3">
                                {group.price_per_hour.toLocaleString("vi-VN")}đ/giờ
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {group.features.map((feature) => (
                                  <Badge key={feature} variant="outline" className="text-xs">
                                    {feature === "private_room"
                                      ? "Phòng riêng"
                                      : feature === "karaoke"
                                        ? "Karaoke"
                                        : feature === "projector"
                                          ? "Máy chiếu"
                                          : feature === "family_friendly"
                                            ? "Gia đình"
                                            : feature === "playground_view"
                                              ? "View sân chơi"
                                              : feature}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep("form")}>
                    Quay lại
                  </Button>
                  <Button onClick={proceedToConfirmation}>Xác nhận chọn bàn</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirmation" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Xác Nhận Đặt Bàn</CardTitle>
                <CardDescription>Vui lòng kiểm tra lại thông tin trước khi xác nhận</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Thông Tin Đặt Bàn</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ngày:</span>
                        <span>
                          {reservationData.date ? format(reservationData.date, "dd/MM/yyyy", { locale: vi }) : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giờ:</span>
                        <span>{reservationData.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số khách:</span>
                        <span>{reservationData.num_people} người</span>
                      </div>
                      {reservationData.selected_table && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bàn:</span>
                          <span>{tables.find((t) => t.id === reservationData.selected_table)?.name}</span>
                        </div>
                      )}
                      {reservationData.selected_group && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nhóm bàn:</span>
                          <span>{tableGroups.find((g) => g.id === reservationData.selected_group)?.name}</span>
                        </div>
                      )}
                      {reservationData.event_type && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sự kiện:</span>
                          <span>{eventTypes.find((e) => e.id === reservationData.event_type)?.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Thông Tin Liên Hệ</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tên:</span>
                        <span>{reservationData.customer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SĐT:</span>
                        <span>{reservationData.customer_phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{reservationData.customer_email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {reservationData.event_type && (
                  <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                    <h3 className="font-semibold">Chi Tiết Sự Kiện</h3>
                    {reservationData.event_details && (
                      <p className="text-sm text-muted-foreground">{reservationData.event_details}</p>
                    )}
                    {reservationData.selected_services && reservationData.selected_services.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Dịch vụ đã chọn:</h4>
                        <div className="flex flex-wrap gap-1">
                          {reservationData.selected_services.map((service) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {reservationData.special_requests && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Yêu Cầu Đặc Biệt</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                      {reservationData.special_requests}
                    </p>
                  </div>
                )}

                {calculateTotalCost() > 0 && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Chi Phí Ước Tính</h4>
                    <div className="space-y-1 text-sm">
                      {reservationData.selected_group && (
                        <div className="flex justify-between">
                          <span>Phí phòng riêng (2 giờ):</span>
                          <span>
                            {(
                              tableGroups.find((g) => g.id === reservationData.selected_group)?.price_per_hour || 0 * 2
                            ).toLocaleString("vi-VN")}
                            đ
                          </span>
                        </div>
                      )}
                      {reservationData.event_type && (
                        <div className="flex justify-between">
                          <span>Phí sự kiện:</span>
                          <span>
                            {(
                              eventTypes.find((e) => e.id === reservationData.event_type)?.additionalCost || 0
                            ).toLocaleString("vi-VN")}
                            đ
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Tổng cộng:</span>
                        <span className="text-primary">{calculateTotalCost().toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">*Chưa bao gồm chi phí món ăn và đồ uống</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("table-selection")}>
                    Quay lại
                  </Button>
                  <Button onClick={submitReservation} disabled={isSubmitting}>
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt bàn"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
