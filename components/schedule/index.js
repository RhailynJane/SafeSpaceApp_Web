"use client";

import { useState } from "react";
import ViewAvailabilityModal from "./ViewAvailabilityModal";
import AddAppointmentModal from "./AddAppointmentModal";

export default function ScheduleAppointment({ clients }) {
  const [selectedSlot, setSelectedSlot] = useState(null); // stores selected slot
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // controls AddAppointmentModal open state

  // called when user clicks Confirm Slot in ViewAvailabilityModal
  const handleConfirmSlot = (slot) => {
    setSelectedSlot(slot);       // store selected day/time
    setIsAddModalOpen(true);      // open AddAppointmentModal
  };

  return (
    <div>
      {/* Step 1: show available slots */}
      <ViewAvailabilityModal
        availability={[
          { day: "Monday", time: "9:00am-10:00am, 10:00am-11:00am" },
          { day: "Tuesday", time: "1:00pm-2:00pm" },
          { day: "Wednesday", time: "3:00pm-4:00pm" },
        ]}
        onConfirm={handleConfirmSlot} // called when Confirm Slot is clicked
      />

      {/* Step 2: open Add Appointment with selected slot */}
      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen} // allow modal to close
        prefilledSlot={selectedSlot}     // pass day/time to prefill
        clients={clients}                // list of clients
      />
    </div>
  );
}
