import { useState } from "react"
import ViewProfileModal from "@/components/clients/ViewProfileModal"
import MessageModal from "@/components/clients/MessageModal"
import ScheduleModal from "@/components/clients/ScheduleModal"
import { Button } from "@/components/ui/button"

export default function ClientActionButtons({ client }) {
  const [showProfile, setShowProfile] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setShowProfile(true)} className="bg-cyan-500 border-2 border-cyan-900 hover:bg-cyan-600 text-black ">View Profile</Button>
        <Button size="sm" onClick={() => setShowMessage(true)} className="bg-amber-100 border-2 border-amber-800 hover:bg-amber-400 text-black">Message</Button>
        <Button size="sm" onClick={() => setShowSchedule(true)} className="bg-gray-500 border-2 border-black hover:bg-black text-white">Schedule</Button>
      </div>

      <ViewProfileModal open={showProfile} onOpenChange={setShowProfile} client={client} />
      <MessageModal open={showMessage} onOpenChange={setShowMessage} client={client} />
      <ScheduleModal open={showSchedule} onOpenChange={setShowSchedule} client={client} />
    </>
  )
}
