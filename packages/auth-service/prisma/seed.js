const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Delete existing roles
  await prisma.role.deleteMany();

  // Insert default roles
  const roles = [
    {
      name: 'super_admin',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        roles: ['create', 'read', 'update', 'delete'],
        credits: ['create', 'read', 'update', 'delete'],
        system: ['admin']
      }
    },
    {
      name: 'admin',
      permissions: {
        users: ['create', 'read', 'update'],
        credits: ['read', 'update'],
        system: ['manage']
      }
    },
    {
      name: 'manager',
      permissions: {
        users: ['read', 'update'],
        credits: ['read']
      }
    },
    {
      name: 'user',
      permissions: {
        profile: ['read', 'update'],
        credits: ['read']
      }
    },
    {
      name: 'guest',
      permissions: {
        profile: ['read']
      }
    }
  ];

  for (const role of roles) {
    await prisma.role.create({
      data: role
    });
    console.log(`Created role: ${role.name}`);
  }

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