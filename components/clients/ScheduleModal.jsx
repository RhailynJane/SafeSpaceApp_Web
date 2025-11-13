import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ScheduleModal({ open, onOpenChange, client, schedule = [] }) {
  // Filter and sort the appointments for the current client
  const clientAppointments = schedule
    .filter(appt => appt.client_id === client.id)
    .map(appt => {
      if (!appt.appointment_date || !appt.appointment_time) {
        return { ...appt, combinedDateTime: null };
      }
      // Create a combined, sortable date object
      const combinedDateTime = new Date(`${appt.appointment_date.substring(0, 10)}T${appt.appointment_time.substring(11, 19)}`);
      return { ...appt, combinedDateTime };
    })
    .filter(appt => appt.combinedDateTime) // Ensure no nulls
    .sort((a, b) => {
      if (!a.combinedDateTime) return 1;
      if (!b.combinedDateTime) return -1;
      return a.combinedDateTime.getTime() - b.combinedDateTime.getTime();
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule for {client.client_first_name} {client.client_last_name}</DialogTitle>
        </DialogHeader>

        {clientAppointments.length > 0 ? (
          <div className="mt-4 max-h-80 overflow-y-auto">
            <h3 className="font-semibold mb-2">Appointments</h3>
            <ul className="space-y-3">
              {clientAppointments.map((appt) => (
                <li key={appt.id} className="p-3 border rounded-lg bg-gray-50">
                  <p className="font-semibold">{new Date(appt.combinedDateTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appt.combinedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="mx-2">•</span>
                    {appt.type}
                    <span className="mx-2">•</span>
                    {appt.duration}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-center text-gray-500">No appointments scheduled for this client.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}