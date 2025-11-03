"use client";

import { useState } from "react";
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
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useReservationStore } from "@/store/reservationStore";
import { cn } from "@/lib/utils";
import {
  slideInRight,
  containerVariants,
  itemVariants,
  scaleInVariants,
} from "@/lib/motion-variants";

const timeSlots = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

export default function TimeSelectionStep() {
  const { draft, updateDraft } = useReservationStore();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Disable past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
              </Label>
              <Select
                value={draft.time}
                onValueChange={(time) => updateDraft({ time })}
              >
                <SelectTrigger className="border-accent/20 focus:border-accent transition-all duration-200">
                  <SelectValue placeholder="Chọn giờ" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
