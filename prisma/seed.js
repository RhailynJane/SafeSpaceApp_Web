import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log(" Starting database seed...");

  // --- Insert roles ---
  const adminRole = await prisma.role.upsert({
    where: { role_name: "admin" },
    update: {},
    create: { role_name: "admin", description: "System Administrator" },
  });

  const teamLeaderRole = await prisma.role.upsert({
    where: { role_name: "team_leader" },
    update: {},
    create: { role_name: "team_leader", description: "Supervises team operations and manages referrals" },
  });

  const supportWorkerRole = await prisma.role.upsert({
    where: { role_name: "support_worker" },
    update: {},
    create: { role_name: "support_worker", description: "Provides mental health support" },
  });

  const clientRole = await prisma.role.upsert({
    where: { role_name: "client" },
    update: {},
    create: { role_name: "client", description: "Receives support services" },
  });

  // --- Insert other lookup data ---
  await prisma.riskLevel.createMany({
    data: [
      { level_name: "Low", description: "Minimal risk" },
      { level_name: "Medium", description: "Requires attention" },
      { level_name: "High", description: "Immediate concern" },
    ],
    skipDuplicates: true,
  });

  await prisma.referralStatus.createMany({
    data: [
      { status_name: "Pending", description: "Awaiting approval" },
      { status_name: "Approved", description: "Approved by admin" },
      { status_name: "Rejected", description: "Referral denied" },
    ],
    skipDuplicates: true,
  });

  await prisma.sessionType.createMany({
    data: [
      { type_name: "Individual Therapy" },
      { type_name: "Group Therapy" },
      { type_name: "Assessment" },
    ],
    skipDuplicates: true,
  });

  await prisma.priorityLevel.createMany({
    data: [
      { level_name: "Low", order_rank: 1 },
      { level_name: "Medium", order_rank: 2 },
      { level_name: "High", order_rank: 3 },
    ],
    skipDuplicates: true,
  });

  // --- Create sample users ---
  const adminUser = await prisma.user.upsert({
    where: { email: "adminsafespace@gmail.com" },
    update: {},
    create: {
      first_name: "admin",
      last_name: "safespace",
      email: "adminsafespace@gmail.com",
      role_id: adminRole.id,
      clerk_user_id: "user_2fPzL6R4wQ8vJ7cOFzajyUeU7E1",
    },
  });

  const teamLeaderUser = await prisma.user.upsert({
    where: { email: "teamleader@gmail.com" },
    update: {},
    create: {
      first_name: "Team",
      last_name: "Leader",
      email: "teamleader@gmail.com",
      role_id: teamLeaderRole.id,
      clerk_user_id: "user_2fPRgCqGjVTq2tqnT3B5sShV2FF",
    },
  });

  const supportWorkerUser = await prisma.user.upsert({
    where: { email: "supportworker@gmail.com" },
    update: {},
    create: {
      first_name: "Support",
      last_name: "Worker",
      email: "supportworker@gmail.com",
      role_id: supportWorkerRole.id,
      clerk_user_id: "user_2fPSgCqGjVTq2tqnT3B5sShV2FF",
    },
  });

  // --- Create sample clients and their user accounts ---
  const clientUser1 = await prisma.user.upsert({
    where: { email: "john.doe@example.com" },
    update: {},
    create: {
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      role_id: clientRole.id,
      clerk_user_id: "user_2fPUgCqGjVTq2tqnT3B5sShV2FF",
    },
  });

  const client1 = await prisma.client.upsert({
    where: { email: "john.doe@example.com" },
    update: {},
    create: {
      client_first_name: "John",
      client_last_name: "Doe",
      email: "john.doe@example.com",
      status: "Active",
      risk_level: "Low",
      user_id: clientUser1.id,
    },
  });

  const clientUser2 = await prisma.user.upsert({
    where: { email: "jane.smith@example.com" },
    update: {},
    create: {
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@example.com",
      role_id: clientRole.id,
      clerk_user_id: "user_2fPVgCqGjVTq2tqnT3B5sShV2GG",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { email: "jane.smith@example.com" },
    update: {},
    create: {
      client_first_name: "Jane",
      client_last_name: "Smith",
      email: "jane.smith@example.com",
      status: "Active",
      risk_level: "Medium",
      user_id: clientUser2.id,
    },
  });

  // --- Create sample notes ---
  await prisma.note.createMany({
    data: [
      // Admin User
      {
        client_id: client1.id,
        author_user_id: supportWorkerUser.id,
        note_date: new Date("2024-09-10"),
        session_type: "Individual Therapy",
        summary: "Discussed coping mechanisms for anxiety.",
        detailed_notes: "Client reported feeling overwhelmed at work. We practiced mindfulness exercises.",
        risk_assessment: "Low",
      },
      // Team Leader User
      {
        client_id: client2.id,
        author_user_id: teamLeaderUser.id,
        note_date: new Date("2024-09-12"),
        session_type: "Assessment",
        summary: "Initial assessment of client's needs.",
        detailed_notes: "Client is seeking support for depression and relationship issues.",
        risk_assessment: "Medium",
      },
      // Support Worker User
      {
        client_id: client1.id,
        author_user_id: supportWorkerUser.id,
        note_date: new Date("2024-09-17"),
        session_type: "Individual Therapy",
        summary: "Follow-up session on anxiety management.",
        detailed_notes: "Client has been using the mindfulness techniques and reports a slight improvement.",
        risk_assessment: "Low",
      },
    ],
    skipDuplicates: true,
  });

  // --- Create sample referrals ---
  await prisma.referral.createMany({
    data: [
      {
        client_id: client1.id,
        client_first_name: client1.client_first_name,
        client_last_name: client1.client_last_name,
        email: client1.email,
        phone: "123-456-7890",
        reason_for_referral: "Client is seeking support for anxiety and stress.",
        referral_source: "Self-referral",
        status: "Pending",
        submitted_date: new Date("2024-10-01"),
      },
      // Therapist User
      {
        first_name: "Therapist",
        last_name: "User",
        email: "therapist@gmail.com",
        role_id: therapistRole.id,
        clerk_user_id: "user_2fPTgCqGjVTq2tqnT3B5sShV2FF"
      },
      // Patient User
      {
        client_id: client2.id,
        client_first_name: client2.client_first_name,
        client_last_name: client2.client_last_name,
        email: client2.email,
        phone: "098-765-4321",
        reason_for_referral: "Client was referred by their GP for depression.",
        referral_source: "GP",
        status: "Accepted",
        submitted_date: new Date("2024-09-28"),
        processed_date: new Date("2024-09-30"),
        processed_by_user_id: teamLeaderUser.id,
      },
      {
        client_id: client1.id,
        client_first_name: client1.client_first_name,
        client_last_name: client1.client_last_name,
        email: client1.email,
        phone: "123-456-7890",
        reason_for_referral: "Follow-up referral for specialized therapy.",
        referral_source: "Internal",
        status: "Declined",
        submitted_date: new Date("2024-09-25"),
        processed_date: new Date("2024-09-26"),
        processed_by_user_id: teamLeaderUser.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log(" Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(" Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });