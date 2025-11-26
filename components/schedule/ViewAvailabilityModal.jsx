"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ViewAvailabilityModal({
  availability: initialAvailability,
  existingAppointments = [],
  onSelect,
  isOpen,
  onOpenChange
}) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availability, setAvailability] = useState(initialAvailability || []);
  const [loading, setLoading] = useState(!initialAvailability);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // ----------------------------
  // FETCH AVAILABILITY
  // ----------------------------
  useEffect(() => {
    async function loadAvailability() {
      if (isOpen && !initialAvailability) {
        if (!fetched) {
          setLoading(true);
          setError(null);

          try {
            const response = await fetch("/api/user/availability");
            if (!response.ok) {
              throw new Error("Failed to fetch availability");
            }

            const data = await response.json();
            setAvailability(data);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
            setFetched(true);
          }
        }
      } else if (initialAvailability) {
        setAvailability(initialAvailability);
        setFetched(true);
        setLoading(false);
      }

      if (!isOpen) {
        setCurrentDate(new Date());
      }
    }

    loadAvailability();
  }, [isOpen, initialAvailability, fetched]);

  // ----------------------------
  // WEEK RANGE
  // ----------------------------
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [currentDate]);

  const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);

  // ----------------------------
  // GENERATE AVAILABLE SLOTS
  // ----------------------------
  const availableSlots = useMemo(() => {
    if (!availability || !Array.isArray(availability)) return [];

    const slots = [];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);

      const dayName = days[date.getDay()];

      const dayData = availability.find((a) => a.day === dayName);
      if (!dayData) continue;

      const [startStr, endStr] = dayData.time.split(" - ");
      const [startHour, startMin] = startStr.split(":").map(Number);
      const [endHour, endMin] = endStr.split(":").map(Number);

      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMin);
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMin);

      for (let time = start; time < end; time = new Date(time.getTime() + 30 * 60000)) {
        if (time > now) {
          slots.push(new Date(time));
        }
      }
    }

    // Remove booked
    const bookedTimes = new Set(
      existingAppointments.map((appt) => {
        const d = new Date(appt.appointment_date);
        const [h, m] = appt.appointment_time.split(":");
        d.setHours(h, m, 0, 0);
        return d.getTime();
      })
    );

    return slots.filter((s) => !bookedTimes.has(s.getTime()));
  }, [availability, startOfWeek, existingAppointments]);

  const goPrevWeek = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  const goNextWeek = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));

  const handleSelectSlot = (slot) => setSelectedSlot(slot);

  const handleConfirm = () => {
    if (selectedSlot && onSelect) {
      const startTime = selectedSlot.toTimeString().substring(0, 5);

      onSelect({
        date: selectedSlot.toISOString().split("T")[0],
        time: startTime,
        appointment_date: selectedSlot,
        appointment_time: startTime,
      });

      setSelectedSlot(null);
      onOpenChange(false);
    }
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
          <DialogTitle>Select a Time Slot</DialogTitle>
          <DialogDescription>Choose a date and time to book an appointment.</DialogDescription>
        </DialogHeader>

        {/* Week Selector */}
        <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
          <Button variant="outline" size="icon" onClick={goPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="font-medium">
            {startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}
          </div>

          <Button variant="outline" size="icon" onClick={goNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* No Slots */}
        {!loading && availableSlots.length === 0 && (
          <p className="text-center text-muted-foreground py-6">No available slots this week.</p>
        )}

        {/* Slots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {availableSlots.map((slot) => (
            <button
              key={slot.getTime()}
              onClick={() => handleSelectSlot(slot)}
              className={cn(
                "border p-2 rounded-lg text-center text-sm hover:bg-primary/10",
                selectedSlot?.getTime() === slot.getTime() && "bg-primary/20 border-primary"
              )}
            >
              <div>{slot.toDateString()}</div>
              <div className="font-semibold">{slot.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </button>
          ))}
        </div>

        {/* Confirm Button */}
        <Button className="w-full mt-4" disabled={!selectedSlot} onClick={handleConfirm}>
          Confirm Slot
        </Button>
      </DialogContent>
    </Dialog>
  );
}
