"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ViewAvailabilityModal({ availability = [], onSelect, isOpen, onOpenChange }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Prepare full weekly availability based on backend data
  const editableAvailability = useMemo(() => {
    const availabilityMap = new Map(availability.map(a => [a.day, a.time]));
    const allDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return allDays.map(day => ({
      day,
      time: availabilityMap.get(day) || null
    }));
  }, [availability]);

  // Generate upcoming slots for the current week
  const upcomingSlots = useMemo(() => {
    const slots = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

    const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const dayName = daysOfWeek[date.getDay()];
      const dayAvailability = editableAvailability.find(a => a.day === dayName);

      if (dayAvailability && dayAvailability.time) {
        const [startTimeStr, endTimeStr] = dayAvailability.time.split(' - ');

        const parseTime = (timeStr) => {
          if (!timeStr) return null;
          const [hourMin, meridiem] = timeStr.split(' ');
          const [hour, minute] = hourMin.split(':').map(Number);
          let h = hour;
          if (meridiem.toUpperCase() === 'PM' && hour !== 12) h += 12;
          if (meridiem.toUpperCase() === 'AM' && hour === 12) h = 0;
          return { hour: h, minute };
        };

        const start = parseTime(startTimeStr);
        const end = parseTime(endTimeStr);

        if (!start || !end) continue;

        const slotDate = new Date(date);
        slotDate.setHours(start.hour, start.minute, 0, 0);

        while (slotDate.getHours() < end.hour || (slotDate.getHours() === end.hour && slotDate.getMinutes() < end.minute)) {
          if (slotDate > new Date()) {
            slots.push(new Date(slotDate));
          }
          slotDate.setMinutes(slotDate.getMinutes() + 30); // 30 min slots
        }
      }
    }

    return slots.sort((a,b) => a-b);
  }, [editableAvailability, currentDate]);

  const goPrevWeek = () => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() - 7)));
  const goNextWeek = () => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() + 7)));

  const handleSelectSlot = (slot) => setSelectedSlot(slot);

  const handleConfirm = () => {
    if (!selectedSlot || !onSelect) return;
    const startTimeStr = selectedSlot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const endTimeStr = new Date(selectedSlot.getTime() + 30*60*1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    onSelect({
      date: selectedSlot.toISOString().split('T')[0],
      displayTime: `${startTimeStr} - ${endTimeStr}`
    });
    setSelectedSlot(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Clock className="h-4 w-4 mr-2" /> View Availability
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Available Slots</DialogTitle>
          <DialogDescription>Choose a date and time to book an appointment.</DialogDescription>
        </DialogHeader>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={goPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {(() => {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            return (
              <div className="font-medium text-center">
                {startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}
              </div>
            );
          })()}

          <Button variant="outline" size="icon" onClick={goNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Slots Grid */}
        {upcomingSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No available slots this week.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {upcomingSlots.map((slot, index) => (
              <Button
                key={index}
                variant={selectedSlot?.getTime() === slot.getTime() ? "default" : "outline"}
                className={cn("flex-col py-2 h-auto", selectedSlot?.getTime() === slot.getTime() && "bg-teal-600 hover:bg-teal-700")}
                onClick={() => handleSelectSlot(slot)}
              >
                <div className="font-semibold">{slot.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div className="text-sm">{slot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(slot.getTime() + 30*60*1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
              </Button>
            ))}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleConfirm}
            disabled={!selectedSlot}
          >
            Confirm Slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
