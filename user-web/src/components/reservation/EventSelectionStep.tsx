"use client";

import { motion } from "framer-motion";
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
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            Chọn Sự Kiện (Tùy chọn)
          </CardTitle>
          <CardDescription>
            Nếu bạn có sự kiện đặc biệt, hãy cho chúng tôi biết
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {eventTypes.map((eventType) => {
              const IconComponent = eventType.icon;
              const isSelected = draft.event_type === eventType.id;

              return (
                <motion.div
                  key={eventType.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      isSelected
                        ? "border-accent ring-2 ring-accent/20 bg-accent/5"
                        : "border-border hover:border-accent/50"
                    )}
                    onClick={() => handleEventSelect(eventType.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-white",
                            eventType.color
                          )}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{eventType.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {eventType.description}
                          </p>
                        </div>
                      </div>
                      {eventType.additionalCost > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Phụ phí:
                          </span>
                          <Badge variant="secondary">
                            {eventType.additionalCost.toLocaleString("vi-VN")}đ
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {draft.event_type && draft.event_type !== "none" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="event_details">Chi Tiết Sự Kiện</Label>
                <Textarea
                  id="event_details"
                  value={draft.event_details || ""}
                  onChange={(e) =>
                    updateDraft({ event_details: e.target.value })
                  }
                  placeholder="Mô tả thêm về sự kiện của bạn..."
                  rows={3}
                  className="border-accent/20 focus:border-accent resize-none"
                />
              </div>

              {selectedEvent.extraServices.length > 0 && (
                <div className="space-y-2">
                  <Label>Dịch Vụ Bổ Sung</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedEvent.extraServices.map((service) => (
                      <div
                        key={service}
                        className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleService(service)}
                      >
                        <Checkbox
                          checked={
                            draft.selected_services?.includes(service) || false
                          }
                          onCheckedChange={() => toggleService(service)}
                        />
                        <Label className="cursor-pointer flex-1">
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
