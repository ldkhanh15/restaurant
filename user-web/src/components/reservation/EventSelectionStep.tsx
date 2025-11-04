"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PartyPopper, Heart, Sparkles, Gift } from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import { cn } from "@/lib/utils";
import {
  slideInRight,
  containerVariants,
  itemVariants,
  cardVariants,
  viewportOptions,
} from "@/lib/motion-variants";

const eventTypes = [
  {
    id: "birthday",
    name: "Tiệc Sinh Nhật",
    description: "Tổ chức tiệc sinh nhật với trang trí đặc biệt",
    icon: PartyPopper,
    color: "bg-pink-500",
    additionalCost: 200000,
    extraServices: ["Trang trí bóng", "Bánh kem", "Nến"],
  },
  {
    id: "anniversary",
    name: "Kỷ Niệm",
    description: "Không gian lãng mạn cho ngày đặc biệt",
    icon: Heart,
    color: "bg-red-500",
    additionalCost: 150000,
    extraServices: ["Hoa hồng", "Nến", "Rượu champagne"],
  },
  {
    id: "celebration",
    name: "Tiệc Mừng",
    description: "Ăn mừng thành công, thăng tiến",
    icon: Sparkles,
    color: "bg-purple-500",
    additionalCost: 300000,
    extraServices: ["Banner", "Balloon", "Cake"],
  },
  {
    id: "none",
    name: "Không có",
    description: "Bữa ăn thông thường",
    icon: Gift,
    color: "bg-gray-500",
    additionalCost: 0,
    extraServices: [],
  },
];

export default function EventSelectionStep() {
  const { draft, updateDraft } = useReservationStore();
  const selectedEvent =
    eventTypes.find((e) => e.id === draft.event_type) || eventTypes[3];

  const handleEventSelect = (eventId: string) => {
    if (eventId === "none") {
      updateDraft({
        event_type: null,
        event_details: null,
        selected_services: [],
      });
    } else {
      updateDraft({
        event_type: eventId,
        selected_services: [],
      });
    }
  };

  const toggleService = (service: string) => {
    const currentServices = draft.selected_services || [];
    if (currentServices.includes(service)) {
      updateDraft({
        selected_services: currentServices.filter((s) => s !== service),
      });
    } else {
      updateDraft({
        selected_services: [...currentServices, service],
      });
    }
  };

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
                <Gift className="h-6 w-6 text-accent" />
              </motion.div>
              Chọn Sự Kiện (Tùy chọn)
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Nếu bạn có sự kiện đặc biệt, hãy cho chúng tôi biết
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-4"
          >
            {eventTypes.map((eventType, index) => {
              const IconComponent = eventType.icon;
              const isSelected = draft.event_type === eventType.id;

              return (
                <motion.div
                  key={eventType.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  custom={index}
                  viewport={viewportOptions}
                >
                  <Card
                    className={cn(
                      "cursor-pointer transition-all border-2 h-full",
                      isSelected
                        ? "border-accent ring-4 ring-accent/20 bg-gradient-to-br from-card to-accent/5 shadow-xl"
                        : "border-border hover:border-accent/50 shadow-md hover:shadow-lg"
                    )}
                    onClick={() => handleEventSelect(eventType.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg",
                            eventType.color
                          )}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <IconComponent className="h-6 w-6" />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg font-elegant">
                            {eventType.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {eventType.description}
                          </p>
                        </div>
                      </div>
                      {eventType.additionalCost > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-muted-foreground">
                            Phụ phí:
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-accent/10 text-accent"
                          >
                            {eventType.additionalCost.toLocaleString("vi-VN")}đ
                          </Badge>
                        </motion.div>
                      )}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="mt-3 pt-3 border-t border-accent/20"
                        >
                          <div className="flex items-center gap-2 text-sm text-accent font-semibold">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              ✓
                            </motion.div>
                            <span>Đã chọn</span>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          <AnimatePresence>
            {draft.event_type && draft.event_type !== "none" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="event_details" className="font-medium">
                      Chi Tiết Sự Kiện
                    </Label>
                    <Textarea
                      id="event_details"
                      value={draft.event_details || ""}
                      onChange={(e) =>
                        updateDraft({ event_details: e.target.value })
                      }
                      placeholder="Mô tả thêm về sự kiện của bạn..."
                      rows={3}
                      className="border-accent/20 focus:border-accent resize-none transition-all duration-200"
                    />
                  </motion.div>

                  {selectedEvent.extraServices.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label className="font-medium">Dịch Vụ Bổ Sung</Label>
                      <motion.div
                        variants={containerVariants}
                        className="grid md:grid-cols-2 gap-3"
                      >
                        {selectedEvent.extraServices.map((service, idx) => (
                          <motion.div
                            key={service}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:border-accent/50"
                            onClick={() => toggleService(service)}
                          >
                            <Checkbox
                              checked={
                                draft.selected_services?.includes(service) ||
                                false
                              }
                              onCheckedChange={() => toggleService(service)}
                            />
                            <Label className="cursor-pointer flex-1">
                              {service}
                            </Label>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
