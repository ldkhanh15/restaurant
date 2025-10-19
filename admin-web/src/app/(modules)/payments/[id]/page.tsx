"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  MapPin,
  Receipt,
  Calendar,
  AlertCircle,
  TrendingUp,
  Banknote,
  Smartphone,
} from "lucide-react";
import { api, Payment } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const PAYMENT_STATUSES = [
  {
    value: "pending",
    label: "Chờ xử lý",
    color: "status-pending",
    icon: Clock,
  },
  {
    value: "completed",
    label: "Hoàn thành",
    color: "status-completed",
    icon: CheckCircle,
  },
  {
    value: "failed",
    label: "Thất bại",
    color: "status-cancelled",
    icon: XCircle,
  },
  {
    value: "refunded",
    label: "Đã hoàn tiền",
    color: "status-cancelled",
    icon: XCircle,
  },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Tiền mặt", icon: Banknote, color: "text-green-600" },
  { value: "card", label: "Thẻ", icon: CreditCard, color: "text-blue-600" },
  {
    value: "vnpay",
    label: "VNPay",
    icon: Smartphone,
    color: "text-purple-600",
  },
  {
    value: "bank_transfer",
    label: "Chuyển khoản",
    icon: TrendingUp,
    color: "text-orange-600",
  },
];

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);

  const loadPayment = async () => {
    try {
      setIsLoading(true);
      const response = await api.payments.getById(paymentId);
      setPayment(response.data);
    } catch (error) {
      console.error("Failed to load payment:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return PAYMENT_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return (
      PAYMENT_STATUSES.find((s) => s.value === status)?.color ||
      "status-pending"
    );
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find((s) => s.value === status);
    return statusConfig?.icon || Clock;
  };

  const getMethodLabel = (method: string) => {
    return PAYMENT_METHODS.find((m) => m.value === method)?.label || method;
  };

  const getMethodIcon = (method: string) => {
    const methodConfig = PAYMENT_METHODS.find((m) => m.value === method);
    return methodConfig?.icon || CreditCard;
  };

  const getMethodColor = (method: string) => {
    const methodConfig = PAYMENT_METHODS.find((m) => m.value === method);
    return methodConfig?.color || "text-gray-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const paymentDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - paymentDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            Đang tải thông tin thanh toán...
          </p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-8">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">
          Không tìm thấy thanh toán
        </h2>
        <p className="text-muted-foreground mb-4">
          Thanh toán này có thể đã bị xóa hoặc không tồn tại.
        </p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(payment.status);
  const MethodIcon = getMethodIcon(payment.payment_method);

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
              Thanh toán #
              {payment.transaction_id ||
                payment.vnpay_transaction_id ||
                payment.id.slice(-8)}
            </h1>
            <p className="text-muted-foreground">
              Tạo lúc {formatDateTime(payment.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`status-badge ${getStatusColor(payment.status)}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {getStatusLabel(payment.status)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayment}
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
          {/* Payment Status */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Trạng thái thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-5 w-5" />
                  <Badge
                    className={`status-badge ${getStatusColor(payment.status)}`}
                  >
                    {getStatusLabel(payment.status)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Cập nhật lần cuối: {getRelativeTime(payment.updated_at)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Chi tiết thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Mã giao dịch</Label>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {payment.transaction_id ||
                      payment.vnpay_transaction_id ||
                      `#${payment.id.slice(-8)}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Số đơn hàng</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    #{payment.order_number}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Phương thức thanh toán
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MethodIcon
                      className={`h-4 w-4 ${getMethodColor(
                        payment.payment_method
                      )}`}
                    />
                    <span className="text-sm font-medium">
                      {getMethodLabel(payment.payment_method)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Số tiền</Label>
                  <p className="text-lg font-semibold gold-text mt-1">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Thời gian tạo</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDateTime(payment.created_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Cập nhật lần cuối
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDateTime(payment.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Timeline */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Lịch sử giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Thanh toán được tạo</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                </div>

                {payment.status === "completed" && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        Thanh toán hoàn thành
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(payment.updated_at)}
                      </p>
                    </div>
                  </div>
                )}

                {payment.status === "failed" && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Thanh toán thất bại</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(payment.updated_at)}
                      </p>
                    </div>
                  </div>
                )}

                {payment.status === "refunded" && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <ArrowLeft className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Hoàn tiền</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(payment.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
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
                  {payment.customer_name || "Khách vãng lai"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Bàn</Label>
                <p className="text-sm text-muted-foreground">
                  {payment.table_name || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Tóm tắt thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Số tiền:</span>
                <span className="font-semibold gold-text text-lg">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phương thức:</span>
                <div className="flex items-center gap-1">
                  <MethodIcon
                    className={`h-4 w-4 ${getMethodColor(
                      payment.payment_method
                    )}`}
                  />
                  <span className="font-medium">
                    {getMethodLabel(payment.payment_method)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <Badge
                  className={`status-badge ${getStatusColor(payment.status)}`}
                >
                  {getStatusLabel(payment.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span className="text-sm text-muted-foreground">
                  {getRelativeTime(payment.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Details */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Chi tiết phương thức
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MethodIcon
                  className={`h-6 w-6 ${getMethodColor(
                    payment.payment_method
                  )}`}
                />
                <div>
                  <p className="font-medium">
                    {getMethodLabel(payment.payment_method)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.payment_method === "vnpay" &&
                      "Thanh toán qua VNPay"}
                    {payment.payment_method === "card" && "Thanh toán qua thẻ"}
                    {payment.payment_method === "cash" &&
                      "Thanh toán bằng tiền mặt"}
                    {payment.payment_method === "bank_transfer" &&
                      "Chuyển khoản ngân hàng"}
                  </p>
                </div>
              </div>

              {payment.vnpay_transaction_id && (
                <div>
                  <Label className="text-sm font-medium">Mã VNPay</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {payment.vnpay_transaction_id}
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
              <Button
                variant="outline"
                className="w-full luxury-focus"
                onClick={() => window.print()}
              >
                <Receipt className="h-4 w-4 mr-2" />
                In hóa đơn
              </Button>

              {payment.status === "completed" && (
                <Button
                  variant="outline"
                  className="w-full text-orange-600 hover:text-orange-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Yêu cầu hoàn tiền
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full luxury-focus"
                onClick={loadPayment}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
