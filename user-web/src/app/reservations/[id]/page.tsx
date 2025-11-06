"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Edit,
  X,
  CheckCircle,
  ShoppingCart,
  Receipt,
  Plus,
  Minus,
  CreditCard,
  Save,
  XCircle,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Trash2,
  Gift,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  reservationService,
  type Reservation,
} from "@/services/reservationService";
import { useReservationListStore } from "@/store/reservationListStore";
import { useReservationSocket } from "@/hooks/useReservationSocket";
import type { SelectableDish } from "@/components/shared/DishSelectionDialog";

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Chờ Xác Nhận",
    color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    icon: Clock,
  },
  confirmed: {
    label: "Đã Xác Nhận",
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    icon: CheckCircle,
  },
  completed: {
    label: "Hoàn Thành",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã Hủy",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: X,
  },
  no_show: {
    label: "Không Đến",
    color: "bg-gray-500/20 text-gray-600 border-gray-500/30",
    icon: AlertCircle,
  },
};

export default function ReservationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const reservationSocket = useReservationSocket();

  const {
    selectedReservation,
    isLoadingDetail,
    detailError,
    setSelectedReservation,
    setLoadingDetail,
    setDetailError,
    updateSelectedReservation,
  } = useReservationListStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingDishes, setIsAddingDishes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [editData, setEditData] = useState({
    reservation_time: "",
    num_people: 2,
    preferences: "",
  });

  // Load reservation on mount
  useEffect(() => {
    if (!user?.id) {
      router.push("/login");
      return;
    }

    const loadReservation = async () => {
      try {
        setLoadingDetail(true);
        setDetailError(null);
        const response = await reservationService.getReservationById(id);
        if (response.status === "success" && response.data) {
          const reservation = response.data;
          setSelectedReservation(reservation);
          // Format datetime-local for input
          const resDate = new Date(reservation.reservation_time);
          const formattedDateTime = `${resDate.getFullYear()}-${String(
            resDate.getMonth() + 1
          ).padStart(2, "0")}-${String(resDate.getDate()).padStart(
            2,
            "0"
          )}T${String(resDate.getHours()).padStart(2, "0")}:${String(
            resDate.getMinutes()
          ).padStart(2, "0")}`;
          setEditData({
            reservation_time: formattedDateTime,
            num_people: reservation.num_people,
            preferences:
              typeof reservation.preferences === "string"
                ? reservation.preferences
                : reservation.preferences?.special_requests || "",
          });
        }
      } catch (err: any) {
        console.error("Failed to load reservation:", err);
        setDetailError(err.message || "Không thể tải thông tin đặt bàn");
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin đặt bàn",
          variant: "destructive",
        });
      } finally {
        setLoadingDetail(false);
      }
    };

    loadReservation();
  }, [
    id,
    user?.id,
    router,
    setSelectedReservation,
    setLoadingDetail,
    setDetailError,
    toast,
  ]);

  // Join reservation room for real-time updates
  useEffect(() => {
    if (reservationSocket.isConnected && id) {
      reservationSocket.joinReservation(id);
      return () => {
        reservationSocket.leaveReservation(id);
      };
    }
  }, [reservationSocket.isConnected, id, reservationSocket]);

  // Listen to real-time reservation updates
  useEffect(() => {
    if (!reservationSocket.isConnected || !selectedReservation) return;

    // Listen to reservation updates
    const handleReservationUpdated = (reservation: any) => {
      console.log("[ReservationDetail] Reservation updated:", reservation);
      if (reservation.id === id || reservation.reservationId === id) {
        updateSelectedReservation({
          ...reservation,
          updated_at: reservation.updated_at || reservation.updatedAt,
        });
      }
    };

    // Listen to status changes
    const handleStatusChanged = (reservation: any) => {
      console.log(
        "[ReservationDetail] Reservation status changed:",
        reservation
      );
      if (reservation.id === id || reservation.reservationId === id) {
        updateSelectedReservation({
          status: reservation.status,
          updated_at: reservation.updated_at || reservation.updatedAt,
        });
        toast({
          title: "Trạng thái thay đổi",
          description: `Đặt bàn đã chuyển sang "${
            statusConfig[reservation.status]?.label || reservation.status
          }"`,
        });
      }
    };

    // Listen to reservation dish events
    const handleDishAdded = (data: any) => {
      console.log("[ReservationDetail] Dish added:", data);
      if (data.reservationId === id && data.reservation) {
        updateSelectedReservation({
          pre_order_items: data.reservation.pre_order_items,
          deposit_amount: data.reservation.deposit_amount,
        });
        toast({
          title: "Đã thêm món",
          description: `${
            data.dish.dish?.name || data.dish.dish_id
          } đã được thêm vào đặt trước`,
        });
      }
    };

    const handleDishUpdated = (data: any) => {
      console.log("[ReservationDetail] Dish updated:", data);
      if (data.reservationId === id && data.reservation) {
        updateSelectedReservation({
          pre_order_items: data.reservation.pre_order_items,
          deposit_amount: data.reservation.deposit_amount,
        });
      }
    };

    const handleDishRemoved = (data: any) => {
      console.log("[ReservationDetail] Dish removed:", data);
      if (data.reservationId === id && data.reservation) {
        updateSelectedReservation({
          pre_order_items: data.reservation.pre_order_items,
          deposit_amount: data.reservation.deposit_amount,
        });
        toast({
          title: "Đã xóa món",
          description: "Món đã được xóa khỏi đặt trước",
        });
      }
    };

    // Register all listeners
    reservationSocket.onReservationUpdated(handleReservationUpdated);
    reservationSocket.onReservationStatusChanged(handleStatusChanged);
    reservationSocket.onReservationDishAdded(handleDishAdded);
    reservationSocket.onReservationDishUpdated(handleDishUpdated);
    reservationSocket.onReservationDishRemoved(handleDishRemoved);

    // Cleanup function
    return () => {
      // Note: Socket listeners are managed by the hook
    };
  }, [
    reservationSocket.isConnected,
    reservationSocket,
    selectedReservation,
    id,
    updateSelectedReservation,
    toast,
  ]);

  // Refresh reservation
  const refreshReservation = useCallback(async () => {
    try {
      setLoadingDetail(true);
      const response = await reservationService.getReservationById(id);
      if (response.status === "success" && response.data) {
        setSelectedReservation(response.data);
      }
    } catch (err: any) {
      console.error("Failed to refresh reservation:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải lại thông tin đặt bàn",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [id, setSelectedReservation, setLoadingDetail, toast]);

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedReservation) return;

    try {
      setIsLoading(true);
      await reservationService.updateReservation(id, {
        reservation_time: editData.reservation_time,
        num_people: editData.num_people,
        preferences: {
          ...selectedReservation.preferences,
          special_requests: editData.preferences,
        },
      });
      toast({
        title: "Đã cập nhật",
        description: "Thông tin đặt bàn đã được cập nhật thành công",
      });
      setIsEditing(false);
      await refreshReservation();
    } catch (err: any) {
      console.error("Failed to update reservation:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể cập nhật thông tin đặt bàn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add dish
  const handleAddDish = async (dish: SelectableDish) => {
    if (!selectedReservation) return;

    try {
      setIsLoading(true);
      await reservationService.addDishToReservation(id, dish.id, 1);
      toast({
        title: "Đã thêm món",
        description: `${dish.name} đã được thêm vào đặt trước`,
      });
      setIsAddingDishes(false);
      await refreshReservation();
    } catch (err: any) {
      console.error("Failed to add dish:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể thêm món",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update dish quantity
  const handleUpdateQuantity = async (dishId: string, quantity: number) => {
    if (!selectedReservation) return;

    try {
      setIsLoading(true);
      await reservationService.updateDishQuantity(id, dishId, quantity);
      await refreshReservation();
    } catch (err: any) {
      console.error("Failed to update quantity:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể cập nhật số lượng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove dish
  const handleRemoveDish = async (dishId: string) => {
    if (!selectedReservation) return;

    if (!confirm("Xóa món này khỏi đặt trước?")) return;

    try {
      setIsLoading(true);
      await reservationService.removeDishFromReservation(id, dishId);
      toast({
        title: "Đã xóa món",
        description: "Món đã được xóa khỏi đặt trước",
      });
      await refreshReservation();
    } catch (err: any) {
      console.error("Failed to remove dish:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể xóa món",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel reservation
  const handleCancelReservation = async () => {
    if (!selectedReservation || !cancelReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do hủy",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCancelling(true);
      await reservationService.cancelReservation(id, cancelReason);
      toast({
        title: "Đã hủy đặt bàn",
        description: "Đặt bàn đã được hủy thành công",
      });
      setShowCancelDialog(false);
      setCancelReason("");
      await refreshReservation();
    } catch (err: any) {
      console.error("Failed to cancel reservation:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể hủy đặt bàn",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!selectedReservation) return;

    try {
      setIsCheckingIn(true);
      const response = await reservationService.checkInReservation(id);
      if (response.status === "success" && response.data?.order) {
        toast({
          title: "Check-in thành công",
          description: "Chuyển đến trang đơn hàng",
        });
        router.push(`/orders/${response.data.order.id}`);
      }
    } catch (err: any) {
      console.error("Failed to check-in:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể check-in",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="min-h-screen bg-background py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Đang tải thông tin đặt bàn...</p>
        </div>
      </div>
    );
  }

  if (detailError || !selectedReservation) {
    return (
      <div className="min-h-screen bg-background py-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-500 mb-4">
            {detailError || "Không tìm thấy đặt bàn"}
          </p>
          <Button onClick={() => router.push("/reservations/list")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const status =
    statusConfig[selectedReservation.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const resDate = new Date(selectedReservation.reservation_time);
  const preOrderItems = selectedReservation.pre_order_items || [];
  const totalPreOrderCost = preOrderItems.reduce((sum, item) => {
    const dishPrice = item.dish?.price || 0;
    return sum + dishPrice * item.quantity;
  }, 0);

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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/reservations/list")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="font-elegant text-4xl font-bold text-primary mb-2">
                  Chi Tiết Đặt Bàn
                </h1>
                <p className="text-muted-foreground text-lg">
                  Mã đặt bàn:{" "}
                  <span className="font-mono font-semibold">{id}</span>
                </p>
              </div>
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
                  {selectedReservation.status !== "cancelled" &&
                    selectedReservation.status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? "Hủy" : "Chỉnh Sửa"}
                      </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Thời gian đặt bàn</Label>
                        <Input
                          type="datetime-local"
                          value={editData.reservation_time}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              reservation_time: e.target.value,
                            })
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
                      {selectedReservation.table && (
                        <div>
                          <Label>Bàn</Label>
                          <Input
                            value={`Bàn ${selectedReservation.table.table_number}`}
                            disabled
                            className="border-accent/20"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Yêu Cầu Đặc Biệt</Label>
                      <Textarea
                        value={editData.preferences}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            preferences: e.target.value,
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
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Lưu Thay Đổi
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isLoading}
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
                        {format(resDate, "EEEE, dd MMMM yyyy", {
                          locale: vi,
                        })}
                      </p>
                      <p className="text-primary font-semibold text-xl">
                        {format(resDate, "HH:mm")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Số Khách
                      </p>
                      <p className="font-bold text-2xl text-primary">
                        {selectedReservation.num_people} người
                      </p>
                    </div>
                    {selectedReservation.table && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Bàn
                        </p>
                        <p className="font-bold text-lg">
                          Bàn {selectedReservation.table.table_number}
                        </p>
                        {selectedReservation.table.floor && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {selectedReservation.table.floor}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedReservation.event && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Sự Kiện
                        </p>
                        <Badge className="bg-accent/10 text-accent border-accent/20">
                          {selectedReservation.event.name}
                        </Badge>
                      </div>
                    )}
                    {editData.preferences && (
                      <div className="md:col-span-2">
                        <Separator className="my-4" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Yêu Cầu Đặc Biệt
                        </p>
                        <p className="text-sm">{editData.preferences}</p>
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
                  {selectedReservation.status !== "cancelled" &&
                    selectedReservation.status !== "completed" && (
                      <Button
                        className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                        size="sm"
                        onClick={() => setIsAddingDishes(true)}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm Món
                      </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {preOrderItems.length > 0 ? (
                  <div className="space-y-4">
                    {preOrderItems.map((item, index) => {
                      const dish = item.dish;
                      return (
                        <motion.div
                          key={`${item.dish_id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="border-2 border-accent/10 hover:border-accent/30 transition-all">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Dish Image */}
                                {dish?.media_urls?.[0] && (
                                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={dish.media_urls[0]}
                                      alt={dish.name || "Dish"}
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
                                        {dish?.name || `Dish ${item.dish_id}`}
                                      </h4>
                                      {dish?.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {dish.description}
                                        </p>
                                      )}
                                    </div>
                                    {selectedReservation.status !==
                                      "cancelled" &&
                                      selectedReservation.status !==
                                        "completed" && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveDish(item.dish_id)
                                          }
                                          disabled={isLoading}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                  </div>

                                  <div className="flex items-center justify-between mt-4">
                                    {/* Quantity Controls */}
                                    {selectedReservation.status !==
                                      "cancelled" &&
                                    selectedReservation.status !==
                                      "completed" ? (
                                      <div className="flex items-center gap-3">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleUpdateQuantity(
                                              item.dish_id,
                                              item.quantity - 1
                                            )
                                          }
                                          disabled={
                                            isLoading || item.quantity <= 1
                                          }
                                          className="border-accent/20"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="font-bold text-lg w-8 text-center">
                                          {item.quantity}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleUpdateQuantity(
                                              item.dish_id,
                                              item.quantity + 1
                                            )
                                          }
                                          disabled={isLoading}
                                          className="border-accent/20"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-muted-foreground">
                                        Số lượng: {item.quantity}
                                      </div>
                                    )}

                                    {/* Price */}
                                    <div className="text-right">
                                      {dish?.price && (
                                        <>
                                          <p className="text-sm text-muted-foreground">
                                            {dish.price.toLocaleString("vi-VN")}
                                            đ /món
                                          </p>
                                          <p className="font-bold text-lg text-primary">
                                            {(
                                              dish.price * item.quantity
                                            ).toLocaleString("vi-VN")}
                                            đ
                                          </p>
                                        </>
                                      )}
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
                    {selectedReservation.status !== "cancelled" &&
                      selectedReservation.status !== "completed" && (
                        <Button
                          variant="outline"
                          className="mt-4 border-accent/20"
                          onClick={() => setIsAddingDishes(true)}
                          disabled={isLoading}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm Món Ngay
                        </Button>
                      )}
                  </div>
                )}
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
                  {selectedReservation.event_fee && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Phí sự kiện:
                      </span>
                      <span className="font-semibold">
                        {selectedReservation.event_fee.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}
                  {totalPreOrderCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Món đặt trước:
                      </span>
                      <span>{totalPreOrderCost.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  {selectedReservation.deposit_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cọc:</span>
                      <span className="text-green-600">
                        {(
                          selectedReservation.deposit_amount || 0
                        ).toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-xl">
                    <span>Tổng:</span>
                    <span className="text-primary">
                      {(
                        (selectedReservation.event_fee || 0) +
                        totalPreOrderCost +
                        (selectedReservation.deposit_amount || 0)
                      ).toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Info */}
            {selectedReservation.event && (
              <Card className="border-2 border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-accent" /> Thông Tin Sự Kiện
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tên sự kiện:</span>
                    <span className="font-medium">
                      {selectedReservation.event.name}
                    </span>
                  </div>
                  {selectedReservation.event.description && (
                    <div>
                      <span className="text-muted-foreground">Mô tả:</span>
                      <p className="mt-1">
                        {selectedReservation.event.description}
                      </p>
                    </div>
                  )}
                  {typeof selectedReservation.event_fee === "number" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Phí sự kiện:
                      </span>
                      <span className="font-medium">
                        {selectedReservation.event_fee.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            {Array.isArray(selectedReservation.payments) &&
              selectedReservation.payments.length > 0 && (
                <Card className="border-2 border-accent/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-accent" /> Thanh Toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedReservation.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <div className="font-medium">
                              {(p.amount || 0).toLocaleString("vi-VN")}đ
                            </div>
                            <div className="text-muted-foreground">
                              {p.method || "vnpay"} • {p.status || "pending"}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.created_at
                            ? new Date(p.created_at).toLocaleString("vi-VN")
                            : ""}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

            {/* Actions */}
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle>Thao Tác</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedReservation.status !== "cancelled" &&
                  selectedReservation.status !== "completed" && (
                    <>
                      <Button
                        className="w-full border-accent/20 hover:bg-accent/10"
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh Sửa Thông Tin
                      </Button>
                      {selectedReservation.status === "confirmed" && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleCheckIn}
                          disabled={isLoading || isCheckingIn}
                        >
                          {isCheckingIn ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Check-in
                        </Button>
                      )}
                      <Button
                        className="w-full border-red-500/20 hover:bg-red-50 text-red-600"
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Hủy Đặt Bàn
                      </Button>
                    </>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dish Selection Dialog */}
      <DishSelectionDialog
        open={isAddingDishes}
        onOpenChange={setIsAddingDishes}
        onSelectDish={handleAddDish}
        selectedDishIds={preOrderItems.map((item) => item.dish_id)}
        title="Chọn Món Đặt Trước"
        description="Chọn món ăn bạn muốn đặt trước cho bữa ăn"
      />

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy Đặt Bàn</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do hủy đặt bàn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Lý do hủy..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="border-accent/20 focus:border-accent"
            />
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancelReservation}
                disabled={isCancelling || !cancelReason.trim()}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Xác Nhận Hủy
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason("");
                }}
                disabled={isCancelling}
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
