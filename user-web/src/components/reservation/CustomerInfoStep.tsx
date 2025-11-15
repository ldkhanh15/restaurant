"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Phone, Mail, MessageSquare } from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import { useAuth } from "@/lib/auth";
import {
  slideInRight,
  containerVariants,
  itemVariants,
} from "@/lib/motion-variants";

export default function CustomerInfoStep() {
  const { draft, updateDraft } = useReservationStore();
  const { user } = useAuth();

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user && !draft.customer_name) {
      updateDraft({
        customer_name: user.full_name || "",
        customer_phone: user.phone || "",
        customer_email: user.email || "",
      });
    }
  }, [user, draft.customer_name, updateDraft]);

  return (
    <motion.div
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-2 border-accent/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="flex items-center gap-2 font-elegant text-2xl">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <Users className="h-6 w-6 text-accent" />
              </motion.div>
              Thông Tin Khách Hàng
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Vui lòng điền đầy đủ thông tin để chúng tôi phục vụ bạn tốt nhất
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div
              variants={itemVariants}
              className="grid md:grid-cols-2 gap-4"
            >
              <motion.div
                variants={itemVariants}
                className="space-y-2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Label
                  htmlFor="customer_name"
                  className="flex items-center gap-2 font-medium"
                >
                  <Users className="h-4 w-4 text-accent" />
                  Họ và Tên *
                </Label>
                <Input
                  id="customer_name"
                  value={draft.customer_name}
                  readOnly
                  disabled
                  placeholder="Nguyễn Văn An"
                  className="border-accent/20 bg-muted focus-visible:ring-0"
                />
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="space-y-2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Label
                  htmlFor="customer_phone"
                  className="flex items-center gap-2 font-medium"
                >
                  <Phone className="h-4 w-4 text-accent" />
                  Số Điện Thoại *
                </Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={draft.customer_phone}
                  readOnly
                  disabled
                  placeholder="0901234567"
                  className="border-accent/20 bg-muted focus-visible:ring-0"
                />
              </motion.div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Label
                htmlFor="customer_email"
                className="flex items-center gap-2 font-medium"
              >
                <Mail className="h-4 w-4 text-accent" />
                Email
              </Label>
              <Input
                id="customer_email"
                type="email"
                value={draft.customer_email}
                readOnly
                disabled
                placeholder="an.nguyen@email.com"
                className="border-accent/20 bg-muted focus-visible:ring-0"
              />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Label htmlFor="num_people" className="font-medium">
                Số Lượng Khách *
              </Label>
              <Input
                id="num_people"
                type="number"
                min="1"
                max="20"
                value={draft.num_people || ""}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value > 0) {
                    updateDraft({ num_people: value });
                  } else if (e.target.value === "") {
                    updateDraft({ num_people: 0 });
                  }
                }}
                className="border-accent/20 focus:border-accent transition-all duration-200"
              />
              {draft.num_people <= 0 && (
                <p className="text-xs text-destructive mt-1">
                  Số lượng khách phải lớn hơn 0
                </p>
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Label htmlFor="duration_minutes" className="font-medium">
                Thời lượng sử dụng (phút) *
              </Label>
              <Input
                id="duration_minutes"
                type="number"
                min="30"
                max="480"
                step="15"
                value={draft.duration_minutes}
                onChange={(e) =>
                  updateDraft({
                    duration_minutes: Math.min(
                      480,
                      Math.max(30, parseInt(e.target.value) || 30)
                    ),
                  })
                }
                className="border-accent/20 focus:border-accent transition-all duration-200"
              />
              <p className="text-xs text-muted-foreground">
                Thời lượng tối thiểu 30 phút và tối đa 480 phút (8 giờ)
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Label
                htmlFor="special_requests"
                className="flex items-center gap-2 font-medium"
              >
                <MessageSquare className="h-4 w-4 text-accent" />
                Yêu Cầu Đặc Biệt
              </Label>
              <Textarea
                id="special_requests"
                value={draft.special_requests}
                onChange={(e) =>
                  updateDraft({ special_requests: e.target.value })
                }
                placeholder="Ví dụ: Gần cửa sổ, khu vực yên tĩnh, kỷ niệm sinh nhật..."
                rows={4}
                className="border-accent/20 focus:border-accent resize-none transition-all duration-200"
              />
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
