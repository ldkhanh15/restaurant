"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  XCircle,
  ArrowRight,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const reservationId = searchParams.get("reservation_id");
  const errorCode = searchParams.get("error_code");
  const errorMessage = searchParams.get("error_message");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId, reservationId]);

  const handleRedirect = () => {
    if (orderId) {
      router.push(`/orders/${orderId}`);
    } else if (reservationId) {
      router.push(`/reservations/${reservationId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const getErrorMessage = () => {
    if (errorMessage) return errorMessage;
    if (errorCode) {
      const errorMessages: Record<string, string> = {
        "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
        "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
        "10": "Xác thực thông tin thẻ/tài khoản không đúng. Quá 3 lần",
        "11": "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.",
        "12": "Thẻ/Tài khoản bị khóa.",
        "13": "Nhập sai mật khẩu xác thực giao dịch (OTP). Quá 3 lần",
        "51": "Tài khoản không đủ số dư để thực hiện giao dịch.",
        "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
        "75": "Ngân hàng thanh toán đang bảo trì.",
        "79": "Nhập sai mật khẩu thanh toán quá số lần quy định.",
      };
      return errorMessages[errorCode] || `Lỗi thanh toán (Mã: ${errorCode})`;
    }
    return "Thanh toán không thành công. Vui lòng thử lại sau.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-red-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <XCircle className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">
            Thanh toán thất bại!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-center text-red-800 font-medium flex-1">
                {getErrorMessage()}
              </p>
            </div>
          </div>

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

          <div className="text-center text-sm text-gray-500">
            Tự động chuyển hướng sau {countdown} giây...
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex-1"
            >
              Về trang chủ
            </Button>
            <Button
              onClick={handleRedirect}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Thử lại
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
