"use client"

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils";

export default function ViewAvailabilityModal({ availability: initialAvailability, onSelect, isOpen, onOpenChange }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availability, setAvailability] = useState(initialAvailability || []);
  const [loading, setLoading] = useState(!initialAvailability);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !initialAvailability) {
      const fetchAvailability = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/user/availability');
          if (!response.ok) {
            throw new Error('Failed to fetch availability');
          }
          const data = await response.json();
          setAvailability(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAvailability();
    } else if (initialAvailability) {
      setAvailability(initialAvailability);
    }
  }, [isOpen, initialAvailability]);

  const upcomingSlots = useMemo(() => {
    const slots = [];
    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = daysOfWeek[date.getDay()];
      const dayAvailability = availability.find(a => a.day_of_week === dayName);

      if (dayAvailability) {
        const startTime = new Date(dayAvailability.start_time);
        const endTime = new Date(dayAvailability.end_time);

        const startHour = startTime.getUTCHours();
        const startMinute = startTime.getUTCMinutes();
        const endHour = endTime.getUTCHours();
        const endMinute = endTime.getUTCMinutes();

        for (let h = startHour; h < endHour; h++) {
          for (let m = (h === startHour ? startMinute : 0); m < 60; m += 30) {
            if (h === endHour && m >= endMinute) {
              break;
            }
            const slotDate = new Date(date);
            slotDate.setHours(h, m, 0, 0);
            if (slotDate > new Date()) {
              slots.push(slotDate);
            }
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
      setSelectedSlot(null);
      onOpenChange(false);
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
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : (
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
          )}
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