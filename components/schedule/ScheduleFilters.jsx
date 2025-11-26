'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ScheduleFilters({ selectedDate, onDateChange, onFilterChange }) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterLabel, setFilterLabel] = useState('Today');

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleToday = () => {
    onDateChange(todayStr);
    onFilterChange({ type: 'day', start: todayStr, end: todayStr });
    setFilterLabel('Today');
  };

  const handleThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek); // Go to Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

    const start = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    const end = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;
    
    onDateChange(start);
    onFilterChange({ type: 'week', start, end });
    setFilterLabel('This Week');
  };

  const handleThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
    const end = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
    
    onDateChange(start);
    onFilterChange({ type: 'month', start, end });
    setFilterLabel('This Month');
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      onDateChange(customStart);
      onFilterChange({ type: 'custom', start: customStart, end: customEnd });
      setFilterLabel(`${customStart} to ${customEnd}`);
      setIsCustomOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default" className="gap-2">
              <Calendar className="h-4 w-4" />
              {filterLabel}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleToday}>
              <Calendar className="mr-2 h-4 w-4" />
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleThisWeek}>
              <Calendar className="mr-2 h-4 w-4" />
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleThisMonth}>
              <Calendar className="mr-2 h-4 w-4" />
              This Month
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsCustomOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Custom Range...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          type="date"
          className="border border-input rounded px-2 py-2 text-sm bg-background text-foreground dark:bg-gray-800 dark:border-gray-700"
          value={selectedDate}
          onChange={(e) => {
            onDateChange(e.target.value);
            onFilterChange({ type: 'day', start: e.target.value, end: e.target.value });
            setFilterLabel(e.target.value);
          }}
        />
      </div>

      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="dark:text-gray-300">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="dark:text-gray-300">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={customEnd}
                min={customStart}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomRange} disabled={!customStart || !customEnd}>
              Apply Range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
