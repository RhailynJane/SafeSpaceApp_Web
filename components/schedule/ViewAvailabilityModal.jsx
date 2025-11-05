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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Edit, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ViewAvailabilityModal({ availability = [], onSelect, isOpen, onOpenChange, onSaveSuccess }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableAvailability, setEditableAvailability] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const availabilityMap = new Map(availability.map(a => [a.day, a.time]));
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const fullSchedule = allDays.map(day => ({ day, time: availabilityMap.get(day) || '' }));
      setEditableAvailability(fullSchedule);
    } else {
      setIsEditing(false);
    }
  }, [isOpen, availability]);

  const upcomingSlots = useMemo(() => {
    const slots = [];
    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = daysOfWeek[date.getDay()];
      const dayAvailability = editableAvailability.find(a => a.day === dayName);

      if (dayAvailability && dayAvailability.time) {
        const [startTimeStr, endTimeStr] = dayAvailability.time.split(' - ');

        const parseTime = (timeStr) => {
          if (!timeStr) return null; // Add this safety check
          const match = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
          if (!match) return null;
          let [_, hour, minute, meridiem] = match;
          hour = parseInt(hour, 10);
          if (meridiem.toUpperCase() === 'PM' && hour !== 12) hour += 12;
          if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
          return hour;
        };

        const startHour = parseTime(startTimeStr);
        const endHour = parseTime(endTimeStr);

        if (startHour === null || endHour === null) continue;

        for (let h = startHour; h < endHour; h++) {
          const slotDate = new Date(date);
          slotDate.setHours(h, 0, 0, 0);
          if (slotDate > new Date()) { // Only show future slots
            slots.push(slotDate);
          }
        }
      }
    }
    return slots;
  }, [editableAvailability]);

  const handleSelectSlot = (slot) => setSelectedSlot(slot);

  const handleConfirm = () => {
    if (selectedSlot && onSelect) {
      const startTime = selectedSlot.toTimeString().substring(0, 5);
      const endTime = new Date(selectedSlot.getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5);
      onSelect({
        date: selectedSlot.toISOString().split("T")[0],
        time: startTime,
        displayTime: `${selectedSlot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(selectedSlot.getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      });
      setSelectedSlot(null);
    }
  };

  const handleSaveAvailability = async () => {
    setIsSaving(true);
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editableAvailability.filter(a => a.time)),
    });

    if (res.ok) {
      alert('Availability saved!');
      // Instead of waiting for the parent to refetch, we can just tell it to.
      // The UI will update instantly because `editableAvailability` is already correct.
      if (onSaveSuccess) onSaveSuccess(); 
      setIsEditing(false);
    } else {
      alert('Failed to save availability.');
    }
    setIsSaving(false);
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
          <DialogTitle>{isEditing ? "Edit My Availability" : "Select a Time Slot"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Set your weekly working hours." : "Choose an available slot below to book an appointment."}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {editableAvailability.map(({ day, time }) => (
              <div key={day} className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">{day}</Label>
                <Input
                  className="col-span-2"
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  value={time}
                  onChange={(e) => {
                    setEditableAvailability(prev =>
                      prev.map(a => a.day === day ? { ...a, time: e.target.value } : a)
                    );
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {upcomingSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={selectedSlot?.getTime() === slot.getTime() ? "default" : "outline"}
                  className={cn("h-auto flex-col py-2", selectedSlot?.getTime() === slot.getTime() && "bg-teal-600 hover:bg-teal-700")}
                  onClick={() => handleSelectSlot(slot)}
                >
                  <div className="font-semibold">{slot.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                  <div className="text-sm">{`${slot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(slot.getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}</div>
                </Button>
              ))}
            </div>
            {upcomingSlots.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <h3 className="font-semibold text-lg mb-4">No upcoming slots found.</h3>
                <p className="text-sm mb-2">Click "Edit Schedule" to set your weekly availability.</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-shrink-0 mt-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveAvailability} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Availability
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="mr-auto" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Schedule
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedSlot} className="bg-teal-600 hover:bg-teal-700">
                Confirm Slot
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
