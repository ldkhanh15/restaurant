"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DishSelectionDialog from "@/components/shared/DishSelectionDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  Edit,
  X,
  CheckCircle,
  ShoppingCart,
  Receipt,
  QrCode,
  Plus,
  Minus,
  CreditCard,
  Save,
  XCircle,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { getReservationById } from "@/mock/mockReservations";
import { mockDishes } from "@/mock/mockDishes";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Mock reservation with extended data
const getMockReservation = (id: string) => {
  const base = {
    id,
    date: "2024-02-15",
    time: "19:00",
    num_people: 4,
    table_id: "T-6",
    table_name: "Bàn VIP 1",
    floor: "Tầng 1",
    status: "confirmed" as const,
    customer_name: "Nguyễn Văn An",
    customer_phone: "0901234567",
    customer_email: "an.nguyen@email.com",
    special_requests: "Gần cửa sổ, khu vực yên tĩnh",
    event_type: "birthday",
    deposit_paid: 500000,
    total_cost: 2500000,
    created_at: "2024-01-20T10:00:00Z",
    modified_at: "2024-01-21T14:30:00Z",
    checked_in: false,
    pre_orders: [
      {
        id: "PO-1",
        dish_id: "dish-1",
        dish_name: "Cá Hồi Nướng",
        quantity: 2,
        price: 350000,
        status: "pending" as const,
      },
      {
        id: "PO-2",
        dish_id: "dish-3",
        dish_name: "Salad Caesar",
        quantity: 2,
        price: 120000,
        status: "pending" as const,
      },
    ],
  };
  return base;
};

const statusConfig = {
  confirmed: {
    label: "Đã Xác Nhận",
    color: "bg-green-500",
    icon: CheckCircle,
  },
  pending: { label: "Chờ Xác Nhận", color: "bg-yellow-500", icon: Clock },
  cancelled: { label: "Đã Hủy", color: "bg-red-500", icon: X },
  checked_in: {
    label: "Đã Check-in",
    color: "bg-blue-500",
    icon: CheckCircle,
  },
};

export default function ReservationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const reservation = getMockReservation(id);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingDishes, setIsAddingDishes] = useState(false);
  const [editData, setEditData] = useState({
    date: reservation.date,
    time: reservation.time,
    num_people: reservation.num_people,
    special_requests: reservation.special_requests,
  });
  const [preOrders, setPreOrders] = useState(reservation.pre_orders || []);

  const status =
    statusConfig[reservation.status as keyof typeof statusConfig] ||
    statusConfig.pending;
  const StatusIcon = status.icon;

  const handleSaveEdit = () => {
    // Mock save
    toast({
      title: "Đã cập nhật",
      description: "Thông tin đặt bàn đã được cập nhật thành công",
    });
    setIsEditing(false);
  };

  const handleAddDish = (dish: (typeof mockDishes)[0]) => {
    const existing = preOrders.find((po) => po.dish_id === dish.id);
    if (existing) {
      setPreOrders(
        preOrders.map((po) =>
          po.dish_id === dish.id ? { ...po, quantity: po.quantity + 1 } : po
        )
      );
    } else {
      setPreOrders([
        ...preOrders,
        {
          id: `PO-${Date.now()}`,
          dish_id: dish.id,
          dish_name: dish.name,
          quantity: 1,
          price: dish.price,
          status: "pending",
        },
      ]);
    }
    toast({
      title: "Đã thêm món",
      description: `${dish.name} đã được thêm vào danh sách`,
    });
  };

  const handleUpdateQuantity = (orderId: string, delta: number) => {
    setPreOrders(
      preOrders
        .map((po) =>
          po.id === orderId
            ? { ...po, quantity: Math.max(1, po.quantity + delta) }
            : po
        )
        .filter((po) => po.quantity > 0)
    );
  };

  const handleRemoveDish = (orderId: string) => {
    const order = preOrders.find((po) => po.id === orderId);
    if (order && confirm(`Xóa ${order.dish_name} khỏi danh sách?`)) {
      setPreOrders(preOrders.filter((po) => po.id !== orderId));
      toast({
        title: "Đã xóa món",
        description: `${order.dish_name} đã được xóa`,
      });
    }
  };

  const handlePayment = () => {
    const remaining = reservation.total_cost - reservation.deposit_paid;
    router.push(
      `/mock-vnpay?txnRef=TXN-${Date.now()}&amount=${remaining}&reservationId=${id}`
    );
  };

  const totalPreOrderCost = preOrders.reduce(
    (sum, po) => sum + po.price * po.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="font-elegant text-4xl font-bold text-primary mb-2">
                Chi Tiết Đặt Bàn
              </h1>
              <p className="text-muted-foreground text-lg">
                Mã đặt bàn:{" "}
                <span className="font-mono font-semibold">{id}</span>
              </p>
            </div>
            <Badge
              className={cn(`${status.color} text-white px-4 py-2 text-base`)}
            >
              <StatusIcon className="w-4 h-4 mr-2" />
              {status.label}
            </Badge>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reservation Info - Editable */}
            <Card className="border-2 border-accent/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-elegant text-xl">
                    <Calendar className="h-6 w-6 text-accent" />
                    Thông Tin Đặt Bàn
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? "Hủy" : "Chỉnh Sửa"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Ngày</Label>
                        <Input
                          type="date"
                          value={editData.date}
                          onChange={(e) =>
                            setEditData({ ...editData, date: e.target.value })
                          }
                          className="border-accent/20 focus:border-accent"
                        />
                      </div>
                      <div>
                        <Label>Giờ</Label>
                        <Input
                          type="time"
                          value={editData.time}
                          onChange={(e) =>
                            setEditData({ ...editData, time: e.target.value })
                          }
                          className="border-accent/20 focus:border-accent"
                        />
                      </div>
                      <div>
                        <Label>Số Khách</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editData.num_people}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              num_people: parseInt(e.target.value) || 1,
                            })
                          }
                          className="border-accent/20 focus:border-accent"
                        />
                      </div>
                      <div>
                        <Label>Bàn</Label>
                        <Input
                          value={reservation.table_name}
                          disabled
                          className="border-accent/20"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Yêu Cầu Đặc Biệt</Label>
                      <Textarea
                        value={editData.special_requests}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            special_requests: e.target.value,
                          })
                        }
                        rows={4}
                        className="border-accent/20 focus:border-accent"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveEdit}
                        className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Lưu Thay Đổi
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Ngày & Giờ
                      </p>
                      <p className="font-bold text-lg">
                        {format(
                          new Date(reservation.date),
                          "EEEE, dd MMMM yyyy",
                          { locale: vi }
                        )}
                      </p>
                      <p className="text-primary font-semibold text-xl">
                        {reservation.time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Số Khách
                      </p>
                      <p className="font-bold text-2xl text-primary">
                        {reservation.num_people} người
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Bàn</p>
                      <p className="font-bold text-lg">
                        {reservation.table_name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {reservation.floor}
                      </p>
                    </div>
                    {reservation.event_type && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Loại Sự Kiện
                        </p>
                        <Badge className="bg-accent/10 text-accent border-accent/20">
                          {reservation.event_type}
                        </Badge>
                      </div>
                    )}
                    {reservation.special_requests && (
                      <div className="md:col-span-2">
                        <Separator className="my-4" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Yêu Cầu Đặc Biệt
                        </p>
                        <p className="text-sm">
                          {reservation.special_requests}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pre-Orders with Edit */}
            <Card className="border-2 border-accent/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-elegant text-xl">
                    <ShoppingCart className="h-6 w-6 text-accent" />
                    Món Đặt Trước
                  </CardTitle>
                  <DishSelectionDialog
                    open={isAddingDishes}
                    onOpenChange={setIsAddingDishes}
                    onSelectDish={handleAddDish}
                    selectedDishIds={preOrders.map((po) => po.dish_id)}
                    title="Chọn Món Đặt Trước"
                    description="Chọn món ăn bạn muốn đặt trước cho bữa ăn"
                  />
                  <Button
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                    size="sm"
                    onClick={() => setIsAddingDishes(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Món
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {preOrders.length > 0 ? (
                  <div className="space-y-4">
                    {preOrders.map((order, index) => {
                      const dish = mockDishes.find(
                        (d) => d.id === order.dish_id
                      );
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="border-2 border-accent/10 hover:border-accent/30 transition-all">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Dish Image */}
                                {dish && (
                                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={
                                        dish.media_urls[0] || "/placeholder.svg"
                                      }
                                      alt={dish.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}

                                {/* Dish Info */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-bold text-lg text-primary">
                                        {order.dish_name}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className="mt-1 border-accent/20"
                                      >
                                        {order.status === "pending"
                                          ? "Chờ xác nhận"
                                          : "Đã xác nhận"}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveDish(order.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="flex items-center justify-between mt-4">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleUpdateQuantity(order.id, -1)
                                        }
                                        disabled={order.quantity <= 1}
                                        className="border-accent/20"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="font-bold text-lg w-8 text-center">
                                        {order.quantity}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleUpdateQuantity(order.id, 1)
                                        }
                                        className="border-accent/20"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right">
                                      <p className="text-sm text-muted-foreground">
                                        {order.price.toLocaleString("vi-VN")}đ
                                        /món
                                      </p>
                                      <p className="font-bold text-lg text-primary">
                                        {(
                                          order.price * order.quantity
                                        ).toLocaleString("vi-VN")}
                                        đ
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Chưa có món nào được đặt trước
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 border-accent/20"
                      onClick={() => setIsAddingDishes(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm Món Ngay
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Thông Tin Khách Hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {reservation.customer_name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{reservation.customer_phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{reservation.customer_email}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="sticky top-24 border-2 border-accent/20 shadow-xl">
              <CardHeader>
                <CardTitle className="font-elegant text-xl">Tổng Kết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tổng chi phí:</span>
                    <span className="font-semibold text-lg text-primary">
                      {reservation.total_cost.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {reservation.deposit_paid > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Đã cọc:</span>
                      <span className="text-green-600">
                        -{reservation.deposit_paid.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}
                  {totalPreOrderCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Món đặt trước:
                      </span>
                      <span>+{totalPreOrderCost.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-xl">
                    <span>Còn lại:</span>
                    <span className="text-primary">
                      {(
                        reservation.total_cost -
                        reservation.deposit_paid +
                        totalPreOrderCost
                      ).toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>
                </div>

                {/* Payment Button */}
                {reservation.deposit_paid < reservation.total_cost && (
                  <Button
                    className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-lg"
                    onClick={handlePayment}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Thanh Toán Ngay
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle>Thao Tác</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full border-accent/20 hover:bg-accent/10"
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh Sửa Thông Tin
                </Button>
                {!reservation.checked_in && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      toast({
                        title: "Check-in thành công",
                        description: "Chuyển đến trang đơn hàng",
                      });
                      router.push(`/orders/${id}`);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check-in
                  </Button>
                )}
                <Button
                  className="w-full border-accent/20 hover:bg-accent/10"
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  In Hóa Đơn
                </Button>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Mã QR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-border">
                  <div className="w-40 h-40 bg-muted flex items-center justify-center rounded-lg">
                    <QrCode className="h-20 w-20 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  Quét mã để xem thông tin đặt bàn
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
