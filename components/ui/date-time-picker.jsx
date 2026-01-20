"use client";
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateTimePicker({ date, setDate, label }) {
  const [selectedDateTime, setSelectedDateTime] = React.useState(date);

  // Sync internal state if prop changes
  React.useEffect(() => {
    if (date) setSelectedDateTime(date);
  }, [date]);

  const handleSelect = (day) => {
    if (!day) return;
    const newDate = new Date(day);
    // Preserve existing time or set default
    if (selectedDateTime) {
      newDate.setHours(selectedDateTime.getHours());
      newDate.setMinutes(selectedDateTime.getMinutes());
    } else {
      newDate.setHours(12);
      newDate.setMinutes(0);
    }
    setSelectedDateTime(newDate);
    setDate(newDate);
  };

  const handleTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!selectedDateTime || !timeStr) return;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date(selectedDateTime);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    
    setSelectedDateTime(newDate);
    setDate(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-zinc-900 border-white/10 hover:bg-zinc-800 hover:text-white rounded-none h-12",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP HH:mm") : <span>{label || "Pick date"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-black border border-white/10 rounded-none shadow-2xl">
        <Calendar
          mode="single"
          selected={selectedDateTime}
          onSelect={handleSelect}
          initialFocus
          className="rounded-none border-b border-white/10"
        />
        <div className="p-4 border-t border-white/10 bg-zinc-900/30">
            <Label className="text-xs font-mono text-zinc-500 mb-2 block uppercase">Time</Label>
            <Input
                type="time"
                value={selectedDateTime ? format(selectedDateTime, "HH:mm") : ""}
                onChange={handleTimeChange}
                className="bg-black border-white/10 text-white font-mono h-9"
            />
        </div>
      </PopoverContent>
    </Popover>
  );
}