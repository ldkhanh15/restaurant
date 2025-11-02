"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
  Calendar,
  QrCode,
  Download,
  Mail,
  Phone,
} from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function ReservationSuccessStep({
  reservationId,
}: {
  reservationId: string;
}) {
  const { draft, resetDraft } = useReservationStore();
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/reservations/${reservationId}`);
  };

  const handleNewReservation = () => {
    resetDraft();
    router.push("/reservations");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
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
            Đặt Bàn Thành Công!
          </CardTitle>
          <CardDescription className="text-base">
            Cảm ơn bạn đã đặt bàn tại HIWELL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reservation ID */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Mã đặt bàn</p>
            <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2">
              {reservationId}
            </Badge>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Thông Tin Đặt Bàn</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Ngày & Giờ</p>
                  <p className="font-semibold">
                    {draft.date &&
                      format(draft.date, "EEEE, dd MMMM yyyy", { locale: vi })}
                  </p>
                  <p className="text-sm">{draft.time}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số Khách</p>
                <p className="font-semibold">{draft.num_people} người</p>
              </div>
              {draft.selected_table_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Bàn</p>
                  <p className="font-semibold">{draft.selected_table_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center p-6 bg-white rounded-lg border-2 border-border">
            <QrCode className="h-32 w-32 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Quét mã QR để xem thông tin đặt bàn
            </p>
          </div>

          {/* Actions */}
          <div className="grid md:grid-cols-2 gap-3">
            <Button
              onClick={handleViewDetails}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Xem Chi Tiết
            </Button>
            <Button
              onClick={handleNewReservation}
              variant="outline"
              className="w-full"
            >
              Đặt Bàn Mới
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>Email xác nhận đã được gửi</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>SMS sẽ được gửi trong vài phút</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
