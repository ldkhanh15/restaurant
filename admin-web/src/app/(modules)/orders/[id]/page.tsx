"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Gift,
  User,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  RefreshCw,
  Edit,
  Save,
  X,
} from "lucide-react";
import { api, Order, OrderItem, Voucher } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const ORDER_STATUSES = [
  { value: "pending", label: "Chờ xử lý", color: "status-pending" },
  { value: "confirmed", label: "Đã xác nhận", color: "status-confirmed" },
  { value: "preparing", label: "Đang chuẩn bị", color: "status-preparing" },
  { value: "ready", label: "Sẵn sàng", color: "status-ready" },
  { value: "served", label: "Đã phục vụ", color: "status-served" },
  { value: "completed", label: "Hoàn thành", color: "status-completed" },
  { value: "cancelled", label: "Đã hủy", color: "status-cancelled" },
];

const ITEM_STATUSES = [
  { value: "pending", label: "Chờ", color: "status-pending" },
  { value: "preparing", label: "Đang làm", color: "status-preparing" },
  { value: "ready", label: "Sẵn sàng", color: "status-ready" },
  { value: "completed", label: "Đã lên", color: "status-served" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const response = await api.orders.getById(orderId);
      console.log(response);
      setOrder(response);
    } catch (error) {
      console.error("Failed to load order:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (status: string) => {
    try {
      await api.orders.updateStatus(orderId, status);
      setOrder((prev) => (prev ? { ...prev, status: status as any } : null));
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái đơn hàng thành công",
      });
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng",
        variant: "destructive",
      });
    }
  };

  const updateItemStatus = async (itemId: string, status: string) => {
    try {
      await api.orders.updateItemStatus(itemId, status);
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, status: status as any } : item
          ),
        };
      });
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái món ăn thành công",
      });
    } catch (error) {
      console.error("Failed to update item status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái món ăn",
        variant: "destructive",
      });
    }
  };

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    try {
      await api.orders.updateItemQuantity(itemId, quantity);
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        };
      });
      toast({
        title: "Thành công",
        description: "Cập nhật số lượng món ăn thành công",
      });
    } catch (error) {
      console.error("Failed to update item quantity:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật số lượng món ăn",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await api.orders.deleteItem(itemId);
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== itemId),
        };
      });
      toast({
        title: "Thành công",
        description: "Xóa món ăn thành công",
      });
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa món ăn",
        variant: "destructive",
      });
    }
  };

  const applyVoucher = async () => {
    try {
      await api.orders.applyVoucher(orderId, voucherCode);
      await loadOrder(); // Reload to get updated voucher info
      setShowVoucherDialog(false);
      setVoucherCode("");
      toast({
        title: "Thành công",
        description: "Áp dụng voucher thành công",
      });
    } catch (error) {
      console.error("Failed to apply voucher:", error);
      toast({
        title: "Lỗi",
        description: "Không thể áp dụng voucher",
        variant: "destructive",
      });
    }
  };

  const requestPayment = async () => {
    try {
      await api.orders.requestPayment(orderId, {
        method: paymentMethod,
        amount: order?.total_amount || 0,
      });
      setShowPaymentDialog(false);
      toast({
        title: "Thành công",
        description: "Yêu cầu thanh toán đã được gửi",
      });
    } catch (error) {
      console.error("Failed to request payment:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi yêu cầu thanh toán",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    return ORDER_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return (
      ORDER_STATUSES.find((s) => s.value === status)?.color || "status-pending"
    );
  };

  const getItemStatusLabel = (status: string) => {
    return ITEM_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getItemStatusColor = (status: string) => {
    return (
      ITEM_STATUSES.find((s) => s.value === status)?.color || "status-pending"
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            Đang tải thông tin đơn hàng...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    console.log(order);
    return (
      <div className="text-center py-8">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-muted-foreground mb-4">
          Đơn hàng này có thể đã bị xóa hoặc không tồn tại.
        </p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="luxury-focus"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold gold-text">
              Đơn hàng #{order.id}
            </h1>
            <p className="text-muted-foreground">
              Tạo lúc {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`status-badge ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrder}
            className="luxury-focus"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Trạng thái đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={order.status} onValueChange={updateOrderStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge
                  className={`status-badge ${getStatusColor(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Danh sách món ăn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên món</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.dish_name}
                        {item.special_instructions && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Ghi chú: {item.special_instructions}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateItemQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateItemQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(status) =>
                            updateItemStatus(item.id, status)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ITEM_STATUSES.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Tên khách hàng</Label>
                <p className="text-sm text-muted-foreground">
                  {order.user.username || "Khách vãng lai"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Bàn</Label>
                <p className="text-sm text-muted-foreground">
                  {order.table.table_number || "Chưa chọn bàn"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Tổng kết đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              {order.voucher && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({order.voucher.code}):</span>
                  <span>-{formatCurrency(order.voucher.value)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="gold-text">
                    {formatCurrency(order.final_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog
                open={showVoucherDialog}
                onOpenChange={setShowVoucherDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full luxury-focus">
                    <Gift className="h-4 w-4 mr-2" />
                    Áp dụng Voucher
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Áp dụng Voucher</DialogTitle>
                    <DialogDescription>
                      Nhập mã voucher để áp dụng giảm giá cho đơn hàng này.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="voucher-code">Mã voucher</Label>
                      <Input
                        id="voucher-code"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Nhập mã voucher"
                        className="luxury-focus"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowVoucherDialog(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={applyVoucher} className="luxury-button">
                      Áp dụng
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
              >
                <DialogTrigger asChild>
                  <Button className="w-full luxury-button">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Yêu cầu thanh toán
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yêu cầu thanh toán</DialogTitle>
                    <DialogDescription>
                      Gửi yêu cầu thanh toán cho khách hàng.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="payment-method">
                        Phương thức thanh toán
                      </Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Tiền mặt</SelectItem>
                          <SelectItem value="card">Thẻ</SelectItem>
                          <SelectItem value="vnpay">VNPay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Số tiền</Label>
                      <p className="text-lg font-semibold gold-text">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentDialog(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={requestPayment} className="luxury-button">
                      Gửi yêu cầu
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
