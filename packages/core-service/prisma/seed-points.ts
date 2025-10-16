import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedExchangeRates() {
  try {
    console.log('Seeding exchange rates...');

    // Check if exchange rates already exist
    const existingRates = await prisma.exchangeRate.count();
    if (existingRates > 0) {
      console.log('Exchange rates already exist, skipping seed');
      return;
    }

    // Create default exchange rates
    const exchangeRates = [
      {
        name: 'credit_to_points',
        rate: 1000,
        description: 'Credits to Points conversion rate (1 Credit = 1000 Points)',
      },
      {
        name: 'points_per_usd',
        rate: 10000,
        description: 'Points per USD purchase rate (1 USD = 10000 Points)',
      },
      {
        name: 'daily_reward_amount',
        rate: 50,
        description: 'Daily login reward amount in points',
      },
      {
        name: 'auto_topup_threshold',
        rate: 10,
        description: 'Auto top-up threshold in points',
      },
      {
        name: 'auto_topup_amount_credits',
        rate: 1,
        description: 'Auto top-up amount in credits',
      },
    ];

    for (const rate of exchangeRates) {
      await prisma.exchangeRate.create({
        data: rate,
      });
      console.log(`Created exchange rate: ${rate.name} = ${rate.rate}`);
    }

    console.log('Exchange rates seeded successfully');
  } catch (error) {
    console.error('Error seeding exchange rates:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedExchangeRates();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedExchangeRates };
