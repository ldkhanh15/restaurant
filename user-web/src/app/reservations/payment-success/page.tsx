"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  ArrowRight,
  Home,
} from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import { getReservationById } from "@/mock/mockReservations";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const txnRef = searchParams.get("txnRef");
  const amount = searchParams.get("amount");
  const { draft, resetDraft } = useReservationStore();

  const isSuccess = status === "success";

  useEffect(() => {
    if (isSuccess && draft && txnRef) {
      // Create reservation after successful payment
      const reservationId = `RES-${Date.now()}`;
      // In real app, would call API here
      setTimeout(() => {
        // Reset draft and proceed to success step
        router.push(`/reservations/${reservationId}`);
      }, 3000);
    }
  }, [isSuccess, draft, txnRef, router]);

  if (!isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-red-500/20">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto mb-4 w-20 h-20 bg-red-500 rounded-full flex items-center justify-center"
              >
                <XCircle className="h-12 w-12 text-white" />
              </motion.div>
              <CardTitle className="text-2xl text-red-600 mb-2">
                Thanh Toán Thất Bại
              </CardTitle>
              <CardDescription>
                Có lỗi xảy ra trong quá trình thanh toán
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {txnRef && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Mã giao dịch
                  </p>
                  <Badge variant="outline" className="font-mono">
                    {txnRef}
                  </Badge>
                </div>
              )}
              <Button
                onClick={() => router.push("/reservations")}
                className="w-full"
                variant="outline"
              >
                Thử Lại
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-2 border-green-500/20 bg-green-50/50">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mx-auto mb-4 w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="h-12 w-12 text-white" />
            </motion.div>
            <CardTitle className="text-3xl text-green-700 mb-2">
              Thanh Toán Thành Công!
            </CardTitle>
            <CardDescription className="text-base">
              Đặt cọc của bạn đã được xử lý thành công
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {txnRef && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Mã giao dịch
                </p>
                <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2 font-mono">
                  {txnRef}
                </Badge>
              </div>
            )}

            {amount && (
              <div className="text-center p-4 bg-white rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">
                  Số tiền đã thanh toán
                </p>
                <p className="text-2xl font-bold text-primary">
                  {parseInt(amount).toLocaleString("vi-VN")}đ
                </p>
              </div>
            )}

            <Separator />

            {draft && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Thông Tin Đặt Bàn</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {draft.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span>
                        {new Date(draft.date).toLocaleDateString("vi-VN")} lúc{" "}
                        {draft.time}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Số khách: </span>
                    <span className="font-medium">
                      {draft.num_people} người
                    </span>
                  </div>
                  {draft.selected_table_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span>{draft.selected_table_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <p className="text-sm text-blue-800 text-center">
                Đang xử lý đặt bàn... Bạn sẽ được chuyển hướng trong giây lát
              </p>
            </motion.div>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Về Trang Chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
