import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
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

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 2);

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
    ] = await Promise.all([
      prisma.client.count({ where: dbUser.role.role_name === "team_leader" ? {} : { user_id: dbUser.id } }),
      prisma.note.count({ where: { author_user_id: dbUser.id } }),
      prisma.appointment.count({ where: { scheduled_by_user_id: dbUser.id } }),
      prisma.appointment.findMany({
        where: {
          scheduled_by_user_id: dbUser.id,
          appointment_date: { gte: today, lt: tomorrow },
        },
        include: { client: { select: { client_first_name: true, client_last_name: true } } },
        orderBy: { appointment_date: "asc" },
        take: 5,
      }),
      prisma.client.count({ where: { risk_level: "High", ...(dbUser.role.role_name === "team_leader" ? {} : { user_id: dbUser.id }) } }),
      prisma.crisisEvent.count({ where: { initiator_user_id: dbUser.id } }),
      dbUser.role.role_name === "team_leader" ? prisma.referral.count({ where: { status: "Pending" } }) : Promise.resolve(0),
      prisma.client.count({ where: { status: "Active" } }),
      prisma.appointment.count({ where: { appointment_date: { gte: today, lt: tomorrow }, ...(dbUser.role.role_name === "team_leader" ? {} : { scheduled_by_user_id: dbUser.id }) } }),
    ]);

    const metrics = { totalClients, totalNotes, totalAppointments, highRiskClients, crisisEvents, pendingReferrals, activeClients, todaysSessions };

    const notifications = [];
    if (upcomingAppointments.length > 0) notifications.push({ id: crypto.randomUUID(), type: "appointment", message: `You have ${upcomingAppointments.length} upcoming session(s).`, timestamp: new Date() });
    if (highRiskClients > 0) notifications.push({ id: crypto.randomUUID(), type: "crisis", message: `There are ${highRiskClients} high-risk clients that need monitoring.`, timestamp: new Date() });
    if (dbUser.role.role_name === "team_leader" && pendingReferrals > 0) notifications.push({ id: crypto.randomUUID(), type: "referral", message: `You have ${pendingReferrals} pending referrals awaiting review.`, timestamp: new Date() });

    return NextResponse.json({ metrics, notifications, upcomingAppointments, role: dbUser.role?.role_name || "unknown" });
  } catch (error) {
    console.error("Dashboard route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
