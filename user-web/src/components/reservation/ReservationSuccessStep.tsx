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
  Sparkles,
} from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  successVariants,
  scaleInVariants,
  containerVariants,
  itemVariants,
  buttonVariants,
} from "@/lib/motion-variants";

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
      variants={scaleInVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto"
    >
      <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50/50 to-green-100/30 shadow-2xl overflow-hidden">
        <CardHeader className="text-center relative overflow-hidden">
          {/* Animated background sparkles */}
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 70%, #059669 0%, transparent 50%)",
              backgroundSize: "200% 200%",
            }}
          />

          <motion.div
            variants={successVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl relative z-10"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-green-400"
            />
            <CheckCircle className="h-12 w-12 text-white relative z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="text-3xl text-green-700 mb-2 font-elegant">
              Đặt Bàn Thành Công!
            </CardTitle>
            <CardDescription className="text-base">
              Cảm ơn bạn đã đặt bàn tại HIWELL
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {/* Reservation ID with animation */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <p className="text-sm text-muted-foreground mb-2">Mã đặt bàn</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge className="bg-gradient-gold text-primary-foreground text-lg px-6 py-3 font-mono shadow-lg">
                {reservationId}
              </Badge>
            </motion.div>
          </motion.div>

          <Separator />

          {/* Summary with stagger */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <motion.h3
              variants={itemVariants}
              className="font-semibold text-lg font-elegant"
            >
              Thông Tin Đặt Bàn
            </motion.h3>
            <motion.div
              variants={containerVariants}
              className="grid md:grid-cols-2 gap-4"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 p-3 bg-white/50 rounded-lg"
                whileHover={{ scale: 1.02, x: 4 }}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Calendar className="h-5 w-5 text-accent" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày & Giờ</p>
                  <p className="font-semibold">
                    {draft.date &&
                      format(draft.date, "EEEE, dd MMMM yyyy", { locale: vi })}
                  </p>
                  <p className="text-sm">{draft.time}</p>
                </div>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="p-3 bg-white/50 rounded-lg"
                whileHover={{ scale: 1.02, x: 4 }}
              >
                <p className="text-sm text-muted-foreground">Số Khách</p>
                <p className="font-semibold text-xl">
                  {draft.num_people} người
                </p>
              </motion.div>
              {draft.selected_table_name && (
                <motion.div
                  variants={itemVariants}
                  className="p-3 bg-white/50 rounded-lg"
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <p className="text-sm text-muted-foreground">Bàn</p>
                  <p className="font-semibold text-xl">
                    {draft.selected_table_name}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* QR Code with pulse animation */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-center p-6 bg-white rounded-lg border-2 border-border relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-600/20"
            />
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <QrCode className="h-32 w-32 mx-auto mb-4 text-primary relative z-10" />
            </motion.div>
            <p className="text-sm text-muted-foreground relative z-10">
              Quét mã QR để xem thông tin đặt bàn
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-3"
          >
            <motion.div variants={itemVariants}>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={handleViewDetails}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Xem Chi Tiết
                </Button>
              </motion.div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={handleNewReservation}
                  variant="outline"
                  className="w-full border-accent/20 hover:bg-accent/10 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Đặt Bàn Mới
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Confirmation indicators */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4 border-t"
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Mail className="h-4 w-4 text-green-600" />
              </motion.div>
              <span>Email xác nhận đã được gửi</span>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              >
                <Phone className="h-4 w-4 text-green-600" />
              </motion.div>
              <span>SMS sẽ được gửi trong vài phút</span>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
