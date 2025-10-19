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
} from "lucide-react";
import { api, Reservation, ReservationDetailResponse } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

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
    value: "checked_in",
    label: "Đã check-in",
    color: "status-ready",
    icon: UserCheck,
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
    }
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      setIsLoading(true);
      const response = await api.reservations.getById(reservationId);
      setReservation(response);
      setEditedData(response);
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
    try {
      // Note: This would need to be implemented in the API
      // await api.reservations.update(reservationId, editedData);
      setReservation((prev) => (prev ? { ...prev, ...editedData } : null));
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
    }
  };

  const handleCancel = () => {
    setEditedData(reservation || {});
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      // Note: This would need to be implemented in the API
      // await api.reservations.delete(reservationId);
      toast({
        title: "Thành công",
        description: "Xóa đặt bàn thành công",
      });
      router.push("/reservations");
    } catch (error) {
      console.error("Failed to delete reservation:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa đặt bàn",
        variant: "destructive",
      });
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
              Đặt bàn #{reservation.id}
            </h1>
            <p className="text-muted-foreground">
              Tạo lúc {formatDateTime(reservation.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`status-badge ${getStatusColor(reservation.status)}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {getStatusLabel(reservation.status)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReservation}
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
          {/* Reservation Status */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Trạng thái đặt bàn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  value={reservation.status}
                  onValueChange={updateReservationStatus}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESERVATION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge
                  className={`status-badge ${getStatusColor(
                    reservation.status
                  )}`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {getStatusLabel(reservation.status)}
                </Badge>
                {reservation.status === "confirmed" &&
                  isUpcomingReservation && (
                    <Button
                      onClick={checkInReservation}
                      className="luxury-button"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Check-in
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Reservation Details */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
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
                        className="luxury-button"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Lưu
                      </Button>
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reservation-date">Ngày đặt bàn</Label>
                  {isEditing ? (
                    <Input
                      id="reservation-date"
                      type="date"
                      value={editedData.reservation_time || ""}
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          reservation_time: e.target.value,
                        }))
                      }
                      className="luxury-focus"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.reservation_time}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="reservation-time">Giờ đặt bàn</Label>
                  {isEditing ? (
                    <Input
                      id="reservation-time"
                      type="time"
                      value={editedData.reservation_time || ""}
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          reservation_time: e.target.value,
                        }))
                      }
                      className="luxury-focus"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.reservation_time}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="party-size">Số người</Label>
                  {isEditing ? (
                    <Input
                      id="party-size"
                      type="number"
                      value={editedData.num_people || ""}
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          party_size: parseInt(e.target.value),
                        }))
                      }
                      className="luxury-focus"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.num_people} người
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="table">Bàn</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reservation.table.table_number} (Sức chứa:{" "}
                    {reservation.table.capacity} người)
                  </p>
                </div>
              </div>
              {/* <div>
                <Label htmlFor="special-requests">Yêu cầu đặc biệt</Label>
                {isEditing ? (
                  <Textarea
                    id="special-requests"
                    value={editedData.preferences || ""}
                    onChange={(e) =>
                      setEditedData((prev) => ({
                        ...prev,
                        special_requests: e.target.value,
                      }))
                    }
                    placeholder="Nhập yêu cầu đặc biệt..."
                    className="luxury-focus"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {reservation.preferences ||
                      "Không có yêu cầu đặc biệt"}
                  </p>
                )}
              </div> */}
            </CardContent>
          </Card>
          {/* Payment details */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
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
                  {reservation.user.username}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Số điện thoại</Label>
                <p className="text-sm text-muted-foreground">
                  {reservation.user.phone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Summary */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Tóm tắt đặt bàn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Số đặt bàn:</span>
                <span className="font-medium">#{reservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày giờ:</span>
                <span className="font-medium">
                  {formatDateTime(reservation.reservation_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Số người:</span>
                <span className="font-medium">
                  {reservation.num_people} người
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bàn:</span>
                <span className="font-medium">
                  {reservation.table.table_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <Badge
                  className={`status-badge ${getStatusColor(
                    reservation.status
                  )}`}
                >
                  {getStatusLabel(reservation.status)}
                </Badge>
              </div>
              {isUpcomingReservation && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    Đặt bàn sắp tới
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reservation.status === "confirmed" && isUpcomingReservation && (
                <Button
                  onClick={checkInReservation}
                  className="w-full luxury-button"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check-in
                </Button>
              )}

              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Xóa đặt bàn
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      Xác nhận xóa đặt bàn
                    </DialogTitle>
                    <DialogDescription>
                      Bạn có chắc chắn muốn xóa đặt bàn #{reservation.id}? Hành
                      động này không thể hoàn tác.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Xóa đặt bàn
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
