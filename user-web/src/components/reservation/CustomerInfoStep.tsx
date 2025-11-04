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
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Thông Tin Khách Hàng
          </CardTitle>
          <CardDescription>
            Vui lòng điền đầy đủ thông tin để chúng tôi phục vụ bạn tốt nhất
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="customer_name"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Họ và Tên *
              </Label>
              <Input
                id="customer_name"
                value={draft.customer_name}
                onChange={(e) => updateDraft({ customer_name: e.target.value })}
                placeholder="Nguyễn Văn An"
                required
                className="border-accent/20 focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="customer_phone"
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Số Điện Thoại *
              </Label>
              <Input
                id="customer_phone"
                type="tel"
                value={draft.customer_phone}
                onChange={(e) =>
                  updateDraft({ customer_phone: e.target.value })
                }
                placeholder="0901234567"
                required
                className="border-accent/20 focus:border-accent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="customer_email"
              type="email"
              value={draft.customer_email}
              onChange={(e) => updateDraft({ customer_email: e.target.value })}
              placeholder="an.nguyen@email.com"
              className="border-accent/20 focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="num_people">Số Lượng Khách *</Label>
            <Input
              id="num_people"
              type="number"
              min="1"
              max="20"
              value={draft.num_people}
              onChange={(e) =>
                updateDraft({ num_people: parseInt(e.target.value) || 1 })
              }
              className="border-accent/20 focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="special_requests"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
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
              className="border-accent/20 focus:border-accent resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
