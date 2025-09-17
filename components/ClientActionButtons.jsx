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
        <Button variant="outline" size="sm" onClick={() => setShowProfile(true)}>View Profile</Button>
        <Button variant="outline" size="sm" onClick={() => setShowMessage(true)}>Message</Button>
        <Button size="sm" onClick={() => setShowSchedule(true)}>Schedule</Button>
      </div>

      <ViewProfileModal open={showProfile} onOpenChange={setShowProfile} client={client} />
      <MessageModal open={showMessage} onOpenChange={setShowMessage} client={client} />
      <ScheduleModal open={showSchedule} onOpenChange={setShowSchedule} client={client} />
    </>
  )
}
