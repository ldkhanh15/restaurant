"use client"

import { useState } from "react"

interface Notification {
  id: number
  type: "low_stock" | "reservation_confirm" | "order_ready" | "system" | "promotion" | "reminder"
  title: string
  content: string
  recipient_type: "all" | "customers" | "employees" | "specific"
  recipient_ids?: number[]
  sent_at: string
  status: "draft" | "sent" | "scheduled"
  scheduled_at?: string
  read_count: number
  total_recipients: number
  created_by: string
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "low_stock",
    title: "Cảnh báo tồn kho thấp",
    content: "Nguyên liệu 'Hành lá' sắp hết hàng. Số lượng còn lại: 3kg",
    recipient_type: "employees",
    sent_at: "2024-03-20T09:15:00",
    status: "sent",
    read_count: 5,
    total_recipients: 8,
    created_by: "Hệ thống",
  },
  {
    id: 2,
    type: "reservation_confirm",
    title: "Xác nhận đặt bàn",
    content: "Đặt bàn #123 cho khách hàng Nguyễn Văn A đã được xác nhận cho 19:00 hôm nay",
    recipient_type: "specific",
    recipient_ids: [1],
    sent_at: "2024-03-20T14:30:00",
    status: "sent",
    read_count: 1,
    total_recipients: 1,
    created_by: "Nhân viên Lan",
  },
  {
    id: 3,
    type: "promotion",
    title: "Khuyến mãi cuối tuần",
    content: "Giảm 20% cho tất cả món ăn vào cuối tuần. Áp dụng từ thứ 6 đến chủ nhật.",
    recipient_type: "customers",
    sent_at: "2024-03-19T10:00:00",
    status: "sent",
    read_count: 245,
    total_recipients: 500,
    created_by: "Quản lý Marketing",
  },
  {
    id: 4,
    type: "system",
    title: "Bảo trì hệ thống",
    content: "Hệ thống sẽ được bảo trì vào 2:00 AM ngày mai. Dự kiến hoàn thành trong 1 giờ.",
    recipient_type: "all",
    scheduled_at: "2024-03-21T01:00:00",
    status: "scheduled",
    read_count: 0,
    total_recipients: 1000,
    created_by: "IT Admin",
  },
]

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || notification.type === typeFilter
    const matchesStatus = statusFilter === "all" || notification.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "low_stock":
        return "bg-red-100 text-red-800"
      case "reservation_confirm":
        return "bg-blue-100 text-blue-800"
      case "order_ready":
        return "bg-green-100 text-green-800"
      case "system":
        return "bg-gray-100 text-gray-800"
      case "promotion":
        return "bg-purple-100 text-purple-800"
      case "reminder":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trung tâm thông báo</h1>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Tạo thông báo mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="low_stock">Cảnh báo tồn kho</option>
            <option value="reservation_confirm">Xác nhận đặt bàn</option>
            <option value="order_ready">Đơn hàng sẵn sàng</option>
            <option value="system">Hệ thống</option>
            <option value="promotion">Khuyến mãi</option>
            <option value="reminder">Nhắc nhở</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="sent">Đã gửi</option>
            <option value="scheduled">Đã lên lịch</option>
            <option value="draft">Bản nháp</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                    {notification.type === "low_stock" && "Cảnh báo tồn kho"}
                    {notification.type === "reservation_confirm" && "Xác nhận đặt bàn"}
                    {notification.type === "order_ready" && "Đơn hàng sẵn sàng"}
                    {notification.type === "system" && "Hệ thống"}
                    {notification.type === "promotion" && "Khuyến mãi"}
                    {notification.type === "reminder" && "Nhắc nhở"}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                    {notification.status === "sent" && "Đã gửi"}
                    {notification.status === "scheduled" && "Đã lên lịch"}
                    {notification.status === "draft" && "Bản nháp"}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(notification.sent_at || notification.scheduled_at || "").toLocaleString("vi-VN")}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
              <p className="text-gray-600 mb-2">{notification.content}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Người tạo: {notification.created_by}</span>
                <span>
                  Đã đọc: {notification.read_count}/{notification.total_recipients}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
