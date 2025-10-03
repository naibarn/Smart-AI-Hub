import { PrismaClient, Permission, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting RBAC database seed...');

  // Create permissions
  const permissions: Array<{
    name: string;
    resource: string;
    action: string;
    description: string;
  }> = [
    // User permissions
    { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
    { name: 'users:read', resource: 'users', action: 'read', description: 'Read user information' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Update user information' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
    
    // Credit permissions
    { name: 'credits:read', resource: 'credits', action: 'read', description: 'Read credit information' },
    { name: 'credits:update', resource: 'credits', action: 'update', description: 'Update credit information' },
    { name: 'credits:adjust', resource: 'credits', action: 'adjust', description: 'Adjust user credits' },
    
    // Service permissions
    { name: 'services:use', resource: 'services', action: 'use', description: 'Use services' },
    { name: 'services:read', resource: 'services', action: 'read', description: 'Read service information' },
    { name: 'services:configure', resource: 'services', action: 'configure', description: 'Configure services' },
    
    // Role permissions
    { name: 'roles:read', resource: 'roles', action: 'read', description: 'Read role information' },
    { name: 'roles:assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },
  ];

  console.log('Creating permissions...');
  const createdPermissions = await Promise.all(
    permissions.map(permission =>
      prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission,
      })
    )
  );

  // Create roles
  const roles = [
    {
      name: 'superadmin',
      description: 'Super administrator with all permissions',
    },
    {
      name: 'admin',
      description: 'Administrator with management permissions',
    },
    {
      name: 'manager',
      description: 'Manager with team and credit permissions',
    },
    {
      name: 'user',
      description: 'Regular user with basic permissions',
    },
    {
      name: 'guest',
      description: 'Guest with limited permissions',
    },
  ];

  console.log('Creating roles...');
  const createdRoles = await Promise.all(
    roles.map(role =>
      prisma.role.upsert({
        where: { name: role.name },
        update: role,
        create: role,
      })
    )
  );

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');

  // Superadmin gets all permissions
  const superadminRole = createdRoles.find((r: Role) => r.name === 'superadmin')!;
  await Promise.all(
    createdPermissions.map((permission: Permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superadminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superadminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Admin gets most permissions except superadmin-specific ones
  const adminRole = createdRoles.find((r: Role) => r.name === 'admin')!;
  const adminPermissions = createdPermissions.filter((p: Permission) =>
    !p.name.includes('superadmin') && 
    p.name !== 'roles:assign' // Admin can't assign roles, only superadmin can
  );
  await Promise.all(
    adminPermissions.map((permission: Permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Manager gets limited permissions
  const managerRole = createdRoles.find((r: Role) => r.name === 'manager')!;
  const managerPermissions = createdPermissions.filter((p: Permission) =>
    p.name === 'users:read' ||
    p.name === 'credits:read' ||
    p.name === 'credits:update' ||
    p.name === 'credits:adjust' ||
    p.name === 'services:read' ||
    p.name === 'roles:read'
  );
  await Promise.all(
    managerPermissions.map((permission: Permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // User gets basic permissions
  const userRole = createdRoles.find((r: Role) => r.name === 'user')!;
  const userPermissions = createdPermissions.filter((p: Permission) =>
    p.name === 'users:read' ||
    p.name === 'credits:read' ||
    p.name === 'services:use' ||
    p.name === 'services:read'
  );
  await Promise.all(
    userPermissions.map((permission: Permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: userRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Guest gets very limited permissions
  const guestRole = createdRoles.find((r: Role) => r.name === 'guest')!;
  const guestPermissions = createdPermissions.filter((p: Permission) =>
    p.name === 'services:use' // Guests can only use services
  );
  await Promise.all(
    guestPermissions.map((permission: Permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: guestRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: guestRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  console.log('RBAC database seed completed successfully!');
  console.log(`Created ${createdPermissions.length} permissions`);
  console.log(`Created ${createdRoles.length} roles`);
  
  // Print role summary
  for (const role of createdRoles) {
    const permissionCount = await prisma.rolePermission.count({
      where: { roleId: role.id },
    });
    console.log(`- ${role.name}: ${permissionCount} permissions`);
  }
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });