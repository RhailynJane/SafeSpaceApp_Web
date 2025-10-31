"use client"

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils";

export default function ViewAvailabilityModal({ availability, onSelect, isOpen, onOpenChange }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  const upcomingSlots = useMemo(() => {
    const slots = [];
    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = daysOfWeek[date.getDay()];
      const dayAvailability = (availability || []).find(a => a.day === dayName);

      if (dayAvailability) {
        const [startTimeStr, endTimeStr] = dayAvailability.time.split(' - ');
        const [startHour, startMinute] = startTimeStr.match(/\d+/g).map(Number);
        const startMeridiem = startTimeStr.match(/AM|PM/)[0];
        let startHour24 = startHour;
        if (startMeridiem === 'PM' && startHour !== 12) startHour24 += 12;
        if (startMeridiem === 'AM' && startHour === 12) startHour24 = 0;

        const [endHour, endMinute] = endTimeStr.match(/\d+/g).map(Number);
        const endMeridiem = endTimeStr.match(/AM|PM/)[0];
        let endHour24 = endHour;
        if (endMeridiem === 'PM' && endHour !== 12) endHour24 += 12;
        if (endMeridiem === 'AM' && endHour === 12) endHour24 = 0;

        for (let h = startHour24; h < endHour24; h++) {
          const slotDate = new Date(date);
          slotDate.setHours(h, 0, 0, 0);
          // Only show slots in the future
          if (slotDate > new Date()) {
            slots.push(slotDate);
          }
        }
      }
    }
    return slots;
  }, [availability]);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (selectedSlot && onSelect) {
      onSelect({
        date: selectedSlot.toISOString().split('T')[0],
        time: selectedSlot.toTimeString().substring(0, 5)
      });
      setSelectedSlot(null); // Reset selection
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Clock className="h-4 w-4 mr-2" />View Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>My Availability</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {upcomingSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={selectedSlot?.getTime() === slot.getTime() ? "default" : "outline"}
                  className={cn("h-auto flex-col py-2", selectedSlot?.getTime() === slot.getTime() && "bg-teal-600 hover:bg-teal-700")}
                  onClick={() => handleSelectSlot(slot)}
                >
                  <div className="font-semibold">{slot.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div className="text-sm">{slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </Button>
              ))}
            </div>
            {upcomingSlots.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No available slots in the next 7 days.</p>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleConfirm} disabled={!selectedSlot} className="bg-teal-600 hover:bg-teal-700">
              Confirm Slot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}