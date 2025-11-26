"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock, User } from "lucide-react"

export default function ViewCalendarModal({ schedule = [] }) {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [viewFilter, setViewFilter] = useState("month") // "day", "week", "month"
  const [open, setOpen] = useState(false)

  // Debug: log all schedule data when modal opens
  if (open && schedule.length > 0) {
    console.log('All schedule data:', schedule);
  }

  // Get appointments for the current month with details
  const appointmentsForMonth = useMemo(() => {
    const result = schedule
      .map(appt => {
        if (!appt?.appointment_date && !appt?.appointmentDate) {
          console.log('Skipping appointment - no date:', appt);
          return null;
        }
        // Parse date as local date (YYYY-MM-DD)
        const dateStr = String(appt.appointment_date || appt.appointmentDate);
        console.log('Processing appointment date:', dateStr, 'Full appt:', appt);
        const datePart = dateStr.split('T')[0];
        const [yearStr, monthStr, dayStr] = datePart.split('-');
        const apptYear = parseInt(yearStr, 10);
        const apptMonth = parseInt(monthStr, 10) - 1; // 0-indexed
        const apptDay = parseInt(dayStr, 10);
        
        console.log('Parsed:', { year: apptYear, month: apptMonth, day: apptDay }, 'Looking for:', { year, month });
        
        return {
          ...appt,
          year: apptYear,
          month: apptMonth,
          day: apptDay,
        };
      })
      .filter(Boolean)
      .filter(appt => appt.year === year && appt.month === month);
    
    console.log('Filtered appointments for', month, year, ':', result);
    return result;
  }, [schedule, month, year]);

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  
  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getAppointmentsForDay = (day) => {
    if (!day) return [];
    return appointmentsForMonth.filter(appt => appt.day === day);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const goToToday = () => {
    const today = new Date()
    setMonth(today.getMonth())
    setYear(today.getFullYear())
  }

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  }

  // Get current week range
  const getCurrentWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push({
        date: day.getDate(),
        month: day.getMonth(),
        year: day.getFullYear()
      });
    }
    return weekDays;
  }

  // Filter appointments based on view
  const getFilteredAppointments = () => {
    if (viewFilter === "day") {
      return appointmentsForMonth.filter(appt => appt.day === selectedDay);
    } else if (viewFilter === "week") {
      const weekDays = getCurrentWeekDays();
      return schedule
        .map(appt => {
          if (!appt?.appointment_date && !appt?.appointmentDate) return null;
          const dateStr = String(appt.appointment_date || appt.appointmentDate);
          const datePart = dateStr.split('T')[0];
          const [yearStr, monthStr, dayStr] = datePart.split('-');
          return {
            ...appt,
            year: parseInt(yearStr, 10),
            month: parseInt(monthStr, 10) - 1,
            day: parseInt(dayStr, 10)
          };
        })
        .filter(Boolean)
        .filter(appt => 
          weekDays.some(wd => 
            wd.year === appt.year && wd.month === appt.month && wd.date === appt.day
          )
        );
    }
    return appointmentsForMonth;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="dark:border-gray-700 dark:text-gray-200">
          <Calendar className="h-4 w-4 mr-2" /> View Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold dark:text-gray-100">
            {monthNames[month]} {year}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            View all your scheduled appointments in calendar view
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 py-2 border-b dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousMonth}
              className="dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextMonth}
              className="dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
              className="dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="dark:border-gray-700 dark:hover:bg-gray-800">
                  <Filter className="h-4 w-4 mr-2" />
                  {viewFilter === "day" ? "Day" : viewFilter === "week" ? "Week" : "Month"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem 
                  onClick={() => setViewFilter("day")}
                  className="dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  Day
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setViewFilter("week")}
                  className="dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  Week
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setViewFilter("month")}
                  className="dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto">
          {viewFilter === "month" && (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border-b dark:border-gray-700">
                {dayNames.map((dayName) => (
                  <div
                    key={dayName}
                    className="bg-gray-50 dark:bg-gray-800 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
                {days.map((day, index) => {
                  const dayAppointments = getAppointmentsForDay(day);
                  const isTodayDay = isToday(day);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] bg-white dark:bg-gray-900 p-2 ${
                        day === null ? "bg-gray-50 dark:bg-gray-800/50" : ""
                      } ${isTodayDay ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}`}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-semibold mb-1 ${
                            isTodayDay 
                              ? "inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white" 
                              : "text-gray-900 dark:text-gray-100"
                          }`}>
                            {day}
                          </div>
                          
                          {/* Appointments for this day */}
                          <div className="space-y-1">
                            {dayAppointments.slice(0, 3).map((appt, idx) => {
                              const clientName = appt.client 
                                ? `${appt.client.client_first_name || ''} ${appt.client.client_last_name || ''}`.trim()
                                : 'Client';
                              const timeStr = appt.appointment_time || appt.appointmentTime || '';
                              
                              return (
                                <div
                                  key={idx}
                                  className="text-xs p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 border-l-2 border-blue-500 dark:border-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                                  title={`${timeStr} - ${clientName} (${appt.type})`}
                                >
                                  <div className="flex items-center gap-1 text-blue-900 dark:text-blue-300">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span className="font-medium truncate">
                                      {timeStr?.substring(0, 5) || 'Time'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-blue-800 dark:text-blue-400 mt-0.5">
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{clientName}</span>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {dayAppointments.length > 3 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 pl-1 font-medium">
                                +{dayAppointments.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {viewFilter === "week" && (
            <div className="space-y-2">
              {getCurrentWeekDays().map((weekDay, idx) => {
                const dayAppts = getFilteredAppointments().filter(
                  appt => appt.day === weekDay.date && appt.month === weekDay.month && appt.year === weekDay.year
                );
                const isCurrentDay = weekDay.date === selectedDay && weekDay.month === month && weekDay.year === year;
                
                return (
                  <div key={idx} className={`border dark:border-gray-800 rounded-lg p-4 ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}>
                    <div className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
                      {dayNames[idx]} - {monthNames[weekDay.month]} {weekDay.date}, {weekDay.year}
                    </div>
                    {dayAppts.length > 0 ? (
                      <div className="space-y-2">
                        {dayAppts.map((appt, apptIdx) => {
                          const clientName = appt.client 
                            ? `${appt.client.client_first_name || ''} ${appt.client.client_last_name || ''}`.trim()
                            : 'Client';
                          const timeStr = appt.appointment_time || appt.appointmentTime || '';
                          
                          return (
                            <div
                              key={apptIdx}
                              className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400"
                            >
                              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-medium">
                                <Clock className="h-4 w-4" />
                                {timeStr?.substring(0, 5)} - {appt.type}
                              </div>
                              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 mt-1">
                                <User className="h-4 w-4" />
                                {clientName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No appointments</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {viewFilter === "day" && (
            <div className="p-6">
              <div className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                {dayNames[new Date(year, month, selectedDay).getDay()]} - {monthNames[month]} {selectedDay}, {year}
              </div>
              {getFilteredAppointments().length > 0 ? (
                <div className="space-y-3">
                  {getFilteredAppointments().map((appt, idx) => {
                    const clientName = appt.client 
                      ? `${appt.client.client_first_name || ''} ${appt.client.client_last_name || ''}`.trim()
                      : 'Client';
                    const timeStr = appt.appointment_time || appt.appointmentTime || '';
                    
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400"
                      >
                        <div className="flex items-center gap-3 text-blue-900 dark:text-blue-300 font-semibold text-lg mb-2">
                          <Clock className="h-5 w-5" />
                          {timeStr?.substring(0, 5)}
                        </div>
                        <div className="flex items-center gap-3 text-blue-800 dark:text-blue-400 mb-2">
                          <User className="h-5 w-5" />
                          <span className="font-medium">{clientName}</span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Type:</span> {appt.type}
                        </div>
                        {appt.duration && (
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Duration:</span> {appt.duration}
                          </div>
                        )}
                        {(appt.details || appt.notes) && (
                          <div className="text-gray-700 dark:text-gray-300 mt-2">
                            <span className="font-medium">Notes:</span> {appt.details || appt.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No appointments scheduled for this day</p>
                </div>
              )}
            </div>
          )}
        </div>

        {appointmentsForMonth.length === 0 && viewFilter === "month" && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No appointments scheduled this month
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}