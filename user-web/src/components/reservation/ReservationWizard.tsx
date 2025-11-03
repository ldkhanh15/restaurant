"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
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
  const { draft, currentStep, setCurrentStep, updateDraft, isVIP } =
    useReservationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return !!(
          draft.customer_name &&
          draft.customer_phone &&
          draft.num_people > 0
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
    setIsSubmitting(true);
    try {
      // API call to create reservation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockId = `RES-${Date.now()}`;
      setReservationId(mockId);
      setCurrentStep(7);
    } catch (error) {
      console.error("Failed to create reservation:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
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
        return <DepositPaymentStep />;
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
                disabled={currentStep === 1}
                className="border-accent/20 hover:bg-accent/5 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay Lại
              </Button>
            </motion.div>

            {currentStep === 6 ? (
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedToNext() || isSubmitting}
                  className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-foreground mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Hoàn Tất Đặt Bàn
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
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
