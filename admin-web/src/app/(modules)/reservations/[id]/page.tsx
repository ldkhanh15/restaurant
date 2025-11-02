"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  User,
  Phone,
  MapPin,
  Users,
  CalendarDays,
  RefreshCw,
  Edit,
  Save,
  X,
  AlertCircle,
  CreditCard,
  Plus,
  Minus,
} from "lucide-react";
import { api, Reservation, ReservationDetailResponse } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_STATUSES = [
  {
    value: "pending",
    label: "Chờ thanh toán",
    color: "status-pending",
    icon: Clock,
  },
  {
    value: "completed",
    label: "Đã thanh toán",
    color: "status-completed",
    icon: CheckCircle,
  },
  {
    value: "failure",
    label: "Thanh toán thất bại",
    color: "status-cancelled",
    icon: XCircle,
  },
];

const RESERVATION_STATUSES = [
  {
    value: "pending",
    label: "Chờ xác nhận",
    color: "status-pending",
    icon: Clock,
  },
  {
    value: "confirmed",
    label: "Đã xác nhận",
    color: "status-confirmed",
    icon: CheckCircle,
  },
  {
    value: "completed",
    label: "Hoàn thành",
    color: "status-completed",
    icon: CheckCircle,
  },
  {
    value: "cancelled",
    label: "Đã hủy",
    color: "status-cancelled",
    icon: XCircle,
  },
  {
    value: "no_show",
    label: "Không đến",
    color: "status-cancelled",
    icon: XCircle,
  },
];

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reservationId = params.id as string;

  const [reservation, setReservation] =
    useState<ReservationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<
    Partial<ReservationDetailResponse>
  >({});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
    }
  }, [reservationId]);

  useEffect(() => {
    if (isEditing) {
      loadTablesAndEvents();
    }
  }, [isEditing]);

  const loadTablesAndEvents = async () => {
    try {
      const [tablesRes, eventsRes, dishesRes] = await Promise.all([
        api.tables.getAll(),
        api.events.getAll(),
        api.dishes.getAll(),
      ]);
      setTables((tablesRes as any).data || (tablesRes as any));
      setEvents((eventsRes as any).data || (eventsRes as any));
      setDishes((dishesRes as any).data || (dishesRes as any));
    } catch (error) {
      console.error("Failed to load tables/events/dishes:", error);
    }
  };

  const loadReservation = async () => {
    try {
      setIsLoading(true);
      const response = await api.reservations.getById(reservationId);
      const reservationData = (response as any).data || response;
      setReservation(reservationData);

      // Format reservation_time for datetime-local input (YYYY-MM-DDTHH:mm)
      const reservationTime = new Date(reservationData.reservation_time);
      const formattedTime = format(reservationTime, "yyyy-MM-dd'T'HH:mm");

      setEditedData({
        ...reservationData,
        reservation_time: formattedTime,
        pre_order_items: reservationData.pre_order_items || [],
      });
    } catch (error) {
      console.error("Failed to load reservation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin đặt bàn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateReservationStatus = async (status: string) => {
    try {
      await api.reservations.updateStatus(reservationId, status);
      setReservation((prev) =>
        prev ? { ...prev, status: status as any } : null
      );
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái đặt bàn thành công",
      });
    } catch (error) {
      console.error("Failed to update reservation status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đặt bàn",
        variant: "destructive",
      });
    }
  };

  const checkInReservation = async () => {
    try {
      await api.reservations.checkIn(reservationId);
      setReservation((prev) =>
        prev ? { ...prev, status: "checked_in" as any } : null
      );
      toast({
        title: "Thành công",
        description: "Check-in đặt bàn thành công",
      });
    } catch (error) {
      console.error("Failed to check in reservation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể check-in đặt bàn",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!reservation) return;

    try {
      setIsUpdating(true);

      // Format data for API
      const updateData: any = {};

      if (editedData.table_id && editedData.table_id !== reservation.table_id) {
        updateData.table_id = editedData.table_id;
      }

      if (editedData.reservation_time) {
        // Convert datetime-local string to ISO string
        const dateTimeString = editedData.reservation_time as string;
        if (dateTimeString.includes("T")) {
          // Already in datetime-local format (YYYY-MM-DDTHH:mm)
          updateData.reservation_time = new Date(dateTimeString).toISOString();
        } else {
          updateData.reservation_time = new Date(dateTimeString).toISOString();
        }
      }

      if (
        editedData.duration_minutes !== undefined &&
        editedData.duration_minutes !== reservation.duration_minutes
      ) {
        updateData.duration_minutes = editedData.duration_minutes;
      }

      if (
        editedData.num_people !== undefined &&
        editedData.num_people !== reservation.num_people
      ) {
        updateData.num_people = editedData.num_people;
      }

      if (
        editedData.event_id !== undefined &&
        editedData.event_id !== reservation.event_id
      ) {
        updateData.event_id = editedData.event_id || null;
      }

      if (editedData.preferences !== undefined) {
        // Only include preferences if it's a valid object, not null
        // Backend validator expects object or undefined, not null
        if (
          editedData.preferences &&
          typeof editedData.preferences === "object" &&
          editedData.preferences !== null
        ) {
          updateData.preferences = editedData.preferences;
        }
        // If null or invalid, don't include it - backend will keep existing value
      }

      if (editedData.pre_order_items !== undefined) {
        // Strip dish objects from pre_order_items before sending to API
        // Backend only expects dish_id and quantity
        updateData.pre_order_items = editedData.pre_order_items.map(
          (item: any) => ({
            dish_id: item.dish_id,
            quantity: item.quantity,
          })
        );
      }

      const response = await api.reservations.update(reservationId, updateData);

      // Reload reservation to get updated data
      await loadReservation();
      setIsEditing(false);

      toast({
        title: "Thành công",
        description: "Cập nhật thông tin đặt bàn thành công",
      });
    } catch (error) {
      console.error("Failed to update reservation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin đặt bàn",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (reservation) {
      // Format reservation_time for datetime-local input
      const reservationTime = new Date(reservation.reservation_time);
      const formattedTime = format(reservationTime, "yyyy-MM-dd'T'HH:mm");
      setEditedData({
        ...reservation,
        reservation_time: formattedTime,
        pre_order_items: reservation.pre_order_items || [],
      });
    }
    setIsEditing(false);
  };

  const addPreOrderItem = (dishId: string, quantity: number = 1) => {
    const currentItems =
      editedData.pre_order_items || reservation?.pre_order_items || [];
    const existingIndex = currentItems.findIndex(
      (item: any) => item.dish_id === dishId
    );
    let updated: any[];
    if (existingIndex >= 0) {
      updated = [...currentItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: (updated[existingIndex].quantity || 0) + quantity,
      };
    } else {
      updated = [...currentItems, { dish_id: dishId, quantity }];
    }
    setEditedData((prev) => ({ ...prev, pre_order_items: updated }));
  };

  const removePreOrderItem = (dishId: string) => {
    const currentItems =
      editedData.pre_order_items || reservation?.pre_order_items || [];
    setEditedData((prev) => ({
      ...prev,
      pre_order_items: currentItems.filter(
        (item: any) => item.dish_id !== dishId
      ),
    }));
  };

  const updatePreOrderQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removePreOrderItem(dishId);
      return;
    }
    const currentItems =
      editedData.pre_order_items || reservation?.pre_order_items || [];
    setEditedData((prev) => ({
      ...prev,
      pre_order_items: currentItems.map((item: any) =>
        item.dish_id === dishId ? { ...item, quantity } : item
      ),
    }));
  };

  const handleCancelReservation = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập lý do hủy đặt bàn",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCancelling(true);
      await api.reservations.cancel(reservationId, cancelReason.trim());
      toast({
        title: "Thành công",
        description: "Hủy đặt bàn thành công",
      });
      setShowCancelDialog(false);
      setCancelReason("");
      await loadReservation();
    } catch (error: any) {
      console.error("Failed to cancel reservation:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể hủy đặt bàn",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusLabel = (status: string, list = RESERVATION_STATUSES) => {
    return (
      RESERVATION_STATUSES.find((s) => s.value === status)?.label || status
    );
  };

  const getStatusColor = (status: string, list = RESERVATION_STATUSES) => {
    return (
      RESERVATION_STATUSES.find((s) => s.value === status)?.color ||
      "status-pending"
    );
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = RESERVATION_STATUSES.find((s) => s.value === status);
    return statusConfig?.icon || Clock;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm");
  };

  const isUpcoming = (dateString: string) => {
    const now = new Date();
    const reservationDateTime = new Date(dateString);
    return reservationDateTime > now;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Đang tải thông tin đặt bàn...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-8">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy đặt bàn</h2>
        <p className="text-muted-foreground mb-4">
          Đặt bàn này có thể đã bị xóa hoặc không tồn tại.
        </p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(reservation.status);
  const isUpcomingReservation = isUpcoming(reservation.reservation_time);

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
              Đặt bàn #{reservation.id}
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-500" />
              Tạo lúc {formatDateTime(reservation.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`status-badge ${getStatusColor(
              reservation.status
            )} text-sm px-4 py-2 shadow-sm flex items-center gap-2`}
          >
            <StatusIcon className="h-4 w-4" />
            {getStatusLabel(reservation.status)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReservation}
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
          {/* Reservation Status */}
          <Card className="border-amber-100 shadow-lg bg-white">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Clock className="h-5 w-5 text-amber-600" />
                Trạng thái đặt bàn
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <Select
                  value={reservation.status}
                  onValueChange={updateReservationStatus}
                >
                  <SelectTrigger className="w-52 border-amber-200 focus:ring-amber-500 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-amber-200">
                    {RESERVATION_STATUSES.map((status) => (
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
                    reservation.status
                  )} text-sm px-4 py-2 shadow-sm flex items-center gap-2`}
                >
                  <StatusIcon className="h-4 w-4" />
                  {getStatusLabel(reservation.status)}
                </Badge>
                {reservation.status === "confirmed" &&
                  isUpcomingReservation && (
                    <Button
                      onClick={checkInReservation}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Check-in
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Reservation Details */}
          <Card className="border-amber-100 shadow-lg bg-white">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-amber-900">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Chi tiết đặt bàn
                </span>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="luxury-focus"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="luxury-button"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isUpdating ? "Đang lưu..." : "Lưu"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reservation-datetime">
                    Thời gian đặt bàn
                  </Label>
                  {isEditing ? (
                    <Input
                      id="reservation-datetime"
                      type="datetime-local"
                      value={editedData.reservation_time || ""}
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          reservation_time: e.target.value,
                        }))
                      }
                      className="luxury-focus mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDateTime(reservation.reservation_time)}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="duration">Thời lượng (phút)</Label>
                  {isEditing ? (
                    <Input
                      id="duration"
                      type="number"
                      min={30}
                      step={30}
                      value={
                        editedData.duration_minutes ||
                        reservation.duration_minutes
                      }
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          duration_minutes: parseInt(e.target.value),
                        }))
                      }
                      className="luxury-focus mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.duration_minutes} phút (
                      {Math.floor(reservation.duration_minutes / 60)}h{" "}
                      {reservation.duration_minutes % 60}m)
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="party-size">Số người</Label>
                  {isEditing ? (
                    <Input
                      id="party-size"
                      type="number"
                      min={1}
                      value={editedData.num_people || reservation.num_people}
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          num_people: parseInt(e.target.value),
                        }))
                      }
                      className="luxury-focus mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.num_people} người
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="table">Bàn</Label>
                  {isEditing ? (
                    <Select
                      value={editedData.table_id || reservation.table_id}
                      onValueChange={(value) =>
                        setEditedData((prev) => ({
                          ...prev,
                          table_id: value,
                        }))
                      }
                    >
                      <SelectTrigger className="luxury-focus mt-1">
                        <SelectValue placeholder="Chọn bàn" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table: any) => (
                          <SelectItem key={table.id} value={table.id}>
                            Bàn {table.table_number} - {table.capacity} người
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.table.table_number} (Sức chứa:{" "}
                      {reservation.table.capacity} người)
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="event">Sự kiện (tuỳ chọn)</Label>
                  {isEditing ? (
                    <Select
                      value={
                        editedData.event_id ||
                        reservation.event_id ||
                        "__none__"
                      }
                      onValueChange={(value) =>
                        setEditedData((prev) => ({
                          ...prev,
                          event_id: value === "__none__" ? null : value,
                        }))
                      }
                    >
                      <SelectTrigger className="luxury-focus mt-1">
                        <SelectValue placeholder="Không chọn sự kiện" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          Không chọn sự kiện
                        </SelectItem>
                        {events.map((event: any) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.event
                        ? reservation.event.name
                        : "Không có sự kiện"}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Ghi chú / Yêu cầu đặc biệt</Label>
                {isEditing ? (
                  <Textarea
                    id="notes"
                    value={(editedData.preferences as any)?.note || ""}
                    onChange={(e) =>
                      setEditedData((prev) => ({
                        ...prev,
                        preferences: {
                          ...((prev.preferences as any) || {}),
                          note: e.target.value,
                        },
                      }))
                    }
                    placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
                    className="luxury-focus mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {(reservation.preferences as any)?.note ||
                      "Không có ghi chú"}
                  </p>
                )}
              </div>

              {/* Pre-order Items */}
              <div>
                <Label>Đặt món trước (tuỳ chọn)</Label>
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    {(
                      editedData.pre_order_items ||
                      reservation.pre_order_items ||
                      []
                    ).length > 0 && (
                      <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-gray-50">
                        {(
                          editedData.pre_order_items ||
                          reservation.pre_order_items ||
                          []
                        ).map((item: any) => {
                          // Use dish from item if available (from API), otherwise find from dishes list
                          const dish =
                            item.dish ||
                            dishes.find((d: any) => d.id === item.dish_id);
                          return (
                            <div
                              key={item.dish_id}
                              className="flex items-center justify-between p-2 bg-white rounded"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {dish?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {dish?.price &&
                                    `Giá: ${formatCurrency(dish.price)}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updatePreOrderQuantity(
                                      item.dish_id,
                                      (item.quantity || 0) - 1
                                    )
                                  }
                                  className="h-7 w-7 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {item.quantity || 0}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updatePreOrderQuantity(
                                      item.dish_id,
                                      (item.quantity || 0) + 1
                                    )
                                  }
                                  className="h-7 w-7 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    removePreOrderItem(item.dish_id)
                                  }
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Select
                      onValueChange={(dishId) => {
                        addPreOrderItem(dishId, 1);
                      }}
                    >
                      <SelectTrigger className="luxury-focus">
                        <SelectValue placeholder="Chọn món để đặt trước" />
                      </SelectTrigger>
                      <SelectContent>
                        {dishes
                          .filter(
                            (d: any) =>
                              !(
                                editedData.pre_order_items ||
                                reservation.pre_order_items ||
                                []
                              ).some((item: any) => item.dish_id === d.id)
                          )
                          .map((dish: any) => (
                            <SelectItem key={dish.id} value={dish.id}>
                              {dish.name} - {formatCurrency(dish.price || 0)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {(reservation.pre_order_items || []).length > 0 ? (
                      <div className="border rounded-lg p-3 space-y-2">
                        {(reservation.pre_order_items || []).map(
                          (item: any) => {
                            // Use dish from item if available (from API), otherwise find from dishes list
                            const dish =
                              item.dish ||
                              dishes.find((d: any) => d.id === item.dish_id);
                            return (
                              <div
                                key={item.dish_id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {dish?.name || "Unknown"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Số lượng: {item.quantity || 0}
                                  </p>
                                </div>
                                <p className="text-sm font-medium">
                                  {dish?.price &&
                                    formatCurrency(
                                      dish.price * (item.quantity || 0)
                                    )}
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Không có món đặt trước
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Payment details */}
          {reservation?.payments?.length > 0 && (
            <Card className="border-emerald-100 shadow-lg bg-white">
              <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/30 to-white">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-emerald-900">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    Chi tiết thanh toán
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reservation-date">Transaction id</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.payments[0].transaction_id}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="reservation-date">
                      Phương thức thanh toán
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.payments[0].method}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="reservation-date">
                      Số tiền đã thanh toán
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.payments[0].amount}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="reservation-date">Ngày thanh toán</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDateTime(reservation.payments[0].updated_at)}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span>Trạng thái thanh toán:</span>
                    <Badge
                      className={`status-badge ${getStatusColor(
                        reservation.status,
                        PAYMENT_STATUSES
                      )}`}
                    >
                      {getStatusLabel(reservation.status, PAYMENT_STATUSES)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Event details */}
          {reservation?.event && (
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Sự kiện
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reservation-date">Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.event.name}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="reservation-date">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.event.description}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="reservation-date">Chi phí</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(reservation.event_fee || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                    Tên khách hàng
                  </Label>
                  <p className="text-base font-semibold text-gray-900">
                    {reservation.user.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">
                    Số điện thoại
                  </Label>
                  <p className="text-base font-semibold text-gray-900">
                    {reservation.user.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Summary */}
          <Card className="border-amber-100 shadow-lg bg-gradient-to-br from-white to-amber-50/20">
            <CardHeader className="border-b border-amber-100 bg-white">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <CalendarDays className="h-5 w-5 text-amber-600" />
                Tóm tắt đặt bàn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Số đặt bàn:</span>
                <span className="font-bold text-amber-900">
                  #{reservation.id}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Ngày giờ:</span>
                <span className="font-semibold text-gray-900">
                  {formatDateTime(reservation.reservation_time)}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Số người:</span>
                <span className="font-semibold text-gray-900">
                  {reservation.num_people} người
                </span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-gray-600">Bàn:</span>
                <span className="font-semibold text-gray-900">
                  {reservation.table.table_number}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-emerald-700 font-medium">Đặt cọc:</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(reservation.deposit_amount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600">Trạng thái:</span>
                <Badge
                  className={`status-badge ${getStatusColor(
                    reservation.status
                  )} text-sm px-3 py-1`}
                >
                  {getStatusLabel(reservation.status)}
                </Badge>
              </div>
              {isUpcomingReservation && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-sm">
                  <p className="text-sm text-green-800 font-bold flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Đặt bàn sắp tới
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-amber-100 shadow-lg bg-white">
            <CardHeader className="border-b border-amber-100 bg-gradient-to-r from-amber-50/30 to-white">
              <CardTitle className="text-amber-900">Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {reservation.status === "confirmed" && isUpcomingReservation && (
                <Button
                  onClick={checkInReservation}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check-in
                </Button>
              )}

              {reservation.status !== "cancelled" &&
                reservation.status !== "completed" && (
                  <Dialog
                    open={showCancelDialog}
                    onOpenChange={setShowCancelDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Hủy đặt bàn
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          Hủy đặt bàn
                        </DialogTitle>
                        <DialogDescription>
                          Bạn có chắc chắn muốn hủy đặt bàn #
                          {reservation.id.slice(0, 8)}? Vui lòng nhập lý do hủy.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="cancel-reason">
                            Lý do hủy đặt bàn{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Nhập lý do hủy đặt bàn (ví dụ: Khách hàng không đến, Thay đổi kế hoạch, ...)"
                            className="luxury-focus mt-2"
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCancelDialog(false);
                            setCancelReason("");
                          }}
                          disabled={isCancelling}
                        >
                          Đóng
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleCancelReservation}
                          disabled={isCancelling || !cancelReason.trim()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
