import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ 
      where: { clerk_user_id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRole = user.role.role_name.replace(/_/g, "-");

    let metrics = {};
    let notifications = [];
    let todaySchedule = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (userRole === "admin") {
      const totalUsers = await prisma.user.count();
      const systemAlerts = await prisma.systemAlert.count({ where: { is_read: false } });
      const pendingReferrals = await prisma.referral.count({ where: { status: "Pending" } });
      const activeWorkers = await prisma.user.count({ where: { role: { role_name: { in: ["team-leader", "support-worker"] } } } });

      metrics = {
        totalUsers,
        systemAlerts,
        pendingReferrals,
        activeWorkers,
      };
    } else if (userRole === "team-leader") {
        const activeClients = await prisma.client.count({ where: { status: "Active" } });
        const todaysSessions = await prisma.appointment.count({
            where: {
                appointment_date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });
        const highRiskClients = await prisma.client.count({ where: { risk_level: "High" } });

        const teamAppointments = await prisma.appointment.findMany({
            where: {
                appointment_date: { lt: today },
                scheduled_by: { role: { role_name: "support-worker" } }
            },
            select: { client_id: true, appointment_date: true }
        });

        const pendingNotesPromises = teamAppointments.map(async (appt) => {
            const note = await prisma.note.findFirst({
                where: {
                    client_id: appt.client_id,
                    note_date: { gte: appt.appointment_date }
                }
            });
            return note ? 0 : 1;
        });

        const pendingNotesArray = await Promise.all(pendingNotesPromises);
        const pendingNotes = pendingNotesArray.reduce((sum, value) => sum + value, 0);

        metrics = {
            activeClients,
            todaysSessions,
            highRiskClients,
            pendingNotes,
        };
    } else if (userRole === "support-worker") {
        const myClients = await prisma.client.count({ where: { user_id: user.id } });
        const todaysSessions = await prisma.appointment.count({
            where: {
                scheduled_by_user_id: user.id,
                appointment_date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });
        const urgentCases = await prisma.client.count({ where: { user_id: user.id, risk_level: { in: ["High", "Critical"] } } });
        
        const workerAppointments = await prisma.appointment.findMany({
            where: {
                scheduled_by_user_id: user.id,
                appointment_date: { lt: today }
            },
            select: { client_id: true, appointment_date: true }
        });

        const pendingNotesPromises = workerAppointments.map(async (appt) => {
            const note = await prisma.note.findFirst({
                where: {
                    client_id: appt.client_id,
                    note_date: { gte: appt.appointment_date }
                }
            });
            return note ? 0 : 1;
        });

        const pendingNotesArray = await Promise.all(pendingNotesPromises);
        const pendingNotes = pendingNotesArray.reduce((sum, value) => sum + value, 0);

        metrics = {
            myClients,
            todaysSessions,
            urgentCases,
            pendingNotes,
        };
    }

    notifications = await prisma.systemAlert.findMany({
        where: { is_read: false },
        orderBy: { timestamp: 'desc' },
        take: 5,
    });

    todaySchedule = await prisma.appointment.findMany({
        where: {
            appointment_date: {
                gte: today,
                lt: tomorrow,
            },
        },
        include: {
            client: {
                select: {
                    client_first_name: true,
                    client_last_name: true,
                }
            }
        }
    });


    return NextResponse.json({ metrics, notifications, todaySchedule }, { status: 200 });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { 
        message: "Error fetching dashboard data", 
        error: error.message,
        metrics: {},
        notifications: [],
        todaySchedule: [],
      },
      { status: 500 }
    );
  }
}
