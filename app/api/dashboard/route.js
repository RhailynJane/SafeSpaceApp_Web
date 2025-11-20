import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user from Convex
    const dbUser = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const roleName = dbUser.roleId || "support_worker";
    const isTeamLeader = roleName === "team_leader";

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dayAfter = new Date(Date.now() + 172800000).toISOString().split("T")[0];

    // Fetch data from Convex
    const [clients, notes, todayAppts, tomorrowAppts, dayAfterAppts] = await Promise.all([
      convex.query(api.clients.list, { clerkId: userId }),
      convex.query(api.notes.listForUser, { clerkId: userId }),
      convex.query(api.appointments.listByDate, { clerkId: userId, date: today }),
      convex.query(api.appointments.listByDate, { clerkId: userId, date: tomorrow }),
      convex.query(api.appointments.listByDate, { clerkId: userId, date: dayAfter }),
    ]);

    // Combine appointments from all 3 days
    const appointments = [...(todayAppts || []), ...(tomorrowAppts || []), ...(dayAfterAppts || [])];

    // Calculate metrics
    const totalClients = clients?.length || 0;
    const totalNotes = notes?.length || 0;
    const totalAppointments = appointments?.length || 0;
    const highRiskClients = clients?.filter(c => c.riskLevel === "high")?.length || 0;
    const activeClients = clients?.filter(c => c.status === "active")?.length || 0;
    const pendingReferrals = 0; // Will be fetched directly in workspace using Convex client-side
    
    // Today's sessions
    const todaysSessions = todayAppts?.length || 0;

    // Upcoming appointments (next 3 days)
    const upcomingAppointments = appointments
      .slice(0, 5)
      .map(a => ({
        id: a._id,
        appointment_date: a.appointmentDate || a.date,
        appointment_time: a.appointmentTime || a.time || "",
        type: a.type || "",
        client: {
          client_first_name: a.clientName?.split(" ")[0] || "",
          client_last_name: a.clientName?.split(" ").slice(1).join(" ") || ""
        },
        date: a.appointmentDate || a.date
      }));

    const metrics = {
      totalClients,
      totalNotes,
      totalAppointments,
      highRiskClients,
      crisisEvents: 0, // Crisis events not yet in Convex
      pendingReferrals,
      activeClients,
      todaysSessions
    };

    // Generate notifications
    const dynamicNotifications = [];
    if (upcomingAppointments.length > 0) {
      dynamicNotifications.push({
        id: crypto.randomUUID(),
        type: "appointment",
        message: `You have ${upcomingAppointments.length} upcoming session(s).`,
        created_at: new Date()
      });
    }
    if (highRiskClients > 0) {
      dynamicNotifications.push({
        id: crypto.randomUUID(),
        type: "crisis",
        message: `There are ${highRiskClients} high-risk clients that need monitoring.`,
        created_at: new Date()
      });
    }

    return NextResponse.json({
      metrics,
      notifications: dynamicNotifications,
      upcomingAppointments,
      role: roleName
    });
  } catch (error) {
    console.error("Dashboard route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
