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
  HelpCircle,
  Receipt,
} from "lucide-react";
import { api, Order, OrderItem, Voucher } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useOrderWebSocket } from "@/hooks/useOrderWebSocket";
import { orderService } from "@/services/orderService";
import InvoiceForm from "@/components/shared/InvoiceForm";

const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Chờ xử lý",
    color: "status-pending",
    icon: Clock,
  },
  {
    value: "paid",
    label: "Đã thanh toán",
    color: "status-ready",
    icon: CheckCircle,
  },
  {
    value: "dining",
    label: "Đang ăn",
    color: "status-served",
    icon: CheckCircle,
  },
  {
    value: "waiting_payment",
    label: "Chờ thanh toán",
    color: "status-completed",
    icon: CheckCircle,
  },
  {
    value: "cancelled",
    label: "Đã hủy",
    color: "status-cancelled",
    icon: XCircle,
  },
];

const ITEM_STATUSES = [
  { value: "pending", label: "Chờ", color: "status-pending" },
  { value: "preparing", label: "Đang làm", color: "status-preparing" },
  { value: "ready", label: "Sẵn sàng", color: "status-ready" },
  { value: "completed", label: "Đã lên", color: "status-served" },
  { value: "cancelled", label: "Đã hủy", color: "status-cancelled" },
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
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  // Add item dialog state
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemInstructions, setNewItemInstructions] = useState<string>("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const orderSocket = useOrderWebSocket();

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const response = await api.orders.getById(orderId);
      // Handle ApiResponse type
      const orderData = (response as any).data || response;
      setOrder(orderData as Order);
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

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  // Join order room for real-time updates
  useEffect(() => {
    if (orderSocket.isConnected && orderId) {
      orderSocket.joinOrder(orderId);
      return () => {
        orderSocket.leaveOrder(orderId);
      };
    }
  }, [orderSocket.isConnected, orderId, orderSocket]);

  // Listen to real-time order item events
  useEffect(() => {
    if (!orderSocket.isConnected || !order) return;

    const handleItemCreated = (data: any) => {
      console.log("[Admin OrderDetail] Order item created:", data);
      if (data.orderId === orderId && data.item) {
        // Thêm item mới vào danh sách (không merge với item cũ)
        setOrder((prev) => {
          if (!prev) return null;
          // Kiểm tra xem item đã tồn tại chưa (theo id)
          const itemExists = prev.items?.some(
            (item) => item.id === data.item.id
          );
          if (!itemExists) {
            return {
              ...prev,
              items: [...(prev.items || []), data.item], // Thêm item mới
              total_amount: data.order.total_amount || prev.total_amount,
              final_amount: data.order.final_amount || prev.final_amount,
            };
          }
          // Nếu đã tồn tại, refresh toàn bộ để đảm bảo sync
          loadOrder();
          return prev;
        });
      }
    };

    const handleItemQuantityChanged = (data: any) => {
      console.log("[Admin OrderDetail] Order item quantity changed:", data);
      if (data.orderId === orderId && data.item) {
        setOrder((prev) => {
          if (!prev) return null;
          const existingItem = prev.items?.find(
            (item) => item.id === data.itemId
          );
          if (existingItem) {
            return {
              ...prev,
              items: prev.items?.map((item) =>
                item.id === data.itemId ? { ...item, ...data.item } : item
              ),
              total_amount: data.order.total_amount || prev.total_amount,
              final_amount: data.order.final_amount || prev.final_amount,
            };
          }
          return prev;
        });
      }
    };

    const handleItemDeleted = (data: any) => {
      console.log("[Admin OrderDetail] Order item deleted:", data);
      if (data.orderId === orderId && data.itemId) {
        setOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items?.filter((item) => item.id !== data.itemId),
            total_amount: data.order.total_amount || prev.total_amount,
            final_amount: data.order.final_amount || prev.final_amount,
          };
        });
      }
    };

    const handleItemStatusChanged = (data: any) => {
      console.log("[Admin OrderDetail] Order item status changed:", data);
      if (data.orderId === orderId && data.item) {
        setOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items?.map((item) =>
              item.id === data.itemId ? { ...item, ...data.item } : item
            ),
            total_amount: data.order.total_amount || prev.total_amount,
            final_amount: data.order.final_amount || prev.final_amount,
          };
        });
      }
    };

    // Register listeners
    orderSocket.onOrderItemCreated(handleItemCreated);
    orderSocket.onOrderItemQuantityChanged(handleItemQuantityChanged);
    orderSocket.onOrderItemDeleted(handleItemDeleted);
    orderSocket.onOrderItemStatusChanged(handleItemStatusChanged);

    // Cleanup function
    return () => {
      // Note: Socket listeners are managed by the hook, but we can add cleanup if needed
    };
  }, [orderSocket.isConnected, orderSocket, order, orderId]);

  useEffect(() => {
    if (!showAddItemDialog) return;
    (async () => {
      try {
        const res = await api.dishes.getAll();
        const data = (res as any).data || (res as any);
        setDishes(data);
      } catch (e) {
        console.error("Failed to load dishes", e);
      }
    })();
  }, [showAddItemDialog]);

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
          items: prev.items?.map((item) =>
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
          items: prev.items?.map((item) =>
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
          items: prev.items?.filter((item) => item.id !== itemId),
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

  const removeVoucher = async () => {
    try {
      await api.orders.removeVoucher(orderId);
      await loadOrder();
      toast({
        title: "Thành công",
        description: "Đã xóa voucher khỏi đơn hàng",
      });
    } catch (error) {
      console.error("Failed to remove voucher:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa voucher",
        variant: "destructive",
      });
    }
  };

  const requestSupport = async () => {
    try {
      await api.orders.requestSupport(orderId);
      toast({
        title: "Thành công",
        description: "Yêu cầu hỗ trợ đã được gửi",
      });
    } catch (error) {
      console.error("Failed to request support:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi yêu cầu hỗ trợ",
        variant: "destructive",
      });
    }
  };

  const addItemToOrder = async () => {
    if (!selectedDishId || newItemQuantity < 1) {
      toast({
        title: "Thiếu thông tin",
        description: "Chọn món và số lượng hợp lệ",
      });
      return;
    }
    try {
      setIsAddingItem(true);
      await api.orders.addItem(orderId, {
        dish_id: selectedDishId,
        quantity: newItemQuantity,
        special_instructions: newItemInstructions || undefined,
      });
      setShowAddItemDialog(false);
      setSelectedDishId("");
      setNewItemQuantity(1);
      setNewItemInstructions("");
      await loadOrder();
      toast({ title: "Thành công", description: "Đã thêm món vào đơn hàng" });
    } catch (error) {
      console.error("Failed to add item:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm món",
        variant: "destructive",
      });
    } finally {
      setIsAddingItem(false);
    }
  };

  const requestPayment = async () => {
    if (!order) return;

    try {
      if (paymentMethod === "cash") {
        // Thanh toán tiền mặt - gọi API complete payment
        await api.orders.updateStatus(orderId, "paid");
        toast({
          title: "Thành công",
          description: "Đã xác nhận thanh toán tiền mặt",
        });
        setShowPaymentDialog(false);
        loadOrder();
      } else if (paymentMethod === "vnpay") {
        // Check if there's a failed payment - use retry API
        const hasFailedPayment = order.payment_status === "failed";

        let response: any;
        if (hasFailedPayment) {
          response = await orderService.requestPaymentRetry(orderId, "vnpay");
        } else {
          response = await api.orders.requestPayment(orderId, {
            method: paymentMethod,
            amount: order.final_amount,
            client: "admin", // Admin-web
          });
        }

        // Redirect đến VNPay
        const redirectUrl =
          response?.data?.redirect_url ||
          (response as any)?.data?.redirect_url ||
          (response as any)?.redirect_url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          toast({
            title: "Lỗi",
            description: "Không thể tạo link thanh toán VNPay",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Failed to request payment:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xử lý thanh toán",
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
      <div className="flex items-center justify-between border-b border-amber-200 pb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
              Đơn hàng #{order.id}
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Tạo lúc {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`status-badge ${getStatusColor(
              order.status
            )} text-sm px-4 py-2 shadow-sm`}
          >
            {getStatusLabel(order.status)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrder}
            className="border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-sm"
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
          <Card className="border-amber-100 shadow-lg bg-white">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Clock className="h-5 w-5 text-amber-600" />
                Trạng thái đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Select value={order.status} onValueChange={updateOrderStatus}>
                  <SelectTrigger className="w-52 border-amber-200 focus:ring-amber-500 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-amber-200">
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem
                        key={status.value}
                        value={status.value}
                        className="focus:bg-amber-50"
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge
                  className={`status-badge ${getStatusColor(
                    order.status
                  )} text-sm px-4 py-2 shadow-sm`}
                >
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border-amber-100 shadow-lg bg-white">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                Danh sách món ăn
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-900 font-semibold ml-2"
                >
                  {order.items?.length || 0} món
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 flex justify-end">
                <Button
                  onClick={() => setShowAddItemDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" /> Thêm món
                </Button>
              </div>
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
                  {order.items?.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-sm">
                            <ShoppingCart className="h-5 w-5 text-amber-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {(item as any).dish?.name || "Unknown Dish"}
                            </p>
                            {item.special_instructions && (
                              <p className="text-sm text-amber-600 mt-0.5 flex items-center gap-1">
                                <span>📝</span> {item.special_instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
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
                            className="h-8 w-8 p-0 border-amber-300 hover:bg-amber-50"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center font-bold text-amber-900">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateItemQuantity(item.id, item.quantity + 1)
                            }
                            className="h-8 w-8 p-0 border-amber-300 hover:bg-amber-50"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-emerald-700">
                        {formatCurrency(item.price)}
                      </TableCell>
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
          <Card className="border-amber-100 shadow-lg bg-gradient-to-br from-white to-amber-50/20">
            <CardHeader className="border-b border-amber-100 bg-white">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <User className="h-5 w-5 text-amber-600" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">
                    Khách hàng
                  </Label>
                  <p className="text-base font-semibold text-gray-900">
                    {order.user?.username || "Khách vãng lai"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">
                    Bàn
                  </Label>
                  <p className="text-base font-semibold text-gray-900">
                    {order.table?.table_number || "Chưa chọn bàn"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="border-emerald-100 shadow-lg bg-gradient-to-br from-white to-emerald-50/20">
            <CardHeader className="border-b border-emerald-100 bg-white">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Tổng kết đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
              {order.voucher && (
                <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-700 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Giảm giá ({order.voucher.code}):
                  </span>
                  <span className="font-semibold text-green-700">
                    -{formatCurrency(order.voucher.value)}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-emerald-200 pt-4">
                <div className="flex justify-between p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-md">
                  <span className="text-white font-medium">Tổng cộng:</span>
                  <span className="text-white font-bold text-xl">
                    {formatCurrency(order.final_amount)}
                  </span>
                </div>
              </div>

              {/* View Invoice Button */}
              <div className="pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  className="w-full border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 shadow-sm"
                  onClick={() => setShowInvoiceDialog(true)}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Xem Hóa Đơn
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {order.status !== "paid" && (
            <Card className="border-amber-100 shadow-lg bg-white">
              <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
                <CardTitle className="text-amber-900">Thao tác</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Dialog
                  open={showVoucherDialog}
                  onOpenChange={setShowVoucherDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-sm"
                    >
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

                {order.voucher_id && (
                  <Button
                    variant="outline"
                    onClick={removeVoucher}
                    className="w-full border-red-300 hover:bg-red-50 hover:text-red-900 shadow-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa Voucher
                  </Button>
                )}

                {/* Add Item Dialog */}
                <Dialog
                  open={showAddItemDialog}
                  onOpenChange={setShowAddItemDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-amber-300 hover:bg-amber-50 hover:text-amber-900 shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Thêm món
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Thêm món vào đơn hàng</DialogTitle>
                      <DialogDescription>
                        Chọn món ăn và số lượng, có thể nhập ghi chú cho bếp.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Món ăn</Label>
                        <Select
                          value={selectedDishId}
                          onValueChange={setSelectedDishId}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Chọn món" />
                          </SelectTrigger>
                          <SelectContent>
                            {dishes.map((d: any) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name} - {formatCurrency(d.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Số lượng</Label>
                        <Input
                          type="number"
                          min={1}
                          value={newItemQuantity}
                          onChange={(e) =>
                            setNewItemQuantity(
                              Math.max(1, Number(e.target.value))
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>Ghi chú (tuỳ chọn)</Label>
                        <Input
                          placeholder="Ít cay, thêm sốt..."
                          value={newItemInstructions}
                          onChange={(e) =>
                            setNewItemInstructions(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddItemDialog(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={addItemToOrder}
                        disabled={isAddingItem || !selectedDishId}
                      >
                        {isAddingItem ? "Đang thêm..." : "Thêm món"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={showPaymentDialog}
                  onOpenChange={setShowPaymentDialog}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {order?.payment_status === "failed"
                        ? "Thanh toán lại"
                        : "Yêu cầu thanh toán"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-amber-900">
                        Hóa đơn thanh toán
                      </DialogTitle>
                      <DialogDescription>
                        Đơn hàng #{order.id.slice(0, 8)}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Professional Invoice Form */}
                    {order && (
                      <div className="max-h-[60vh] overflow-y-auto pr-2 mb-6">
                        <InvoiceForm
                          order={order}
                          vatAmount={(order as any).vat_amount}
                          pointsUsed={(order as any).points_used}
                          finalPaymentAmount={
                            (order as any).final_payment_amount
                          }
                        />
                      </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className="border-t pt-4">
                      <Label
                        htmlFor="payment-method"
                        className="text-base font-semibold mb-3 block"
                      >
                        Phương thức thanh toán
                      </Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Tiền mặt
                            </div>
                          </SelectItem>
                          <SelectItem value="vnpay">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              VNPay
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowPaymentDialog(false)}
                        className="flex-1"
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={requestPayment}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                      >
                        {paymentMethod === "cash"
                          ? "Xác nhận thanh toán"
                          : "Thanh toán VNPay"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* View Invoice Dialog */}
                <Dialog
                  open={showInvoiceDialog}
                  onOpenChange={setShowInvoiceDialog}
                >
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Hóa Đơn Thanh Toán</DialogTitle>
                      <DialogDescription>
                        Chi tiết hóa đơn cho đơn hàng #
                        {order?.id.slice(0, 8).toUpperCase()}
                      </DialogDescription>
                    </DialogHeader>
                    {order && (
                      <div className="max-h-[80vh] overflow-y-auto pr-2">
                        <InvoiceForm
                          order={order}
                          vatAmount={(order as any).vat_amount}
                          pointsUsed={(order as any).points_used}
                          finalPaymentAmount={
                            (order as any).final_payment_amount
                          }
                        />
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowInvoiceDialog(false)}
                      >
                        Đóng
                      </Button>
                      <Button
                        onClick={() => {
                          window.print();
                        }}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        In Hóa Đơn
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  onClick={requestSupport}
                  className="w-full border-orange-300 hover:bg-orange-50 hover:text-orange-900 shadow-sm"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Yêu cầu hỗ trợ
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
