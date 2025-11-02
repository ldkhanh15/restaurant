"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const reservationId = searchParams.get("reservation_id");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-emerald-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900">
            Thanh toán thành công!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <p className="text-center text-emerald-800 font-medium">
              {orderId
                ? "Đơn hàng của bạn đã được thanh toán thành công"
                : "Đặt cọc reservation đã được xác nhận"}
            </p>
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
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              Xem chi tiết
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
