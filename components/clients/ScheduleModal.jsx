import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, FileText, User } from "lucide-react"

export default function ScheduleModal({ open, onOpenChange, client, schedule = [] }) {
  // Get client ID - handle both Convex (_id) and legacy (id) formats
  const clientId = client?._id || client?.id;
  const clientEmail = client?.email || client?.client_email;
  
  // Filter and sort the appointments for the current client
  const clientAppointments = schedule
    .filter(appt => {
      // Match by client_id or clientId fields in the appointment
      return appt.client_id === clientId || 
             appt.clientId === clientId ||
             appt.email === clientEmail;
    })
    .map(appt => {
      if (!appt.appointment_date || !appt.appointment_time) {
        return { ...appt, combinedDateTime: null };
      }
      // Create a combined, sortable date object
      // appointment_date is YYYY-MM-DD, appointment_time is HH:mm
      const dateStr = String(appt.appointment_date).includes('T') 
        ? appt.appointment_date.substring(0, 10) 
        : appt.appointment_date;
      const timeStr = String(appt.appointment_time).includes(':') && String(appt.appointment_time).length <= 5
        ? appt.appointment_time
        : appt.appointment_time.substring(11, 16);
      const combinedDateTime = new Date(`${dateStr}T${timeStr}:00`);
      return { ...appt, combinedDateTime };
    })
    .filter(appt => appt.combinedDateTime) // Ensure no nulls
    .sort((a, b) => {
      if (!a.combinedDateTime) return 1;
      if (!b.combinedDateTime) return -1;
      return a.combinedDateTime.getTime() - b.combinedDateTime.getTime();
    });

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = clientAppointments.filter(appt => appt.combinedDateTime >= now);
  const pastAppointments = clientAppointments.filter(appt => appt.combinedDateTime < now);

  const clientName = `${client?.firstName || client?.client_first_name || client?.first_name || ''} ${client?.lastName || client?.client_last_name || client?.last_name || ''}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl dark:text-gray-100">
            <User className="h-5 w-5 text-primary dark:text-blue-400" />
            Appointments for {clientName}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            View all scheduled appointments for this client
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {clientAppointments.length > 0 ? (
            <div className="space-y-6">
              {/* Upcoming Appointments */}
              {upcomingAppointments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Upcoming Appointments ({upcomingAppointments.length})
                  </h3>
                  <div className="space-y-3">
                    {upcomingAppointments.map((appt) => (
                      <div 
                        key={appt.id} 
                        className="group relative p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {new Date(appt.combinedDateTime).toLocaleDateString(undefined, { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                <span>{new Date(appt.combinedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{appt.type}</span>
                              </div>
                              {appt.duration && (
                                <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                  {appt.duration}
                                </div>
                              )}
                            </div>
                            {appt.details && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-6">{appt.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Appointments */}
              {pastAppointments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    Past Appointments ({pastAppointments.length})
                  </h3>
                  <div className="space-y-3">
                    {pastAppointments.map((appt) => (
                      <div 
                        key={appt.id} 
                        className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4 opacity-75">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <p className="font-semibold text-gray-700 dark:text-gray-300">
                                {new Date(appt.combinedDateTime).toLocaleDateString(undefined, { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                <span>{new Date(appt.combinedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium">{appt.type}</span>
                              </div>
                              {appt.duration && (
                                <div className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                                  {appt.duration}
                                </div>
                              )}
                            </div>
                            {appt.details && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-6">{appt.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-900 dark:text-gray-100 font-semibold mb-1">No appointments scheduled</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This client doesn't have any appointments yet.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}