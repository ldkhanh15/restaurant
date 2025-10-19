"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  CreditCard,
  Users,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Utensils,
  Receipt,
  Merge,
  Split,
  Trash2,
  MoreHorizontal,
  Plus,
  Minus,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useOrderWebSocket } from "@/hooks/useWebSocket";
import { orderService } from "@/services/orderService";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/utils";

interface OrderItem {
  id: string;
  dish_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  special_instructions?: string;
  dish: {
    id: string;
    name: string;
    description: string;
    price: number;
    media_urls?: any;
    category_id: string;
    active: boolean;
    is_best_seller: boolean;
    seasonal: boolean;
  };
}

interface Order {
  id: string;
  order_number?: string;
  user_id: string;
  reservation_id?: string;
  table_id?: string;
  table_group_id?: string;
  event_id?: string;
  voucher_id?: string;
  status: string;
  total_amount: number;
  voucher_discount_amount?: number;
  final_amount: number;
  event_fee?: number;
  deposit_amount?: number;
  customizations?: any;
  notes?: string;
  payment_status: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Related data
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  table?: {
    id: string;
    name: string;
    table_number: string;
    capacity: number;
    location: string;
  };
  reservation?: {
    id: string;
    reservation_time: string;
    num_people: number;
    status: string;
    preferences?: any;
  };
  event?: {
    id: string;
    name: string;
    description: string;
    event_date: string;
    event_time: string;
    max_guests: number;
    price_per_person: number;
  };
  voucher?: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    description: string;
  };
  items: OrderItem[];
}

interface OrderDetailPageProps {
  orderId: string;
}

const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Chờ xử lý",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "confirmed",
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "preparing",
    label: "Đang chuẩn bị",
    color: "bg-orange-100 text-orange-800",
  },
  { value: "ready", label: "Sẵn sàng", color: "bg-green-100 text-green-800" },
  {
    value: "served",
    label: "Đã phục vụ",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "completed",
    label: "Hoàn thành",
    color: "bg-gray-100 text-gray-800",
  },
  { value: "cancelled", label: "Đã hủy", color: "bg-red-100 text-red-800" },
];

const ORDER_ITEM_STATUSES = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "preparing", label: "Đang chuẩn bị" },
  { value: "ready", label: "Sẵn sàng" },
  { value: "served", label: "Đã phục vụ" },
  { value: "cancelled", label: "Đã hủy" },
];

const PAYMENT_STATUSES = [
  {
    value: "pending",
    label: "Chưa thanh toán",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "paid",
    label: "Đã thanh toán",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "failed",
    label: "Thanh toán lỗi",
    color: "bg-red-100 text-red-800",
  },
  {
    value: "refunded",
    label: "Đã hoàn tiền",
    color: "bg-gray-100 text-gray-800",
  },
];

function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTableChangeModalOpen, setIsTableChangeModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [availableDishes, setAvailableDishes] = useState<any[]>([]);
  const [newTableId, setNewTableId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemDishId, setNewItemDishId] = useState("");
  const [newItemInstructions, setNewItemInstructions] = useState("");

  const { toast } = useToast();

  // WebSocket integration
  const {
    isConnected: isWebSocketConnected,
    joinOrder,
    onOrderUpdated,
    onOrderStatusChanged,
    onOrderItemStatusChanged,
    onPaymentCompleted,
  } = useOrderWebSocket();

  // Load order details
  const loadOrderDetails = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.getOrderDetailsForChat(orderId);
      if (response.data?.data) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load order details:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải chi tiết đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load available tables
  const loadAvailableTables = async () => {
    try {
      const response = await orderService.getAvailableTables();
      if (response.data?.data) {
        setAvailableTables(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load available tables:", error);
    }
  };

  // Load available dishes
  const loadAvailableDishes = async () => {
    try {
      // This would be a new API endpoint
      const response = await orderService.getAllDishes();
      if (response.data?.data) {
        setAvailableDishes(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load available dishes:", error);
    }
  };

  // WebSocket event handlers
  useEffect(() => {
    if (!isWebSocketConnected || !order) return;

    const handleOrderUpdated = (updatedOrder: Order) => {
      if (updatedOrder.id === order.id) {
        setOrder(updatedOrder);
        toast({
          title: "Cập nhật đơn hàng",
          description: "Đơn hàng đã được cập nhật",
        });
      }
    };

    const handleOrderStatusChanged = (updatedOrder: Order) => {
      if (updatedOrder.id === order.id) {
        setOrder((prev) =>
          prev ? { ...prev, status: updatedOrder.status } : null
        );
        toast({
          title: "Trạng thái đơn hàng thay đổi",
          description: `Đơn hàng đã chuyển sang ${updatedOrder.status}`,
        });
      }
    };

    const handleItemStatusChanged = (data: {
      orderId: string;
      itemId: string;
      status: string;
    }) => {
      if (data.orderId === order.id) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((item) =>
                  item.id === data.itemId
                    ? { ...item, status: data.status }
                    : item
                ),
              }
            : null
        );
      }
    };

    const handlePaymentCompleted = (updatedOrder: Order) => {
      if (updatedOrder.id === order.id) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                payment_status: "paid",
                status: "paid",
              }
            : null
        );
        toast({
          title: "Thanh toán thành công",
          description: "Đơn hàng đã được thanh toán",
        });
      }
    };

    onOrderUpdated(handleOrderUpdated);
    onOrderStatusChanged(handleOrderStatusChanged);
    onOrderItemStatusChanged(handleItemStatusChanged);
    onPaymentCompleted(handlePaymentCompleted);

    return () => {
      // Cleanup listeners
    };
  }, [
    isWebSocketConnected,
    order,
    toast,
    onOrderUpdated,
    onOrderStatusChanged,
    onOrderItemStatusChanged,
    onPaymentCompleted,
  ]);

  // Load data on mount
  useEffect(() => {
    loadOrderDetails();
    loadAvailableTables();
    loadAvailableDishes();
  }, [orderId]);

  // Action handlers
  const handleUpdateOrderStatus = async (status: string) => {
    if (!order) return;

    try {
      await orderService.patchStatus(order.id, status);
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái đơn hàng thành công",
      });
      loadOrderDetails();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    if (!order) return;

    try {
      await orderService.updateOrderItemStatus(order.id, itemId, status);
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái món ăn thành công",
      });
      loadOrderDetails();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái món ăn",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItemQuantity = async (itemId: string, quantity: number) => {
    if (!order) return;

    try {
      await orderService.updateOrderItem(order.id, itemId, { quantity });
      toast({
        title: "Thành công",
        description: "Cập nhật số lượng món ăn thành công",
      });
      loadOrderDetails();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật số lượng món ăn",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!order) return;

    try {
      await orderService.removeOrderItem(order.id, itemId);
      toast({
        title: "Thành công",
        description: "Xóa món ăn thành công",
      });
      loadOrderDetails();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa món ăn",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async () => {
    if (!order || !newItemDishId) return;

    try {
      await orderService.addItemToOrder(order.id, {
        dish_id: newItemDishId,
        quantity: newItemQuantity,
        special_instructions: newItemInstructions,
      });
      toast({
        title: "Thành công",
        description: "Thêm món ăn thành công",
      });
      setIsAddItemModalOpen(false);
      setNewItemDishId("");
      setNewItemQuantity(1);
      setNewItemInstructions("");
      loadOrderDetails();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm món ăn",
        variant: "destructive",
      });
    }
  };

  const handleChangeTable = async () => {
    if (!order || !newTableId) return;

    try {
      await orderService.changeTable(order.id, newTableId);
      toast({
        title: "Thành công",
        description: "Đổi bàn thành công",
      });
      setIsTableChangeModalOpen(false);
      loadOrderDetails();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể đổi bàn",
        variant: "destructive",
      });
    }
  };

  const handleProcessPayment = async () => {
    if (!order) return;

    try {
      await orderService.requestPayment(order.id, {
        method: paymentMethod,
        amount: paymentAmount || order.final_amount,
      });
      toast({
        title: "Thành công",
        description: "Xử lý thanh toán thành công",
      });
      setIsPaymentModalOpen(false);
      loadOrderDetails();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xử lý thanh toán",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
    return statusConfig?.color || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find((s) => s.value === status);
    return statusConfig?.color || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Không tìm thấy đơn hàng
          </h2>
          <p className="text-gray-600 mb-4">
            Đơn hàng không tồn tại hoặc đã bị xóa
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Đơn hàng #{order.order_number || order.id.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(order.status)}>
                {ORDER_STATUSES.find((s) => s.value === order.status)?.label}
              </Badge>
              <Badge className={getPaymentStatusColor(order.payment_status)}>
                {
                  PAYMENT_STATUSES.find((s) => s.value === order.payment_status)
                    ?.label
                }
              </Badge>
              <Badge variant={isWebSocketConnected ? "default" : "destructive"}>
                {isWebSocketConnected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Kết nối
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Mất kết nối
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadOrderDetails}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="items">Món ăn</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
          <TabsTrigger value="actions">Thao tác</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Khách hàng:</span>
                    <div>{order.user?.name || "Khách vãng lai"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <div>{order.user?.email || "Chưa có"}</div>
                  </div>
                  <div>
                    <span className="font-medium">SĐT:</span>
                    <div>{order.user?.phone || "Chưa có"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Bàn:</span>
                    <div>{order.table?.table_number || "Chưa chọn bàn"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Thời gian tạo:</span>
                    <div>{formatDateTime(order.created_at)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Cập nhật:</span>
                    <div>{formatDateTime(order.updated_at)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Tổng kết đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Tổng tiền món ăn:</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
                {order.voucher_discount_amount && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá voucher:</span>
                    <span>
                      -{formatCurrency(order.voucher_discount_amount)}
                    </span>
                  </div>
                )}
                {order.event_fee && (
                  <div className="flex justify-between">
                    <span>Phí sự kiện:</span>
                    <span>{formatCurrency(order.event_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Thành tiền:</span>
                  <span>{formatCurrency(order.final_amount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Món ăn ({order.items?.length || 0})</CardTitle>
                <Button onClick={() => setIsAddItemModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm món
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Món ăn</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Thành tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={item.dish.media_urls?.[0]} />
                            <AvatarFallback>
                              <ChefHat className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{item.dish.name}</div>
                            <div className="text-sm text-gray-600">
                              Category: {item.dish.category_id}
                            </div>
                            {item.special_instructions && (
                              <div className="text-sm text-blue-600">
                                Ghi chú: {item.special_instructions}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateItemQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateItemQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>{formatCurrency(item.total_price)}</TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(status) =>
                            handleUpdateItemStatus(item.id, status)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_ITEM_STATUSES.map((status) => (
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingItem(item);
                                setIsEditing(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Xóa món
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Xác nhận xóa món
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa món "
                                    {item.dish.name}" khỏi đơn hàng? Hành động
                                    này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Trạng thái thanh toán:</span>
                  <div>
                    <Badge
                      className={getPaymentStatusColor(order.payment_status)}
                    >
                      {
                        PAYMENT_STATUSES.find(
                          (s) => s.value === order.payment_status
                        )?.label
                      }
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Phương thức thanh toán:</span>
                  <div>{order.payment_method || "Chưa chọn"}</div>
                </div>
                <div>
                  <span className="font-medium">Số tiền cần thanh toán:</span>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(order.final_amount)}
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => setIsPaymentModalOpen(true)}
                  disabled={order.payment_status === "paid"}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {order.payment_status === "paid"
                    ? "Đã thanh toán"
                    : "Xử lý thanh toán"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thay đổi trạng thái đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={order.status}
                  onValueChange={handleUpdateOrderStatus}
                >
                  <SelectTrigger>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Đổi bàn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium">Bàn hiện tại:</span>
                    <div className="text-lg font-semibold">
                      {order.table?.table_number || "Chưa chọn bàn"}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      loadAvailableTables();
                      setIsTableChangeModalOpen(true);
                    }}
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Đổi bàn
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thanh toán đơn hàng</DialogTitle>
            <DialogDescription>
              Xử lý thanh toán cho đơn hàng #{order.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Số tiền cần thanh toán
              </label>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(order.final_amount)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                Phương thức thanh toán
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="card">Thẻ tín dụng</SelectItem>
                  <SelectItem value="vnpay">VNPay</SelectItem>
                  <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Số tiền thanh toán</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                placeholder="Nhập số tiền thanh toán"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleProcessPayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              Xử lý thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Change Modal */}
      <Dialog
        open={isTableChangeModalOpen}
        onOpenChange={setIsTableChangeModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi bàn</DialogTitle>
            <DialogDescription>
              Chọn bàn mới cho đơn hàng #{order.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Bàn hiện tại</label>
              <div className="text-lg font-semibold">
                {order.table?.table_number || "Chưa chọn bàn"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Chọn bàn mới</label>
              <Select value={newTableId} onValueChange={setNewTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bàn mới" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.table_number} ({table.capacity} chỗ) -{" "}
                      {table.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTableChangeModalOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleChangeTable} disabled={!newTableId}>
              <Users className="h-4 w-4 mr-2" />
              Đổi bàn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm món ăn</DialogTitle>
            <DialogDescription>
              Thêm món ăn mới vào đơn hàng #{order.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chọn món ăn</label>
              <Select value={newItemDishId} onValueChange={setNewItemDishId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn món ăn" />
                </SelectTrigger>
                <SelectContent>
                  {availableDishes.map((dish) => (
                    <SelectItem key={dish.id} value={dish.id}>
                      {dish.name} - {formatCurrency(dish.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Số lượng</label>
              <Input
                type="number"
                min="1"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ghi chú đặc biệt</label>
              <Input
                value={newItemInstructions}
                onChange={(e) => setNewItemInstructions(e.target.value)}
                placeholder="Nhập ghi chú đặc biệt (tùy chọn)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddItemModalOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleAddItem} disabled={!newItemDishId}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm món
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OrderDetailPage;
export { OrderDetailPage };
