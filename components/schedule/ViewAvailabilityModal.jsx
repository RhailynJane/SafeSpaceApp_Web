"use client";

import { useState, useMemo, useEffect } from "react";
<<<<<<< HEAD
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
=======
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils";

export default function ViewAvailabilityModal({ availability: initialAvailability, onSelect, isOpen, onOpenChange }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availability, setAvailability] = useState(initialAvailability || []);
  const [loading, setLoading] = useState(!initialAvailability);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (isOpen && !initialAvailability) {
      const fetchAvailability = async () => {
        setLoading(true);
        setFetched(false);
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
          setFetched(true);
        }
      };
      fetchAvailability();
    } else if (initialAvailability) {
      setAvailability(initialAvailability);
      setFetched(true);
    }
  }, [isOpen, initialAvailability]);
>>>>>>> c77dddc71877fa8f11603eed2728418555f27a7a

  // Generate upcoming slots for the current week
  const upcomingSlots = useMemo(() => {
    const slots = [];
<<<<<<< HEAD
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
=======
    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
      
      const dayName = daysOfWeek[date.getUTCDay()];
      const dayAvailability = availability.find(a => a.day_of_week === dayName);

      if (dayAvailability) {
        const startTime = new Date(dayAvailability.start_time);
        const endTime = new Date(dayAvailability.end_time);
        const startHour = startTime.getUTCHours();
        const endHour = endTime.getUTCHours();

        for (let h = startHour; h < endHour; h++) {
          for (let m = 0; m < 60; m += 30) {
            const slotDate = new Date(date);
            slotDate.setUTCHours(h, m, 0, 0);

            if (slotDate.getTime() > now.getTime()) {
              slots.push(slotDate);
            }
>>>>>>> c77dddc71877fa8f11603eed2728418555f27a7a
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
<<<<<<< HEAD
    if (!selectedSlot || !onSelect) return;
    const startTimeStr = selectedSlot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const endTimeStr = new Date(selectedSlot.getTime() + 30*60*1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    onSelect({
      date: selectedSlot.toISOString().split('T')[0],
      displayTime: `${startTimeStr} - ${endTimeStr}`
=======
    if (selectedSlot && onSelect) {
      const startTime = selectedSlot.toTimeString().substring(0, 5);
      const endTime = new Date(selectedSlot.getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5);
      onSelect({
        date: selectedSlot.toISOString().split("T")[0],
        time: startTime,
        displayTime: `${selectedSlot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(selectedSlot.getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      });
      setSelectedSlot(null);
      onOpenChange(false);
    }
  };

  const handleSaveAvailability = async () => {
    setIsSaving(true);
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editableAvailability.filter(a => a.time)),
>>>>>>> c77dddc71877fa8f11603eed2728418555f27a7a
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
<<<<<<< HEAD

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
=======
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
              {fetched && upcomingSlots.length === 0 && (
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
>>>>>>> c77dddc71877fa8f11603eed2728418555f27a7a
      </DialogContent>
    </Dialog>
  );
}
