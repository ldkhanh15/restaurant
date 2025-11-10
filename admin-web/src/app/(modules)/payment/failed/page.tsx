"use client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  XCircle,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const orderId = searchParams.get("order_id");
  const reservationId = searchParams.get("reservation_id");
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const getErrorMessage = () => {
    switch (reason) {
      case "invalid_hash":
        return {
          title: "Giao dịch không hợp lệ",
          description:
            "Chữ ký điện tử không đúng. Có thể do link thanh toán đã bị thay đổi hoặc hết hạn.",
          icon: AlertTriangle,
        };
      case "order_not_found":
        return {
          title: "Không tìm thấy đơn hàng",
          description:
            "Đơn hàng không tồn tại trong hệ thống. Vui lòng kiểm tra lại mã đơn hàng.",
          icon: FileText,
        };
      case "unknown_type":
        return {
          title: "Loại giao dịch không xác định",
          description:
            "Không xác định được đây là thanh toán đơn hàng hay đặt cọc reservation.",
          icon: HelpCircle,
        };
      default:
        return {
          title: "Thanh toán thất bại",
          description:
            "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
          icon: XCircle,
        };
    }
  };

  const errorInfo = getErrorMessage();
  const ErrorIcon = errorInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-red-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <ErrorIcon className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">
            {errorInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {errorInfo.description}
            </AlertDescription>
          </Alert>

          {orderId && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Mã đơn hàng
                </p>
                <p className="text-base font-semibold text-gray-900">
                  #{orderId.slice(0, 8)}
                </p>
              </div>
            </div>
          )}

          {reservationId && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Mã đặt bàn
                </p>
                <p className="text-base font-semibold text-gray-900">
                  #{reservationId.slice(0, 8)}
                </p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-900">
              <strong>Lưu ý:</strong> Giao dịch chưa được thực hiện. Không có
              khoản tiền nào bị trừ từ tài khoản của bạn.
            </p>
          </div>

          <div className="text-center text-sm text-gray-500">
            Tự động quay về trang chủ sau {countdown} giây...
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Về trang chủ
            </Button>
            {orderId && (
              <Button
                onClick={() => router.push(`/orders/${orderId}`)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                Thử lại
              </Button>
            )}
            {reservationId && (
              <Button
                onClick={() => router.push(`/reservations/${reservationId}`)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Thử lại
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
