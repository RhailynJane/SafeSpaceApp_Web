const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create Roles
  const roles = [
    { role_name: 'admin', description: 'Administrator with full access' },
    { role_name: 'support_worker', description: 'Support Worker for clients' },
    { role_name: 'team_lead', description: 'Team Lead for support workers' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: {},
      create: role,
    });
  }
  console.log('Roles seeded.');

  const createdRoles = await prisma.role.findMany();
  const roleMap = createdRoles.reduce((acc, role) => {
    acc[role.role_name] = role.id;
    return acc;
  }, {});


  // Create Users
  const users = [];
  for (let i = 0; i < 10; i++) {
    users.push({
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      clerk_user_id: faker.string.uuid(),
      role_id: createdRoles[Math.floor(Math.random() * createdRoles.length)].id,
    });
  }

  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  console.log('Users seeded.');
  
  const createdUsers = await prisma.user.findMany();

  // Create Clients
  const clients = [];
  for (let i = 0; i < 20; i++) {
    clients.push({
      client_first_name: faker.person.firstName(),
      client_last_name: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      status: faker.helpers.arrayElement(['Active', 'Inactive', 'Pending']),
      risk_level: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
      user_id: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
    });
  }

  for (const client of clients) {
    await prisma.client.create({ data: client });
  }
  console.log('Clients seeded.');

  const createdClients = await prisma.client.findMany();

  // Create Referrals
  const referrals = [];
  for (let i = 0; i < 15; i++) {
    referrals.push({
      client_first_name: faker.person.firstName(),
      client_last_name: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      referral_source: faker.company.name(),
      reason_for_referral: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed', 'Rejected']),
      client_id: createdClients[Math.floor(Math.random() * createdClients.length)].id,
      processed_by_user_id: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
    });
  }

  for (const referral of referrals) {
    await prisma.referral.create({ data: referral });
  }
  console.log('Referrals seeded.');


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
