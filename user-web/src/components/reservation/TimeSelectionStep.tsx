"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useReservationStore } from "@/store/reservationStore";
import { cn } from "@/lib/utils";
import { tableService } from "@/services/tableService";
import {
  slideInRight,
  containerVariants,
  itemVariants,
  scaleInVariants,
} from "@/lib/motion-variants";

const defaultTimeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
];

export default function TimeSelectionStep() {
  const { draft, updateDraft } = useReservationStore();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState<string | null>(
    null
  );

  // Disable past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  // Load available time slots if table and date are selected
  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      if (draft.selected_table_id && draft.date) {
        setIsLoadingSlots(true);
        try {
          const dateStr =
            draft.date instanceof Date
              ? draft.date.toISOString().split("T")[0]
              : new Date(draft.date).toISOString().split("T")[0];
          const response = await tableService.getAvailableTimeSlots(
            draft.selected_table_id,
            {
              date: dateStr,
              duration_minutes: draft.duration_minutes || 60,
            }
          );
          const slots = response.data?.available_time_slots || [];
          setAvailableTimeSlots(slots.map((slot) => slot.start));
        } catch (error) {
          console.error("Failed to load available time slots:", error);
          setAvailableTimeSlots([]);
        } finally {
          setIsLoadingSlots(false);
        }
      } else {
        setAvailableTimeSlots([]);
      }
    };

    loadAvailableTimeSlots();
  }, [draft.selected_table_id, draft.date, draft.duration_minutes]);

  // Validate selected time
  useEffect(() => {
    if (draft.date && draft.time) {
      const selectedDate =
        draft.date instanceof Date ? draft.date : new Date(draft.date);
      const [hours, minutes] = draft.time.split(":").map(Number);
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(hours, minutes, 0, 0);

      // Check if time is in the past
      if (selectedDateTime < now) {
        setTimeValidationError("Không thể chọn thời gian trong quá khứ");
        return;
      }

      // Check if time slot is available (if table is selected)
      if (draft.selected_table_id && availableTimeSlots.length > 0) {
        if (!availableTimeSlots.includes(draft.time)) {
          setTimeValidationError(
            "Thời gian này đã được đặt. Vui lòng chọn thời gian khác."
          );
          return;
        }
      }

      setTimeValidationError(null);
    } else {
      setTimeValidationError(null);
    }
  }, [
    draft.date,
    draft.time,
    draft.selected_table_id,
    availableTimeSlots,
    now,
  ]);

  // Get time slots to display
  const timeSlotsToShow = useMemo(() => {
    if (draft.selected_table_id && availableTimeSlots.length > 0) {
      return availableTimeSlots;
    }
    return defaultTimeSlots;
  }, [draft.selected_table_id, availableTimeSlots]);

  // Filter out past times for today
  const filteredTimeSlots = useMemo(() => {
    if (!draft.date) return timeSlotsToShow;

    const selectedDate =
      draft.date instanceof Date ? draft.date : new Date(draft.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (!isToday) return timeSlotsToShow;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    return timeSlotsToShow.filter((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const timeMinutes = hours * 60 + minutes;
      return timeMinutes > currentTimeMinutes;
    });
  }, [timeSlotsToShow, draft.date, now]);

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
                <CalendarIcon className="h-6 w-6 text-accent" />
              </motion.div>
              Chọn Thời Gian
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Chọn ngày và giờ bạn muốn đặt bàn
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="date"
                className="flex items-center gap-2 font-medium"
              >
                <CalendarIcon className="h-4 w-4 text-accent" />
                Ngày *
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-accent/20 hover:border-accent transition-all duration-200",
                        !draft.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {draft.date ? (
                        format(
                          draft.date instanceof Date
                            ? draft.date
                            : new Date(draft.date),
                          "EEEE, dd MMMM yyyy",
                          {
                            locale: vi,
                          }
                        )
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                    </Button>
                  </motion.div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 z-[100]"
                  align="start"
                  side="bottom"
                  sideOffset={8}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Calendar
                      mode="single"
                      selected={
                        draft.date instanceof Date
                          ? draft.date
                          : draft.date
                          ? new Date(draft.date)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          updateDraft({ date: date });
                          setCalendarOpen(false);
                        } else {
                          updateDraft({ date: null });
                        }
                      }}
                      disabled={(date) => date < today}
                      initialFocus
                      locale={vi}
                    />
                  </motion.div>
                </PopoverContent>
              </Popover>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="time"
                className="flex items-center gap-2 font-medium"
              >
                <Clock className="h-4 w-4 text-accent" />
                Giờ *
                {isLoadingSlots && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Đang tải...)
                  </span>
                )}
              </Label>
              <Select
                value={draft.time}
                onValueChange={(time) => {
                  updateDraft({ time });
                  setTimeValidationError(null);
                }}
                disabled={!draft.date}
              >
                <SelectTrigger className="border-accent/20 focus:border-accent transition-all duration-200">
                  <SelectValue
                    placeholder={draft.date ? "Chọn giờ" : "Chọn ngày trước"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredTimeSlots.length > 0 ? (
                    filteredTimeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      Không có giờ khả dụng
                    </div>
                  )}
                </SelectContent>
              </Select>
              {timeValidationError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{timeValidationError}</AlertDescription>
                </Alert>
              )}
              {draft.selected_table_id &&
                availableTimeSlots.length === 0 &&
                draft.date &&
                !isLoadingSlots && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Bàn này không còn thời gian khả dụng cho ngày đã chọn. Vui
                      lòng chọn ngày khác hoặc bàn khác.
                    </AlertDescription>
                  </Alert>
                )}
            </motion.div>
          </motion.div>

          {draft.date && draft.time && (
            <motion.div
              variants={scaleInVariants}
              initial="hidden"
              animate="visible"
              className="p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border-2 border-accent/20"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-medium text-accent mb-1"
              >
                ✓ Đã chọn:
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="font-semibold text-lg"
              >
                {format(
                  draft.date instanceof Date
                    ? draft.date
                    : new Date(draft.date),
                  "EEEE, dd MMMM yyyy",
                  { locale: vi }
                )}{" "}
                lúc {draft.time}
              </motion.p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
