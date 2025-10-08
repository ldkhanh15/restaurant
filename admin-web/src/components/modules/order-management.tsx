"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Eye, Clock, CheckCircle, XCircle, CreditCard, Banknote } from "lucide-react"

interface Order {
  id: number
  user_id: number
  customer_name: string
  customer_phone: string
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"
  payment_status: "pending" | "paid" | "failed" | "refunded"
  payment_method: "cash" | "card" | "transfer" | "momo" | "zalopay"
  total_amount: number
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  table_number?: number
  notes?: string
}

interface OrderItem {
  id: number
  dish_id: number
  dish_name: string
  quantity: number
  price: number
  customizations?: string
  status: "pending" | "preparing" | "ready" | "served"
  duration_seconds?: number
}

const mockOrders: Order[] = [
  {
    id: 1001,
    user_id: 1,
    customer_name: "Nguyễn Văn A",
    customer_phone: "0901234567",
    status: "preparing",
    payment_status: "paid",
    payment_method: "card",
    total_amount: 285000,
    created_at: "2024-03-20T10:30:00",
    updated_at: "2024-03-20T10:35:00",
    table_number: 5,
    notes: "Không cay, ít muối",
    order_items: [
      {
        id: 1,
        dish_id: 1,
        dish_name: "Phở Bò Tái",
        quantity: 2,
        price: 85000,
        status: "preparing",
        duration_seconds: 300,
      },
      {
        id: 2,
        dish_id: 2,
        dish_name: "Gỏi Cuốn Tôm",
        quantity: 3,
        price: 45000,
        status: "ready",
        customizations: "Không rau thơm",
      },
      {
        id: 3,
        dish_id: 4,
        dish_name: "Cà Phê Sữa Đá",
        quantity: 2,
        price: 30000,
        status: "served",
      },
    ],
  },
  {
    id: 1002,
    user_id: 2,
    customer_name: "Trần Thị B",
    customer_phone: "0907654321",
    status: "ready",
    payment_status: "pending",
    payment_method: "cash",
    total_amount: 155000,
    created_at: "2024-03-20T11:15:00",
    updated_at: "2024-03-20T11:45:00",
    table_number: 8,
    order_items: [
      {
        id: 4,
        dish_id: 1,
        dish_name: "Phở Bò Tái",
        quantity: 1,
        price: 85000,
        status: "ready",
      },
      {
        id: 5,
        dish_id: 3,
        dish_name: "Chè Ba Màu",
        quantity: 2,
        price: 25000,
        status: "ready",
      },
      {
        id: 6,
        dish_id: 4,
        dish_name: "Cà Phê Sữa Đá",
        quantity: 2,
        price: 30000,
        status: "ready",
      },
    ],
  },
  {
    id: 1003,
    user_id: 3,
    customer_name: "Lê Quân C",
    customer_phone: "0912345678",
    status: "delivered",
    payment_status: "paid",
    payment_method: "momo",
    total_amount: 130000,
    created_at: "2024-03-20T09:20:00",
    updated_at: "2024-03-20T10:15:00",
    table_number: 3,
    order_items: [
      {
        id: 7,
        dish_id: 2,
        dish_name: "Gỏi Cuốn Tôm",
        quantity: 2,
        price: 45000,
        status: "served",
      },
      {
        id: 8,
        dish_id: 4,
        dish_name: "Cà Phê Sữa Đá",
        quantity: 1,
        price: 30000,
        status: "served",
      },
    ],
  },
  {
    id: 1004,
    user_id: 4,
    customer_name: "Phạm Thị D",
    customer_phone: "0923456789",
    status: "cancelled",
    payment_status: "refunded",
    payment_method: "transfer",
    total_amount: 170000,
    created_at: "2024-03-20T08:45:00",
    updated_at: "2024-03-20T09:00:00",
    order_items: [
      {
        id: 9,
        dish_id: 1,
        dish_name: "Phở Bò Tái",
        quantity: 2,
        price: 85000,
        status: "pending",
      },
    ],
  },
]

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.customer_phone.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Chờ xử lý
          </Badge>
        )
      case "preparing":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Đang chuẩn bị
          </Badge>
        )
      case "ready":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sẵn sàng
          </Badge>
        )
      case "delivered":
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã giao
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Đã hủy
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Chờ thanh toán
          </Badge>
        )
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã thanh toán
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Thất bại
          </Badge>
        )
      case "refunded":
        return <Badge className="bg-orange-100 text-orange-800">Đã hoàn tiền</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "card":
      case "transfer":
      case "momo":
      case "zalopay":
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "cash":
        return "Tiền mặt"
      case "card":
        return "Thẻ"
      case "transfer":
        return "Chuyển khoản"
      case "momo":
        return "MoMo"
      case "zalopay":
        return "ZaloPay"
      default:
        return method
    }
  }

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() } : order,
      ),
    )
  }

  const updatePaymentStatus = (orderId: number, newStatus: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? { ...order, payment_status: newStatus as any, updated_at: new Date().toISOString() }
          : order,
      ),
    )
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalRevenue: orders.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + o.total_amount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang chuẩn bị</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.preparing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sẵn sàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã giao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-primary">{stats.totalRevenue.toLocaleString("vi-VN")}đ</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Danh sách đơn hàng</TabsTrigger>
          <TabsTrigger value="kitchen">Bếp</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm đơn hàng..."
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
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                  <SelectItem value="ready">Sẵn sàng</SelectItem>
                  <SelectItem value="delivered">Đã giao</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thanh toán</SelectItem>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                  <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách đơn hàng</CardTitle>
              <CardDescription>
                Quản lý tất cả đơn hàng trong hệ thống ({filteredOrders.length} đơn hàng)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Bàn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.table_number ? `Bàn ${order.table_number}` : "Mang về"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(order.status)}
                          <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                            <SelectTrigger className="w-32 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ xử lý</SelectItem>
                              <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                              <SelectItem value="ready">Sẵn sàng</SelectItem>
                              <SelectItem value="delivered">Đã giao</SelectItem>
                              <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getPaymentBadge(order.payment_status)}
                          <Select
                            value={order.payment_status}
                            onValueChange={(value) => updatePaymentStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ thanh toán</SelectItem>
                              <SelectItem value="paid">Đã thanh toán</SelectItem>
                              <SelectItem value="failed">Thất bại</SelectItem>
                              <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(order.payment_method)}
                          <span className="text-sm">{getPaymentMethodName(order.payment_method)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.total_amount.toLocaleString("vi-VN")}đ</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(order.created_at).toLocaleDateString("vi-VN")}</p>
                          <p className="text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kitchen" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders
              .filter((order) => ["pending", "preparing"].includes(order.status))
              .map((order) => (
                <Card key={order.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Đơn #{order.id}</CardTitle>
                        <CardDescription>
                          {order.customer_name} - {order.table_number ? `Bàn ${order.table_number}` : "Mang về"}
                        </CardDescription>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{item.dish_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Số lượng: {item.quantity}
                            {item.customizations && ` - ${item.customizations}`}
                          </p>
                        </div>
                        <Badge
                          variant={item.status === "ready" ? "default" : "outline"}
                          className={item.status === "ready" ? "bg-green-100 text-green-800" : ""}
                        >
                          {item.status === "pending"
                            ? "Chờ"
                            : item.status === "preparing"
                              ? "Đang làm"
                              : item.status === "ready"
                                ? "Xong"
                                : "Đã phục vụ"}
                        </Badge>
                      </div>
                    ))}
                    {order.notes && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm">
                          <strong>Ghi chú:</strong> {order.notes}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        disabled={order.status === "preparing"}
                      >
                        Bắt đầu làm
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        disabled={order.status !== "preparing"}
                      >
                        Hoàn thành
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Thông tin chi tiết về đơn hàng</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Khách hàng</Label>
                  <p className="text-sm">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bàn</Label>
                  <p className="text-sm">
                    {selectedOrder.table_number ? `Bàn ${selectedOrder.table_number}` : "Mang về"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trạng thái đơn hàng</Label>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <Label className="text-sm font-medium">Trạng thái thanh toán</Label>
                  {getPaymentBadge(selectedOrder.payment_status)}
                </div>
                <div>
                  <Label className="text-sm font-medium">Phương thức thanh toán</Label>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(selectedOrder.payment_method)}
                    <span className="text-sm">{getPaymentMethodName(selectedOrder.payment_method)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tổng tiền</Label>
                  <p className="text-lg font-semibold text-primary">
                    {selectedOrder.total_amount.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label className="text-sm font-medium">Ghi chú</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Món ăn đã đặt</Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <p className="font-medium">{item.dish_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Số lượng: {item.quantity} × {item.price.toLocaleString("vi-VN")}đ
                        </p>
                        {item.customizations && (
                          <p className="text-sm text-muted-foreground">Yêu cầu: {item.customizations}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{(item.quantity * item.price).toLocaleString("vi-VN")}đ</p>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Đặt lúc: {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cập nhật: {new Date(selectedOrder.updated_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">Tổng cộng: {selectedOrder.total_amount.toLocaleString("vi-VN")}đ</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
