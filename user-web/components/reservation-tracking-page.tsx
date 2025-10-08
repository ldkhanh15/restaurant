"use client"

import { useState } from "react"
import { useRouter } from "@/lib/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Users,
  Utensils,
  Phone,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Edit,
  Save,
  X,
  Trash2,
} from "lucide-react"

const mockBookings = [
  {
    id: "RES-2024-001",
    status: "confirmed",
    date: "2024-01-16",
    time: "19:00",
    party_size: 4,
    table_number: "T-05",
    table_type: "VIP",
    special_requests: "Kỷ niệm sinh nhật, cần bánh kem",
    customer_name: "Nguyễn Văn An",
    phone: "0901234567",
    created_at: "2024-01-15T10:00:00Z",
    pre_orders: [
      { name: "Cá Hồi Nướng", quantity: 2, price: 350000 },
      { name: "Rượu Vang Đỏ", quantity: 1, price: 800000 },
    ],
    total_pre_order: 1500000,
  },
  {
    id: "RES-2024-002",
    status: "pending",
    date: "2024-01-18",
    time: "20:00",
    party_size: 2,
    table_number: "T-12",
    table_type: "Romantic",
    special_requests: "Bàn gần cửa sổ, không gian riêng tư",
    customer_name: "Nguyễn Văn An",
    phone: "0901234567",
    created_at: "2024-01-15T14:00:00Z",
    pre_orders: [],
    total_pre_order: 0,
  },
]

const statusConfig = {
  confirmed: { label: "Đã Xác Nhận", color: "bg-green-500", icon: CheckCircle },
  pending: { label: "Chờ Xác Nhận", color: "bg-yellow-500", icon: Clock },
  cancelled: { label: "Đã Hủy", color: "bg-red-500", icon: AlertCircle },
}

export default function ReservationTrackingPage() {
  const { navigate } = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [editingBooking, setEditingBooking] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  const [editBookingForm, setEditBookingForm] = useState({
    date: "",
    time: "",
    party_size: 0,
    special_requests: "",
    phone: "",
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const handleEditBooking = (bookingId: string) => {
    const booking = mockBookings.find((b) => b.id === bookingId)
    if (booking) {
      setEditBookingForm({
        date: booking.date,
        time: booking.time,
        party_size: booking.party_size,
        special_requests: booking.special_requests,
        phone: booking.phone,
      })
      setEditingBooking(bookingId)
    }
  }

  const handleSaveBookingEdit = async (bookingId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingBooking(null)
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!cancelReason.trim()) return
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setShowCancelDialog(null)
    setCancelReason("")
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const IconComponent = config.icon
    return (
      <Badge className={`${config.color} text-white border-0`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("home")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về Trang Chủ
              </Button>
              <div>
                <h1 className="text-xl font-bold">Theo Dõi Đặt Bàn</h1>
                <p className="text-sm text-muted-foreground">Quản lý các đặt bàn của bạn</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Làm Mới
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {mockBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <span>#{booking.id}</span>
                      {getStatusBadge(booking.status)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Đặt lúc: {formatDate(booking.created_at)} • {formatTime(booking.created_at)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {booking.date} • {booking.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {booking.party_size} người
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingBooking === booking.id ? (
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Ngày</Label>
                        <Input
                          id="date"
                          type="date"
                          value={editBookingForm.date}
                          onChange={(e) => setEditBookingForm((prev) => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Giờ</Label>
                        <Select
                          value={editBookingForm.time}
                          onValueChange={(value) => setEditBookingForm((prev) => ({ ...prev, time: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giờ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18:00">18:00</SelectItem>
                            <SelectItem value="18:30">18:30</SelectItem>
                            <SelectItem value="19:00">19:00</SelectItem>
                            <SelectItem value="19:30">19:30</SelectItem>
                            <SelectItem value="20:00">20:00</SelectItem>
                            <SelectItem value="20:30">20:30</SelectItem>
                            <SelectItem value="21:00">21:00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="party_size">Số người</Label>
                        <Select
                          value={editBookingForm.party_size.toString()}
                          onValueChange={(value) =>
                            setEditBookingForm((prev) => ({ ...prev, party_size: Number.parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn số người" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} người
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          value={editBookingForm.phone}
                          onChange={(e) => setEditBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="special_requests">Yêu cầu đặc biệt</Label>
                      <Textarea
                        id="special_requests"
                        value={editBookingForm.special_requests}
                        onChange={(e) => setEditBookingForm((prev) => ({ ...prev, special_requests: e.target.value }))}
                        placeholder="Nhập yêu cầu đặc biệt"
                        rows={2}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleSaveBookingEdit(booking.id)}>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingBooking(null)}>
                        <X className="w-4 h-4 mr-2" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Booking Details */
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Utensils className="w-4 h-4 text-primary" />
                          <span className="font-medium">Bàn {booking.table_number}</span>
                          <Badge variant="outline">{booking.table_type}</Badge>
                        </div>
                        {(booking.status === "confirmed" || booking.status === "pending") && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditBooking(booking.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{booking.phone}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Yêu Cầu Đặc Biệt:</h4>
                      <p className="text-sm text-muted-foreground">
                        {booking.special_requests || "Không có yêu cầu đặc biệt"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pre-orders */}
                {booking.pre_orders.length > 0 && (
                  <div className="border-t pt-4 mb-6">
                    <h4 className="font-semibold mb-3">Món Đặt Trước:</h4>
                    <div className="space-y-2">
                      {booking.pre_orders.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Tổng tiền đặt trước:</span>
                        <span className="text-primary">{booking.total_pre_order.toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status-specific information */}
                {booking.status === "confirmed" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Đặt bàn đã được xác nhận!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">Vui lòng đến đúng giờ. Bàn sẽ được giữ trong 15 phút.</p>
                  </div>
                )}

                {booking.status === "pending" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 text-yellow-800">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Đang chờ xác nhận</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Chúng tôi sẽ liên hệ với bạn trong vòng 30 phút để xác nhận.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Liên Hệ
                  </Button>
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <Button variant="destructive" size="sm" onClick={() => setShowCancelDialog(booking.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hủy Đặt Bàn
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cancel Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Xác nhận hủy</CardTitle>
                <CardDescription>Bạn có chắc chắn muốn hủy đặt bàn này không?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cancel_reason">Lý do hủy (tùy chọn)</Label>
                  <Textarea
                    id="cancel_reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do hủy..."
                    rows={3}
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Việc hủy đặt bàn trong vòng 2 giờ trước giờ đặt có thể bị tính phí.
                  </AlertDescription>
                </Alert>
                <div className="flex space-x-3 justify-end">
                  <Button variant="outline" onClick={() => setShowCancelDialog(null)}>
                    Không hủy
                  </Button>
                  <Button variant="destructive" onClick={() => handleCancelBooking(showCancelDialog)}>
                    Xác nhận hủy
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
