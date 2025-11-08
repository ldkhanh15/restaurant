"use client";

import { useState, useEffect } from "react";
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
import {
  PartyPopper,
  Heart,
  Sparkles,
  Gift,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import { cn } from "@/lib/utils";
import { eventService, type Event } from "@/services/eventService";
import { toast } from "@/hooks/use-toast";
import {
  slideInRight,
  containerVariants,
  itemVariants,
  cardVariants,
  viewportOptions,
} from "@/lib/motion-variants";

// Icon mapping for events
const eventIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  birthday: PartyPopper,
  anniversary: Heart,
  celebration: Sparkles,
  default: Gift,
};

const eventColors: Record<string, string> = {
  birthday: "bg-pink-500",
  anniversary: "bg-red-500",
  celebration: "bg-purple-500",
  default: "bg-gray-500",
};

const parseServices = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string") as string[];
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
};

const formatDateRange = (start?: string, end?: string) => {
  if (!start && !end) return "";
  try {
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    const formatter = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    if (startDate && endDate) {
      const startLabel = formatter.format(startDate);
      const endLabel = formatter.format(endDate);
      return startLabel === endLabel
        ? startLabel
        : `${startLabel} - ${endLabel}`;
    }

    if (startDate) return formatter.format(startDate);
    if (endDate) return formatter.format(endDate);
  } catch (error) {
    console.error("Failed to format event date range", error);
  }
  return "";
};

export default function EventSelectionStep() {
  const { draft, updateDraft } = useReservationStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await eventService.getActive();
        const eventsData = Array.isArray(response.data) ? response.data : [];
        setEvents(eventsData);
      } catch (err: any) {
        console.error("Failed to load events:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Không thể tải danh sách sự kiện"
        );
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách sự kiện",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Add "none" option
  const allEventOptions = [
    ...events.map((event) => {
      const inclusions = parseServices((event as any)?.inclusions);
      const decorations = parseServices((event as any)?.decorations);
      const extraServices = Array.from(
        new Set([...inclusions, ...decorations])
      );
      const iconKey = event.name.toLowerCase();
      return {
        id: event.id,
        name: event.name,
        description: event.description || "",
        icon: eventIcons[iconKey] || eventIcons.default,
        color: eventColors[iconKey] || eventColors.default,
        additionalCost: event.fee || 0,
        extraServices,
        dateRange: formatDateRange(event.start_date, event.end_date),
      };
    }),
    {
      id: "none",
      name: "Không có",
      description: "Bữa ăn thông thường",
      icon: Gift,
      color: "bg-gray-500",
      additionalCost: 0,
      extraServices: [] as string[],
      dateRange: "",
    },
  ];

  const selectedEvent =
    allEventOptions.find(
      (e) => e.id === draft.event_id || e.id === draft.event_type
    ) || allEventOptions[allEventOptions.length - 1];

  const handleEventSelect = (eventId: string) => {
    if (eventId === "none") {
      updateDraft({
        event_id: null,
        event_type: null,
        event_details: null,
        selected_services: [],
      });
    } else {
      const event = events.find((e) => e.id === eventId);
      updateDraft({
        event_id: eventId,
        event_type: eventId, // Keep for backward compatibility
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-sm text-muted-foreground">
                Bạn có thể bỏ qua bước này và tiếp tục
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 gap-4"
            >
              {events.length === 0 && (
                <div className="md:col-span-2 text-sm text-muted-foreground bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg p-4">
                  Hiện chưa có sự kiện đặc biệt nào được mở. Bạn vẫn có thể tiếp
                  tục đặt bàn như bình thường.
                </div>
              )}
              {allEventOptions.map((eventType, index) => {
                const IconComponent = eventType.icon;
                const isSelected =
                  draft.event_id === eventType.id ||
                  draft.event_type === eventType.id;

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
                              {eventType.additionalCost.toLocaleString("vi-VN")}
                              đ
                            </Badge>
                          </motion.div>
                        )}
                        {eventType.dateRange && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            <span>{eventType.dateRange}</span>
                          </div>
                        )}
                        {eventType.extraServices.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {eventType.extraServices
                              .slice(0, 3)
                              .map((service) => (
                                <Badge
                                  key={`${eventType.id}-service-${service}`}
                                  variant="outline"
                                  className="text-xs border-accent/20"
                                >
                                  {service}
                                </Badge>
                              ))}
                            {eventType.extraServices.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs border-dashed border-accent/20"
                              >
                                +{eventType.extraServices.length - 3}
                              </Badge>
                            )}
                          </div>
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
          )}

          <AnimatePresence>
            {(draft.event_id ||
              (draft.event_type && draft.event_type !== "none")) && (
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
