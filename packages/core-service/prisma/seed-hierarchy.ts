import { PrismaClient, UserTier } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateInviteCode(): string {
  const bytes = randomBytes(6);
  return bytes.toString('hex').toUpperCase();
}

async function seedHierarchy() {
  console.log('🌱 Seeding user hierarchy system...');

  try {
    // Get all existing users
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        tier: true,
        inviteCode: true,
      },
    });

    console.log(`Found ${existingUsers.length} existing users`);

    // Generate invite codes for users who don't have one
    for (const user of existingUsers) {
      if (!user.inviteCode) {
        let inviteCode: string;
        let isUnique = false;
        let attempts = 0;

        // Generate unique invite code
        do {
          inviteCode = generateInviteCode();
          const existing = await prisma.user.findUnique({
            where: { inviteCode },
            select: { id: true },
          });
          isUnique = !existing;
          attempts++;
          
          if (attempts > 100) {
            throw new Error(`Failed to generate unique invite code for user ${user.id}`);
          }
        } while (!isUnique);

        await prisma.user.update({
          where: { id: user.id },
          data: { inviteCode },
        });

        console.log(`Generated invite code ${inviteCode} for user ${user.email}`);
      }
    }

    // Create a default administrator if none exists
    const adminExists = await prisma.user.findFirst({
      where: { tier: UserTier.administrator },
    });

    if (!adminExists) {
      const adminEmail = 'admin@smartaihub.com';
      let adminInviteCode: string;
      let isUnique = false;

      do {
        adminInviteCode = generateInviteCode();
        const existing = await prisma.user.findUnique({
          where: { inviteCode: adminInviteCode },
          select: { id: true },
        });
        isUnique = !existing;
      } while (!isUnique);

      const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          tier: UserTier.administrator,
          inviteCode: adminInviteCode,
          verified: true,
        },
        create: {
          email: adminEmail,
          tier: UserTier.administrator,
          inviteCode: adminInviteCode,
          verified: true,
          passwordHash: 'temp_hash_change_me',
        },
      });

      console.log(`Created administrator user: ${admin.email} with invite code ${adminInviteCode}`);
    }

    // Create sample agencies for testing
    const sampleAgencies = [
      { email: 'agency1@smartaihub.com', name: 'Agency One' },
      { email: 'agency2@smartaihub.com', name: 'Agency Two' },
    ];

    for (const agency of sampleAgencies) {
      let agencyInviteCode: string;
      let isUnique = false;

      do {
        agencyInviteCode = generateInviteCode();
        const existing = await prisma.user.findUnique({
          where: { inviteCode: agencyInviteCode },
          select: { id: true },
        });
        isUnique = !existing;
      } while (!isUnique);

      const createdAgency = await prisma.user.upsert({
        where: { email: agency.email },
        update: {
          tier: UserTier.agency,
          inviteCode: agencyInviteCode,
          verified: true,
        },
        create: {
          email: agency.email,
          tier: UserTier.agency,
          inviteCode: agencyInviteCode,
          verified: true,
          passwordHash: 'temp_hash_change_me',
        },
      });

      // Create agency referral config
      await prisma.agencyReferralConfig.upsert({
        where: { agencyId: createdAgency.id },
        update: {},
        create: {
          agencyId: createdAgency.id,
          organizationRewardPoints: 5000,
          adminRewardPoints: 3000,
          generalRewardPoints: 1000,
          isActive: true,
        },
      });

      console.log(`Created sample agency: ${agency.email} with invite code ${agencyInviteCode}`);
    }

    // Create sample organizations under first agency
    const firstAgency = await prisma.user.findFirst({
      where: { tier: UserTier.agency },
    });

    if (firstAgency) {
      const sampleOrganizations = [
        { email: 'org1@smartaihub.com', name: 'Organization One' },
        { email: 'org2@smartaihub.com', name: 'Organization Two' },
      ];

      for (const org of sampleOrganizations) {
        let orgInviteCode: string;
        let isUnique = false;

        do {
          orgInviteCode = generateInviteCode();
          const existing = await prisma.user.findUnique({
            where: { inviteCode: orgInviteCode },
            select: { id: true },
          });
          isUnique = !existing;
        } while (!isUnique);

        await prisma.user.upsert({
          where: { email: org.email },
          update: {
            tier: UserTier.organization,
            parentAgencyId: firstAgency.id,
            inviteCode: orgInviteCode,
            verified: true,
          },
          create: {
            email: org.email,
            tier: UserTier.organization,
            parentAgencyId: firstAgency.id,
            inviteCode: orgInviteCode,
            verified: true,
            passwordHash: 'temp_hash_change_me',
          },
        });

        console.log(`Created sample organization: ${org.email} under agency ${firstAgency.email}`);
      }
    }

    console.log('✅ User hierarchy system seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding hierarchy system:', error);
    throw error;
  }
}

async function main() {
  await seedHierarchy();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });