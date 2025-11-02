"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ViewAvailabilityModal({ onSelect, isOpen, onOpenChange }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Generate all upcoming days + hourly slots
  const upcomingSlots = useMemo(() => {
    const slots = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Generate hourly slots 9AM - 5PM
      for (let hour = 9; hour < 17; hour++) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, 0, 0, 0);
        slots.push(slotDate);
      }
    }

    return slots;
  }, []);

  const handleSelectSlot = (slot) => setSelectedSlot(slot);

  const handleConfirm = () => {
    if (selectedSlot && onSelect) {
      onSelect({
        date: selectedSlot.toISOString().split("T")[0],
        time: selectedSlot.toTimeString().substring(0, 5),
      });
      setSelectedSlot(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          View Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select a Time Slot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {upcomingSlots.map((slot, index) => (
              <Button
                key={index}
                variant={selectedSlot?.getTime() === slot.getTime() ? "default" : "outline"}
                className={cn(
                  "h-auto flex-col py-2",
                  selectedSlot?.getTime() === slot.getTime() &&
                    "bg-teal-600 hover:bg-teal-700"
                )}
                onClick={() => handleSelectSlot(slot)}
              >
                <div className="font-semibold">
                  {slot.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric"
                  })}
                </div>
                <div className="text-sm">
                  {slot.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </Button>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!selectedSlot}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Confirm Slot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
