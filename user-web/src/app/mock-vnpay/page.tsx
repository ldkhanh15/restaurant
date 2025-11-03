"use client";

import { useState, useEffect } from "react";
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
import { CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function MockVnpayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txnRef = searchParams.get("txnRef");
  const amount = searchParams.get("amount");
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "failed" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Simulate processing delay
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  }, []);

  const handleSuccess = () => {
    setPaymentStatus("success");
    setTimeout(() => {
      router.push(
        `/reservations/payment-success?status=success&txnRef=${txnRef}&amount=${amount}`
      );
    }, 2000);
  };

  const handleFail = () => {
    setPaymentStatus("failed");
    setTimeout(() => {
      router.push(
        `/reservations/payment-success?status=failed&txnRef=${txnRef}`
      );
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <Card className="border-2 border-accent/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Thanh Toán VNPay</CardTitle>
            <CardDescription>
              Giao diện giả lập thanh toán (Mock)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Info */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã giao dịch:</span>
                <span className="font-mono text-sm">{txnRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tiền:</span>
                <span className="font-bold text-primary">
                  {amount ? parseInt(amount).toLocaleString("vi-VN") : "0"}đ
                </span>
              </div>
            </div>

            {isProcessing ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Đang xử lý thanh toán...
                </p>
              </div>
            ) : paymentStatus ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
              >
                {paymentStatus === "success" ? (
                  <>
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <p className="font-semibold text-green-600 mb-2">
                      Thanh toán thành công!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Đang chuyển hướng...
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                    <p className="font-semibold text-red-600 mb-2">
                      Thanh toán thất bại
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Đang chuyển hướng...
                    </p>
                  </>
                )}
              </motion.div>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Chọn kết quả thanh toán để test:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleSuccess}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Thành công
                    </Button>
                    <Button onClick={handleFail} variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Thất bại
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-center text-muted-foreground">
                    💡 Đây là giao diện mock để test flow thanh toán
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
