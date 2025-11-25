import { useState } from "react"
import { useToast } from "@/contexts/ToastContext"
import ViewProfileModal from "@/components/clients/ViewProfileModal"
import EditClientModal from "@/components/clients/EditClientModal"
import ScheduleModal from "@/components/clients/ScheduleModal"
import { Button } from "@/components/ui/button"

export default function ClientActionButtons({ client, onMessage, schedule, onClientUpdated }) {
  const [showProfile, setShowProfile] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false);
  const toast = useToast();
  
  const handleClientSaved = (updatedClient) => {
    onClientUpdated?.(updatedClient);
  };

  const handleInvite = async () => {
    try {
      const email = (client?.email || client?.client_email || "").trim();
      if (!email) {
        toast.error("Client email is missing");
        return;
      }

      const orgId = client?.orgId || client?.org_id || client?.organization_id;
      const firstName = client?.firstName || client?.client_first_name || client?.first_name;
      const lastName = client?.lastName || client?.client_last_name || client?.last_name;

      const res = await fetch("/api/clients/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orgId, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.detail || "Invite failed");
      toast.success(`Invitation sent to ${email}`);
    } catch (e) {
      toast.error(e?.message || "Failed to invite client");
    }
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => setShowProfile(true)} className="bg-green-200 border-2 border-green-900 hover:bg-cyan-600 text-black">View Profile</Button>
        <Button size="sm" onClick={() => setShowEdit(true)} className="bg-blue-200 border-2 border-blue-900 hover:bg-blue-600 text-black">Edit Profile</Button>
        <Button size="sm" onClick={onMessage} className="bg-amber-100 border-2 border-amber-800 hover:bg-amber-400 text-black">Message</Button>
        <Button size="sm" onClick={() => setShowSchedule(true)} className="bg-gray-300 border-2 border-gray-600 hover:bg-gray-400 text-black">Schedule</Button>
        <Button size="sm" onClick={handleInvite} className="bg-purple-200 border-2 border-purple-900 hover:bg-purple-600 text-black">Invite</Button>
      </div>

      <ViewProfileModal open={showProfile} onOpenChange={setShowProfile} client={client} />
      <EditClientModal open={showEdit} onOpenChange={setShowEdit} client={client} onSave={handleClientSaved} />
      <ScheduleModal open={showSchedule} onOpenChange={setShowSchedule} client={client} schedule={schedule} />
    </>
  )
}
