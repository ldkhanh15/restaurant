"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import { reservationService } from "@/services/reservationService";
import { toast } from "@/hooks/use-toast";
import ProgressStepper from "./ProgressStepper";
import CustomerInfoStep from "./CustomerInfoStep";
import TimeSelectionStep from "./TimeSelectionStep";
import TableSelectionStep from "./TableSelectionStep";
import EventSelectionStep from "./EventSelectionStep";
import PreorderDishStep from "./PreorderDishStep";
import DepositPaymentStep from "./DepositPaymentStep";
import ReservationSuccessStep from "./ReservationSuccessStep";
import {
  Users,
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  ShoppingCart,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import {
  pageVariants,
  buttonVariants,
  viewportOptions,
} from "@/lib/motion-variants";

const steps = [
  { id: 1, name: "Thông Tin", icon: Users },
  { id: 2, name: "Thời Gian", icon: CalendarIcon },
  { id: 3, name: "Chọn Bàn", icon: MapPin },
  { id: 4, name: "Sự Kiện", icon: Gift },
  { id: 5, name: "Đặt Món", icon: ShoppingCart },
  { id: 6, name: "Thanh Toán", icon: CreditCard },
  { id: 7, name: "Hoàn Tất", icon: CheckCircle },
];

export default function ReservationWizard() {
  const { draft, currentStep, setCurrentStep, updateDraft, isVIP, resetDraft } =
    useReservationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return !!(
          draft.customer_name &&
          draft.customer_phone &&
          draft.num_people > 0 &&
          draft.duration_minutes >= 30
        );
      case 2:
        return !!(draft.date && draft.time);
      case 3:
        return !!draft.selected_table_id;
      case 4:
      case 5:
        return true; // Optional steps
      case 6:
        return !!(draft.payment_method || isVIP);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!draft.selected_table_id || !draft.date || !draft.time) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin đặt bàn",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time
      const reservationTime = new Date(draft.date);
      const [hours, minutes] = draft.time.split(":").map(Number);
      reservationTime.setHours(hours, minutes, 0, 0);

      // Prepare pre_order_items
      const pre_order_items = draft.pre_orders.map((item) => ({
        dish_id: item.dish_id,
        quantity: item.quantity,
      }));

      // Create reservation
      const response = await reservationService.createReservation({
        table_id: draft.selected_table_id,
        reservation_time: reservationTime.toISOString(),
        duration_minutes: draft.duration_minutes,
        num_people: draft.num_people,
        preferences: {
          customer_name: draft.customer_name,
          customer_phone: draft.customer_phone,
          customer_email: draft.customer_email,
          special_requests: draft.special_requests,
          event_details: draft.event_details,
          selected_services: draft.selected_services,
        },
        event_id: draft.event_id || undefined,
        pre_order_items:
          pre_order_items.length > 0 ? pre_order_items : undefined,
      });

      const result = response.data;
      const createdReservation = result.reservation;
      const requiresPayment = Boolean(result.requires_payment);
      const paymentInfo = result.payment_url;
      const depositAmount = result.deposit_amount;

      // If payment is required, redirect to VNPAY payment URL
      if (requiresPayment && paymentInfo?.url) {
        // Show toast with deposit amount before redirecting
        if (typeof depositAmount === "number" && depositAmount > 0) {
          toast({
            title: "Chuyển đến trang thanh toán",
            description: `Số tiền đặt cọc: ${depositAmount.toLocaleString(
              "vi-VN"
            )}đ. Bạn sẽ được chuyển đến cổng thanh toán VNPAY.`,
          });
        } else {
          toast({
            title: "Chuyển đến trang thanh toán",
            description: "Bạn sẽ được chuyển đến cổng thanh toán VNPAY.",
          });
        }

        // Clear draft and redirect to VNPAY
        resetDraft();
        // Use setTimeout to ensure toast is shown before redirect
        setTimeout(() => {
          window.location.href = paymentInfo.url;
        }, 500);
        return;
      }
      
      // No payment required (VIP user or no deposit needed)
      setReservationId(createdReservation.id);
      resetDraft();
      setCurrentStep(7);
      toast({
        title: "Đặt bàn thành công",
        description: "Đặt bàn của bạn đã được tạo thành công",
      });
    } catch (error: any) {
      console.error("Failed to create reservation:", error);
      const backendMessage = error?.response?.data?.message as
        | string
        | undefined;

      if (
        typeof backendMessage === "string" &&
        backendMessage.includes("Table is already reserved")
      ) {
        toast({
          title: "Khung giờ đã có khách",
          description:
            "Bàn và thời gian bạn chọn đã được đặt trước. Vui lòng chọn thời gian hoặc bàn khác.",
          variant: "destructive",
        });
        setCurrentStep(2);
      } else {
        toast({
          title: "Lỗi",
          description:
            backendMessage ||
            error.message ||
            "Có lỗi xảy ra. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 7 && reservationId) {
      return <ReservationSuccessStep reservationId={reservationId} />;
    }

    switch (currentStep) {
      case 1:
        return <CustomerInfoStep />;
      case 2:
        return <TimeSelectionStep />;
      case 3:
        return <TableSelectionStep />;
      case 4:
        return <EventSelectionStep />;
      case 5:
        return <PreorderDishStep />;
      case 6:
        return (
          <DepositPaymentStep
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100"
    >
      <ProgressStepper steps={steps} currentStep={currentStep} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {currentStep < 7 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-between mt-8"
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className="border-accent/20 hover:bg-accent/5 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay Lại
              </Button>
            </motion.div>

            {currentStep < 6 && (
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  Tiếp Theo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
