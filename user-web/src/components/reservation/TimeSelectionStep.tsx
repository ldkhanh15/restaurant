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
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-accent" />
            Chọn Thời Gian
          </CardTitle>
          <CardDescription>Chọn ngày và giờ bạn muốn đặt bàn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Ngày *
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-accent/20 hover:border-accent",
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
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 z-[100]"
                align="start"
                side="bottom"
                sideOffset={8}
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
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Giờ *
            </Label>
            <Select
              value={draft.time}
              onValueChange={(time) => updateDraft({ time })}
            >
              <SelectTrigger className="border-accent/20 focus:border-accent">
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
          </div>

          {draft.date && draft.time && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-accent/10 rounded-lg border border-accent/20"
            >
              <p className="text-sm font-medium text-accent mb-1">Đã chọn:</p>
              <p className="font-semibold">
                {format(
                  draft.date instanceof Date
                    ? draft.date
                    : new Date(draft.date),
                  "EEEE, dd MMMM yyyy",
                  { locale: vi }
                )}{" "}
                lúc {draft.time}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
