"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText } from "lucide-react"

export function ReferralStatusTracker() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Referral Status Tracking
          </CardTitle>
          <CardDescription>
            Monitor the progress of all referrals from submission to completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
