import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed Roles
  const roles = [
    { role_name: 'admin', description: 'Administrator with full access' },
    { role_name: 'team-leader', description: 'Team Leader with management capabilities' },
    { role_name: 'support-worker', description: 'Support Worker with client-facing responsibilities' },
    { role_name: 'therapist', description: 'Therapist providing sessions' },
    { role_name: 'patient', description: 'Patient receiving services' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: {},
      create: role,
    });
  }
  console.log('Roles seeded.');

  const adminRole = await prisma.role.findUnique({ where: { role_name: 'admin' } });
  const teamLeaderRole = await prisma.role.findUnique({ where: { role_name: 'team-leader' } });
  const supportWorkerRole = await prisma.role.findUnique({ where: { role_name: 'support-worker' } });
  const therapistRole = await prisma.role.findUnique({ where: { role_name: 'therapist' } });
  const patientRole = await prisma.role.findUnique({ where: { role_name: 'patient' } });

  if (!adminRole || !teamLeaderRole || !supportWorkerRole || !therapistRole || !patientRole) {
    console.error('One or more roles were not found after seeding. Aborting user seed.');
    return;
  }

  // Seed Users
  const users = [
    {
      first_name: 'Admin',
      last_name: 'User',
      email: 'adminsafespace@gmail.com',
      clerk_user_id: "user_2fPzL6R4wQ8vJ7cOFzajyUeU7E1",
      role_id: adminRole.id,
    },
    {
      first_name: 'Team',
      last_name: 'Leader',
      email: 'teamleader@gmail.com',
      clerk_user_id: "user_2fPRgCqGjVTq2tqnT3B5sShV2FF",
      role_id: teamLeaderRole.id,
    },
    {
      first_name: 'Support',
      last_name: 'Worker',
      email: 'supportworker@gmail.com',
      clerk_user_id: "user_2fPSgCqGjVTq2tqnT3B5sShV2FF",
      role_id: supportWorkerRole.id,
    },
    {
      first_name: "Therapist",
      last_name: "User",
      email: "therapist@gmail.com",
      clerk_user_id: "user_2fPTgCqGjVTq2tqnT3B5sShV2FF",
      role_id: therapistRole.id,
    },
    {
      first_name: "John",
      last_name: "Doe",
      email: "patient@gmail.com",
      clerk_user_id: "user_2fPUgCqGjVTq2tqnT3B5sShV2FF",
      role_id: patientRole.id,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  console.log('Users seeded.');

  // Seed other reference data
  const priorityLevels = [{ level_name: 'High' }, { level_name: 'Medium' }, { level_name: 'Low' }];
  for (const level of priorityLevels) {
    await prisma.priorityLevel.upsert({ where: { level_name: level.level_name }, update: {}, create: level });
  }
  console.log('Priority levels seeded.');

  const referralStatuses = [{ status_name: 'Pending' }, { status_name: 'Accepted' }, { status_name: 'Declined' }];
  for (const status of referralStatuses) {
    await prisma.referralStatus.upsert({ where: { status_name: status.status_name }, update: {}, create: status });
  }
  console.log('Referral statuses seeded.');

  const sessionTypes = [{ type_name: 'Initial Consultation' }, { type_name: 'Follow-up' }, { type_name: 'Crisis Intervention' }];
  for (const type of sessionTypes) {
    await prisma.sessionType.upsert({ where: { type_name: type.type_name }, update: {}, create: type });
  }
  console.log('Session types seeded.');

  const riskLevels = [{ level_name: 'High' }, { level_name: 'Medium' }, { level_name: 'Low' }];
  for (const level of riskLevels) {
    await prisma.riskLevel.upsert({ where: { level_name: level.level_name }, update: {}, create: level });
  }
  console.log('Risk levels seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
