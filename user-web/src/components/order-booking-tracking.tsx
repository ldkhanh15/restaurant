"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Clock,
  CheckCircle,
  Truck,
  ChefHat,
  Calendar,
  MapPin,
  Phone,
  Star,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Receipt,
  Users,
  Utensils,
  Timer,
  Package,
  Edit,
  Save,
  X,
  Trash2,
} from "lucide-react"

const mockOrders = [
  {
    id: "ORD-2024-001",
    type: "delivery",
    status: "preparing",
    created_at: "2024-01-15T18:30:00Z",
    estimated_completion: "2024-01-15T19:15:00Z",
    total_amount: 850000,
    items: [
      { name: "Cá Hồi Nướng", quantity: 2, price: 350000 },
      { name: "Bánh Chocolate", quantity: 1, price: 120000 },
      { name: "Nước Cam Tươi", quantity: 2, price: 30000 },
    ],
    delivery_address: "123 Đường ABC, Quận 1, TP.HCM",
    phone: "0901234567",
    progress: 60,
    timeline: [
      { status: "confirmed", time: "18:30", completed: true, description: "Đơn hàng được xác nhận" },
      { status: "preparing", time: "18:45", completed: true, description: "Bắt đầu chế biến món ăn" },
      { status: "cooking", time: "19:00", completed: false, description: "Đang nấu món chính" },
      { status: "packaging", time: "19:10", completed: false, description: "Đóng gói và chuẩn bị giao hàng" },
      { status: "delivering", time: "19:15", completed: false, description: "Đang giao hàng" },
      { status: "delivered", time: "19:30", completed: false, description: "Giao hàng thành công" },
    ],
  },
  {
    id: "ORD-2024-002",
    type: "takeaway",
    status: "ready",
    created_at: "2024-01-15T17:00:00Z",
    estimated_completion: "2024-01-15T17:30:00Z",
    total_amount: 450000,
    items: [{ name: "Bò Beefsteak", quantity: 1, price: 450000 }],
    phone: "0901234567",
    progress: 100,
    timeline: [
      { status: "confirmed", time: "17:00", completed: true, description: "Đơn hàng được xác nhận" },
      { status: "preparing", time: "17:05", completed: true, description: "Bắt đầu chế biến" },
      { status: "cooking", time: "17:15", completed: true, description: "Đang nấu món ăn" },
      { status: "ready", time: "17:30", completed: true, description: "Sẵn sàng để lấy" },
    ],
  },
]

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
  // Order statuses
  confirmed: { label: "Đã Xác Nhận", color: "bg-blue-500", icon: CheckCircle },
  preparing: { label: "Đang Chuẩn Bị", color: "bg-yellow-500", icon: ChefHat },
  cooking: { label: "Đang Nấu", color: "bg-orange-500", icon: ChefHat },
  packaging: { label: "Đóng Gói", color: "bg-purple-500", icon: Package },
  ready: { label: "Sẵn Sàng", color: "bg-green-500", icon: CheckCircle },
  delivering: { label: "Đang Giao", color: "bg-blue-600", icon: Truck },
  delivered: { label: "Đã Giao", color: "bg-green-600", icon: CheckCircle },

  // Booking statuses
  pending: { label: "Chờ Xác Nhận", color: "bg-yellow-500", icon: Clock },
  cancelled: { label: "Đã Hủy", color: "bg-red-500", icon: AlertCircle },
}

export default function OrderBookingTracking({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("orders")
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [editingOrder, setEditingOrder] = useState<string | null>(null)
  const [editingBooking, setEditingBooking] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  const [editOrderForm, setEditOrderForm] = useState({
    delivery_address: "",
    phone: "",
    special_requests: "",
  })

  const [editBookingForm, setEditBookingForm] = useState({
    date: "",
    time: "",
    party_size: 0,
    special_requests: "",
    phone: "",
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const handleEditOrder = (orderId: string) => {
    const order = mockOrders.find((o) => o.id === orderId)
    if (order) {
      setEditOrderForm({
        delivery_address: order.delivery_address || "",
        phone: order.phone,
        special_requests: "",
      })
      setEditingOrder(orderId)
    }
  }

  const handleSaveOrderEdit = async (orderId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingOrder(null)
    // Show success message
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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingBooking(null)
    // Show success message
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!cancelReason.trim()) return
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setShowCancelDialog(null)
    setCancelReason("")
    // Update order status to cancelled
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!cancelReason.trim()) return
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setShowCancelDialog(null)
    setCancelReason("")
    // Update booking status to cancelled
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

  const getTimeRemaining = (estimatedTime: string) => {
    const now = new Date()
    const estimated = new Date(estimatedTime)
    const diff = estimated.getTime() - now.getTime()

    if (diff <= 0) return "Đã hoàn thành"

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}p`
    }
    return `${minutes}p`
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Theo Dõi Đơn Hàng & Đặt Bàn</DialogTitle>
                <DialogDescription>Xem trạng thái và tiến độ của các đơn hàng và đặt bàn của bạn</DialogDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Làm Mới
              </Button>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders" className="flex items-center space-x-2">
                <Receipt className="w-4 h-4" />
                <span>Đơn Hàng ({mockOrders.length})</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Đặt Bàn ({mockBookings.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              {mockOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-3">
                          <span>#{order.id}</span>
                          {getStatusBadge(order.status)}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-2">
                          <span>
                            {formatDate(order.created_at)} • {formatTime(order.created_at)}
                          </span>
                          <Badge variant="outline">{order.type === "delivery" ? "Giao Hàng" : "Mang Đi"}</Badge>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{order.total_amount.toLocaleString("vi-VN")}đ</p>
                        {order.status !== "delivered" && order.status !== "ready" && (
                          <p className="text-sm text-muted-foreground">
                            <Timer className="w-3 h-3 inline mr-1" />
                            Còn {getTimeRemaining(order.estimated_completion)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Tiến độ</span>
                        <span>{order.progress}%</span>
                      </div>
                      <Progress value={order.progress} className="h-2" />
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3 mb-6">
                      {order.timeline.map((step, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${step.completed ? "bg-green-500" : "bg-gray-300"}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm ${step.completed ? "text-foreground" : "text-muted-foreground"}`}
                              >
                                {step.description}
                              </span>
                              <span className="text-xs text-muted-foreground">{step.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Items */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Món Đã Đặt:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.name} x{item.quantity}
                            </span>
                            <span>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.type === "delivery" && (
                      <div className="border-t pt-4 mt-4">
                        {editingOrder === order.id ? (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="delivery_address">Địa chỉ giao hàng</Label>
                              <Input
                                id="delivery_address"
                                value={editOrderForm.delivery_address}
                                onChange={(e) =>
                                  setEditOrderForm((prev) => ({ ...prev, delivery_address: e.target.value }))
                                }
                                placeholder="Nhập địa chỉ giao hàng"
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Số điện thoại</Label>
                              <Input
                                id="phone"
                                value={editOrderForm.phone}
                                onChange={(e) => setEditOrderForm((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="Nhập số điện thoại"
                              />
                            </div>
                            <div>
                              <Label htmlFor="special_requests">Ghi chú đặc biệt</Label>
                              <Textarea
                                id="special_requests"
                                value={editOrderForm.special_requests}
                                onChange={(e) =>
                                  setEditOrderForm((prev) => ({ ...prev, special_requests: e.target.value }))
                                }
                                placeholder="Thêm ghi chú cho đơn hàng"
                                rows={2}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => handleSaveOrderEdit(order.id)}>
                                <Save className="w-4 h-4 mr-2" />
                                Lưu
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setEditingOrder(null)}>
                                <X className="w-4 h-4 mr-2" />
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">Thông tin giao hàng:</h4>
                              {(order.status === "confirmed" || order.status === "preparing") && (
                                <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{order.delivery_address}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                              <Phone className="w-4 h-4" />
                              <span>{order.phone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3 mt-6">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Liên Hệ
                      </Button>
                      {order.status === "delivered" && (
                        <Button variant="outline" size="sm">
                          <Star className="w-4 h-4 mr-2" />
                          Đánh Giá
                        </Button>
                      )}
                      {(order.status === "confirmed" || order.status === "preparing") && (
                        <Button variant="destructive" size="sm" onClick={() => setShowCancelDialog(order.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hủy Đơn
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
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
                            onChange={(e) =>
                              setEditBookingForm((prev) => ({ ...prev, special_requests: e.target.value }))
                            }
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
                        <p className="text-sm text-green-700 mt-1">
                          Vui lòng đến đúng giờ. Bàn sẽ được giữ trong 15 phút.
                        </p>
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
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showCancelDialog && (
        <Dialog open={true} onOpenChange={() => setShowCancelDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Xác nhận hủy</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn hủy {showCancelDialog.startsWith("ORD") ? "đơn hàng" : "đặt bàn"} này không?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                  {showCancelDialog.startsWith("ORD")
                    ? "Đơn hàng đã bắt đầu chế biến có thể không được hoàn tiền 100%."
                    : "Việc hủy đặt bàn trong vòng 2 giờ trước giờ đặt có thể bị tính phí."}
                </AlertDescription>
              </Alert>
              <div className="flex space-x-3 justify-end">
                <Button variant="outline" onClick={() => setShowCancelDialog(null)}>
                  Không hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    showCancelDialog.startsWith("ORD")
                      ? handleCancelOrder(showCancelDialog)
                      : handleCancelBooking(showCancelDialog)
                  }
                >
                  Xác nhận hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
