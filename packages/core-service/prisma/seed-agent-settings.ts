import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAgentSettings() {
  console.log('Starting Agent Settings seed...');

  // Find or create a system user for updated_by field
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@smarthub.ai' },
  });

  if (!systemUser) {
    // Create a system user if it doesn't exist
    systemUser = await prisma.user.create({
      data: {
        email: 'system@smarthub.ai',
        passwordHash: 'system_user_no_login',
        verified: true,
        tier: 'administrator',
        credits: 999999,
        points: 999999,
      },
    });
  }

  // Default Agent Settings
  const agentSettings = [
    {
      key: 'agentmarkuppercentage',
      value: '15',
      description: 'Default markup percentage for agent costs (e.g., 15 = 15% markup)',
      dataType: 'number',
    },
    {
      key: 'agentdefaulttimeout',
      value: '300',
      description: 'Default timeout for agent execution in seconds',
      dataType: 'number',
    },
    {
      key: 'agentmaxtokens',
      value: '4000',
      description: 'Maximum tokens allowed for agent execution',
      dataType: 'number',
    },
    {
      key: 'agentmaxconcurrent',
      value: '10',
      description: 'Maximum concurrent agent executions per user',
      dataType: 'number',
    },
    {
      key: 'agentcostper1ktokens',
      value: '0.02',
      description: 'Base cost per 1000 tokens for GPT-3.5-turbo (in credits)',
      dataType: 'decimal',
    },
    {
      key: 'agentcostper1ktokensgpt4',
      value: '0.10',
      description: 'Base cost per 1000 tokens for GPT-4 (in credits)',
      dataType: 'decimal',
    },
    {
      key: 'agentcostper1ktokensgpt4turbo',
      value: '0.03',
      description: 'Base cost per 1000 tokens for GPT-4 Turbo (in credits)',
      dataType: 'decimal',
    },
    {
      key: 'agentmaxexecutiontime',
      value: '600',
      description: 'Maximum execution time for agents in seconds',
      dataType: 'number',
    },
    {
      key: 'agentenableusageanalytics',
      value: 'true',
      description: 'Enable usage analytics tracking for agents',
      dataType: 'boolean',
    },
    {
      key: 'agentdefaultmodel',
      value: 'gpt-3.5-turbo',
      description: 'Default model for agent execution',
      dataType: 'string',
    },
  ];

  console.log('Creating agent settings...');
  const createdSettings = await Promise.all(
    agentSettings.map((setting) =>
      prisma.agentSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description,
          dataType: setting.dataType,
          updatedBy: systemUser.id,
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          dataType: setting.dataType,
          updatedBy: systemUser.id,
        },
      })
    )
  );

  console.log('Agent Settings seed completed successfully!');
  console.log(`Created ${createdSettings.length} agent settings`);

  // Print settings summary
  for (const setting of createdSettings) {
    console.log(`- ${setting.key}: ${setting.value} (${setting.dataType})`);
  }
}

seedAgentSettings()
  .catch((e) => {
    console.error('Error during Agent Settings seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
