'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock, Save } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/contexts/ToastContext';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function AvailabilitySettings({ clerkId }) {
  const toast = useToast();
  const updateAvailability = useMutation(api.users.updateAvailability);
  const user = useQuery(api.users.getByClerkId, { clerkId });

  const [availability, setAvailability] = useState(
    DAYS.map(day => ({
      day: day.key,
      startTime: '09:00',
      endTime: '17:00',
      enabled: day.key !== 'saturday' && day.key !== 'sunday', // Default: weekdays only
    }))
  );

  const [saving, setSaving] = useState(false);

  // Load user's existing availability
  useEffect(() => {
    if (user?.availability && Array.isArray(user.availability)) {
      setAvailability(user.availability);
    }
  }, [user]);

  const handleToggle = (dayKey) => {
    setAvailability(prev =>
      prev.map(slot =>
        slot.day === dayKey ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  const handleTimeChange = (dayKey, field, value) => {
    setAvailability(prev =>
      prev.map(slot =>
        slot.day === dayKey ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateAvailability({ clerkId, availability });
      toast.success('Availability updated successfully');
    } catch (error) {
      console.error('Failed to update availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground dark:text-gray-100">
          <Clock className="h-5 w-5" />
          Weekly Availability
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Set your available hours for each day of the week. These times will be used for scheduling appointments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map(({ key, label }) => {
          const slot = availability.find(s => s.day === key);
          if (!slot) return null;

          return (
            <div
              key={key}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                slot.enabled
                  ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3 w-40">
                <Switch
                  checked={slot.enabled}
                  onCheckedChange={() => handleToggle(key)}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label
                  htmlFor={`${key}-toggle`}
                  className={`font-medium cursor-pointer ${
                    slot.enabled
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-500'
                  }`}
                >
                  {label}
                </Label>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">From</Label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimeChange(key, 'startTime', e.target.value)}
                    disabled={!slot.enabled}
                    className="w-32 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <span className="text-gray-400">—</span>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">To</Label>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimeChange(key, 'endTime', e.target.value)}
                    disabled={!slot.enabled}
                    min={slot.startTime}
                    className="w-32 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t dark:border-gray-700">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
