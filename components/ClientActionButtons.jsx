import { useState } from "react"
import ViewProfileModal from "@/components/clients/ViewProfileModal"
import ScheduleModal from "@/components/clients/ScheduleModal"
import { Button } from "@/components/ui/button"

export default function ClientActionButtons({ client, onMessage, schedule }) {
  const [showProfile, setShowProfile] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false);
  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setShowProfile(true)} className=" bg-green-200 border-2 border-green-900 hover:bg-cyan-600 text-black ">View Profile</Button>
        <Button size="sm" onClick={onMessage} className="bg-amber-100 border-2 border-amber-800 hover:bg-amber-400 text-black">Message</Button>
        <Button size="sm" onClick={() => setShowSchedule(true)} className="bg-gray-300 border-2 border-gray-600 hover:bg-gray-400 text-black">Schedule</Button>
      </div>

      <ViewProfileModal open={showProfile} onOpenChange={setShowProfile} client={client} />
      <ScheduleModal open={showSchedule} onOpenChange={setShowSchedule} client={client} schedule={schedule} />
    </>
  )
}
