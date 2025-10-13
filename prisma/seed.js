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
  await prisma.user.createMany({
    data: [
      // Admin User
      {
        first_name: "admin",
        last_name: "safespace",
        email: "adminsafespace@gmail.com",
        role: "admin",
        clerk_user_id: "user_2fPzL6R4wQ8vJ7cOFzajyUeU7E1"
      },
      // Team Leader User
      {
        first_name: "Team",
        last_name: "Leader",
        email: "teamleader@gmail.com",
        role: "team_leader",
        clerk_user_id : "user_2fPRgCqGjVTq2tqnT3B5sShV2FF"
      },
      // Support Worker User
      {
        first_name: "Support",
        last_name: "Worker",
        email: "supportworker@gmail.com",
        role: "support_worker",
        clerk_user_id: "user_2fPSgCqGjVTq2tqnT3B5sShV2FF"
      },
      // Therapist User
      {
        first_name: "Therapist",
        last_name: "User",
        email: "therapist@gmail.com",
        role: "therapist",
        clerk_user_id: "user_2fPTgCqGjVTq2tqnT3B5sShV2FF"
      },
      // Patient User
      {
        first_name: "John",
        last_name: "Doe",
        email: "patient@gmail.com",
        role: "patient",
        clerk_user_id: "user_2fPUgCqGjVTq2tqnT3B5sShV2FF"
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