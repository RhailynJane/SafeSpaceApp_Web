import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: { role: true },
    });

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // nextDay is tomorrow at 00:00 (used for "today" only ranges)
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    // endRange includes today + next 2 days (today, tomorrow, day-after-tomorrow)
    // use exclusive upper bound (lt endRange)
    const endRange = new Date(today);
    endRange.setDate(today.getDate() + 3);

    const isTeamLeader = dbUser.role.role_name === "team_leader";

    // Define the correct client filtering condition based on the user's role
    const clientWhereCondition = isTeamLeader
      ? {} // Team leaders see all clients
      : { supportWorkers: { some: { support_worker_id: dbUser.id } } }; // Support workers see only clients assigned to them via the join table

    const [
      totalClients,
      totalNotes,
      totalAppointments,
      upcomingAppointments,
      highRiskClients,
      crisisEvents,
      pendingReferrals,
      activeClients,
      todaysSessions,
      dbNotifications,
    ] = await Promise.all([
      prisma.client.count({ where: clientWhereCondition }),
      prisma.note.count({ where: { author_user_id: dbUser.id } }),
      prisma.appointment.count({ where: { scheduled_by_user_id: dbUser.id } }),
      prisma.appointment.findMany({
        where: {
          scheduled_by_user_id: dbUser.id,
          appointment_date: { gte: today, lt: endRange },
        },
        include: { client: { select: { client_first_name: true, client_last_name: true } } },
        orderBy: { appointment_date: "asc" },
        take: 5,
      }),
      prisma.client.count({ where: { risk_level: "High", ...clientWhereCondition } }),
      prisma.crisisEvent.count({ where: { initiator_user_id: dbUser.id } }),
      isTeamLeader ? prisma.referral.count({ where: { status: "Pending" } }) : Promise.resolve(0),
      prisma.client.count({ where: { status: "Active", ...clientWhereCondition } }),
      prisma.appointment.count({
        where: {
          appointment_date: { gte: today, lt: nextDay },
          ...(isTeamLeader ? {} : { scheduled_by_user_id: dbUser.id }),
        },
      }),
      prisma.notification.findMany({
        where: { user_id: dbUser.id },
        orderBy: { created_at: "desc" },
        take: 5,
      }),
    ]);

    const metrics = { totalClients, totalNotes, totalAppointments, highRiskClients, crisisEvents, pendingReferrals, activeClients, todaysSessions };

    // Ensure upcomingAppointments include a date string for client components
    const mappedUpcoming = upcomingAppointments.map(a => ({
      ...a,
      date: (a.appointment_date instanceof Date ? a.appointment_date : new Date(a.appointment_date)).toISOString().split('T')[0]
    }));

    const dynamicNotifications = [];
    if (upcomingAppointments.length > 0) dynamicNotifications.push({ id: crypto.randomUUID(), type: "appointment", message: `You have ${upcomingAppointments.length} upcoming session(s).`, timestamp: new Date() });
    if (highRiskClients > 0) dynamicNotifications.push({ id: crypto.randomUUID(), type: "crisis", message: `There are ${highRiskClients} high-risk clients that need monitoring.`, timestamp: new Date() });
    if (dbUser.role.role_name === "team_leader" && pendingReferrals > 0) dynamicNotifications.push({ id: crypto.randomUUID(), type: "referral", message: `You have ${pendingReferrals} pending referrals awaiting review.`, timestamp: new Date() });

    const allNotifications = [...dynamicNotifications, ...dbNotifications];

    return NextResponse.json({ metrics, notifications: allNotifications, upcomingAppointments: mappedUpcoming, role: dbUser.role?.role_name || "unknown" });
  } catch (error) {
    console.error("Dashboard route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
