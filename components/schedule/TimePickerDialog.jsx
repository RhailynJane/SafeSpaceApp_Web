'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * TimePickerDialog Component
 * A custom time picker with 1-hour increment slots, similar to mobile implementation
 */
export default function TimePickerDialog({
  open,
  onOpenChange,
  value = '09:00',
  onSelect,
}) {
  const [selectedTime, setSelectedTime] = useState(value);

  useEffect(() => {
    if (open && value) {
      setSelectedTime(value);
    }
  }, [open, value]);

  // Generate time slots for every hour (09:00 to 20:00)
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 9 + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    onSelect(time);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">Select Time</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6">
          {/* Time slots grid - 4 columns */}
          <div className="grid grid-cols-4 gap-3 w-full">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`h-12 rounded-lg font-semibold text-sm transition-all ${
                  selectedTime === time
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {time.split(':')[0]}
                <span className="text-xs opacity-75 ml-1">
                  {time.split(':')[1]}
                </span>
              </button>
            ))}
          </div>

          {/* Display selected time */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Selected: <span className="font-semibold text-gray-900 dark:text-white">{selectedTime}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

