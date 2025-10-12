import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // --- Insert roles ---
  const roles = await prisma.role.createMany({
    data: [
      { role_name: "admin", description: "System Administrator" },
      { role_name: "team_leader", description: "Supervises team operations" },
      { role_name: "support_worker", description: "Provides mental health support" },
      { role_name: "therapist", description: "Provides therapy sessions" },
      { role_name: "patient", description: "Receives support services" },
    ],
    skipDuplicates: true,
  });

  // --- Insert risk levels ---
  const riskLevels = await prisma.riskLevel.createMany({
    data: [
      { level_name: "Low", description: "Minimal risk" },
      { level_name: "Medium", description: "Requires attention" },
      { level_name: "High", description: "Immediate concern" },
    ],
    skipDuplicates: true,
  });

  // --- Insert referral statuses ---
  const referralStatuses = await prisma.referralStatus.createMany({
    data: [
      { status_name: "Pending", description: "Awaiting approval" },
      { status_name: "Approved", description: "Approved by admin" },
      { status_name: "Rejected", description: "Referral denied" },
    ],
    skipDuplicates: true,
  });

  // --- Insert session types ---
  const sessionTypes = await prisma.sessionType.createMany({
    data: [
      { type_name: "Individual Therapy" },
      { type_name: "Group Therapy" },
      { type_name: "Assessment" },
    ],
    skipDuplicates: true,
  });

  // --- Insert priority levels ---
  const priorityLevels = await prisma.priorityLevel.createMany({
    data: [
      { level_name: "Low", order_rank: 1 },
      { level_name: "Medium", order_rank: 2 },
      { level_name: "High", order_rank: 3 },
    ],
    skipDuplicates: true,
  });

  // --- Create sample users (linked to roles) ---
  const adminRole = await prisma.role.findUnique({ where: { role_name: "admin" } });
  const teamLeaderRole = await prisma.role.findUnique({ where: { role_name: "team_leader" } });
  const supportRole = await prisma.role.findUnique({ where: { role_name: "support_worker" } });
  const patientRole = await prisma.role.findUnique({ where: { role_name: "patient" } });

  await prisma.user.createMany({
    data: [
      {
        first_name: "admin",
        last_name: "safespace",
        email: "admin@test.com",
        role_id: adminRole.id,
        clerk_user_id: "user_33QgZSox3HWVj7cOFzajyUeU7E1"
      },
      {
        first_name: "Team",
        last_name: "Leader",
        email: "leader@safespace.com",
        role_id: teamLeaderRole.id,
        clerk_user_id : "user_33PRgCqGjVTq2tqnT3B5sShV2FF"
      },
      {
        first_name: "Support",
        last_name: "Worker",
        email: "support@safespace.com",
        role_id: supportRole.id,
      },
      {
        first_name: "John",
        last_name: "Doe",
        email: "patient@safespace.com",
        role_id: patientRole.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });