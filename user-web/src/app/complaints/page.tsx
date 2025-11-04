"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Send, FileText } from "lucide-react";

const complaintCategories = [
  "Chất lượng món ăn",
  "Dịch vụ phục vụ",
  "Môi trường",
  "Thanh toán",
  "Khác",
];

const statusColors = {
  submitted: "bg-yellow-500",
  "under-review": "bg-blue-500",
  resolved: "bg-green-500",
};

// Mock complaints - replace with API
const mockComplaints = [
  {
    id: "CMP-001",
    orderId: "ORD-001",
    category: "Chất lượng món ăn",
    description: "Món ăn không đúng nhiệt độ",
    status: "under-review",
    created_at: "2024-02-15T10:00:00Z",
  },
];

export default function ComplaintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    router.push("/complaints?success=true");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">
            Khiếu Nại / Góp Ý
          </h1>
          <p className="text-muted-foreground">
            Chúng tôi luôn lắng nghe và cải thiện dịch vụ
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-accent" />
                  Gửi Khiếu Nại Mới
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {orderId && (
                  <div>
                    <Label>Mã Đơn Hàng</Label>
                    <Input value={orderId} disabled className="mt-2" />
                  </div>
                )}

                <div>
                  <Label htmlFor="category">Danh Mục *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2 border-accent/20">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {complaintCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Mô Tả Chi Tiết *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                    rows={6}
                    className="mt-2 border-accent/20 focus:border-accent resize-none"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!category || !description || isSubmitting}
                  className="w-full bg-gradient-gold text-primary-foreground"
                >
                  {isSubmitting ? (
                    "Đang gửi..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Gửi Khiếu Nại
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Complaints List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Lịch Sử Khiếu Nại</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockComplaints.length > 0 ? (
                  mockComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/complaints/${complaint.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {complaint.id}
                        </span>
                        <Badge
                          className={
                            statusColors[
                              complaint.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {complaint.status === "submitted" && "Đã gửi"}
                          {complaint.status === "under-review" && "Đang xử lý"}
                          {complaint.status === "resolved" && "Đã giải quyết"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {complaint.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có khiếu nại nào</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
