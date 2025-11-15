"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  Send, 
  FileText, 
  Loader2,
  ArrowLeft,
  CheckCircle 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Complaint, CreateComplaintData } from "@/type/Complaint";
import { complaintService } from "@/services/complaintService";

interface ComplaintsPageProps {
  params: { orderId: string };
}

export default function ComplaintsPage({ params }: ComplaintsPageProps) {
  const router = useRouter();
  const { orderId } = params;

  // Form state
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ description?: string }>({});

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: { description?: string } = {};

    if (!description.trim()) {
      newErrors.description = "Mô tả chi tiết là bắt buộc";
    } else if (description.trim().length < 10) {
      newErrors.description = "Mô tả phải có ít nhất 10 ký tự";
    } else if (description.trim().length > 1000) {
      newErrors.description = "Mô tả không được quá 1000 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear field error when user starts typing
  const clearFieldError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof typeof errors];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Lỗi validation",
        description: "Vui lòng kiểm tra lại thông tin nhập vào",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const complaintData: CreateComplaintData = {
        order_id: orderId,
        description: description.trim(),
      };

      await complaintService.create(complaintData);

      toast({
        title: "Thành công",
        description: "Khiếu nại đã được gửi thành công",
      });

      // Redirect to orders page
      router.push(`/orders`);
    } catch (error: any) {
      console.error("Failed to create complaint:", error);
      
      const errorMessage = 
        error?.response?.data?.message || 
        "Không thể gửi khiếu nại. Vui lòng thử lại sau.";
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gửi Khiếu Nại
          </h1>
          <p className="text-muted-foreground">
            Chúng tôi luôn lắng nghe và cải thiện dịch vụ dựa trên phản hồi của bạn
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Complaint Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  Thông Tin Khiếu Nại
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Order ID Field */}
                  <div className="space-y-2">
                    <Label htmlFor="orderId" className="text-sm font-medium">
                      Mã Đơn Hàng
                    </Label>
                    <Input
                      id="orderId"
                      value={orderId || ""}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Khiếu nại sẽ được liên kết với đơn hàng này
                    </p>
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Mô Tả Chi Tiết <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        clearFieldError('description');
                      }}
                      placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với đơn hàng này..."
                      rows={6}
                      className={`resize-none transition-colors ${
                        errors.description 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'focus:border-primary'
                      }`}
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-xs">
                        {errors.description && (
                          <span className="text-red-500">{errors.description}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {description.length}/1000 ký tự
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !description.trim()}
                      className="w-full h-12 text-base font-medium"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang gửi khiếu nại...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gửi Khiếu Nại
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Hướng Dẫn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Mô tả rõ ràng vấn đề bạn gặp phải</p>
                  <p>• Cung cấp chi tiết về thời gian xảy ra</p>
                  <p>• Nêu tác động của vấn đề đến trải nghiệm</p>
                  <p>• Đề xuất giải pháp nếu có</p>
                </div>
              </CardContent>
            </Card>

            {/* Process Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Quy Trình Xử Lý
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center mt-0.5">
                    1
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Tiếp nhận</p>
                    <p className="text-muted-foreground">Trong 24 giờ</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center mt-0.5">
                    2
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Xử lý</p>
                    <p className="text-muted-foreground">1-3 ngày làm việc</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center mt-0.5">
                    3
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Phản hồi</p>
                    <p className="text-muted-foreground">Qua email/SMS</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
