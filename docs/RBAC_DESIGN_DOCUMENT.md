# RBAC Design Document

## Overview

This document provides a comprehensive overview of the Role-Based Access Control (RBAC) system implemented in Smart AI Hub. The system has been designed to provide flexible, granular permission management through many-to-many relationships between users, roles, and permissions.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Model](#data-model)
3. [Permission Checking Flow](#permission-checking-flow)
4. [Junction Tables](#junction-tables)
5. [Caching Strategy](#caching-strategy)
6. [Migration Strategy](#migration-strategy)
7. [API Endpoints](#api-endpoints)
8. [Security Considerations](#security-considerations)
9. [Performance Optimizations](#performance-optimizations)
10. [Future Enhancements](#future-enhancements)

## System Architecture

The RBAC system is built on a three-tier model:

1. **Users**: Individual system users who can be assigned multiple roles
2. **Roles**: Collections of permissions that can be assigned to users
3. **Permissions**: Granular access rights to specific resources and actions

### Key Design Principles

- **Many-to-Many Relationships**: Users can have multiple roles, and roles can have multiple permissions
- **Junction Tables**: Use of intermediate tables to maintain referential integrity
- **Permission Caching**: Redis-based caching for performance optimization
- **Atomic Operations**: All permission checks are atomic and consistent
- **Audit Trail**: All role assignments and permission grants are tracked with timestamps

## Data Model

### Core Tables

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Permissions Table

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  resource VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource, action)
);
```

### Junction Tables

#### UserRole Junction Table

```sql
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

#### RolePermission Junction Table

```sql
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);
```

## Permission Checking Flow

The permission checking process follows these steps:

1. **Extract User Information**: Get user ID and roles from JWT token
2. **Cache Check**: Check Redis for cached permission result
3. **Database Query**: If not cached, query the database through junction tables
4. **Cache Result**: Store the result in Redis with TTL
5. **Return Decision**: Allow or deny access based on permission check

### Permission Check Algorithm

```typescript
async function checkPermission(
  userId: string,
  resource: string,
  action: string,
  userRoles: string[]
): Promise<boolean> {
  // 1. Check cache first
  const cacheKey = `perms:${userId}:${resource}:${action}`;
  const cached = await redis.get(cacheKey);
  if (cached === 'true') return true;
  if (cached === 'false') return false;

  // 2. Query database through junction tables
  const hasPermission = await prisma.permission.findFirst({
    where: {
      resource,
      action,
      roles: {
        some: {
          id: { in: userRoles },
          users: {
            some: {
              userId,
            },
          },
        },
      },
    },
  });

  // 3. Cache the result
  await redis.setex(cacheKey, 3600, hasPermission ? 'true' : 'false');

  return !!hasPermission;
}
```

## Junction Tables

### UserRole Junction Table

The `user_roles` table manages the many-to-many relationship between users and roles:

- **Purpose**: Links users to roles with assignment tracking
- **Key Fields**: `user_id`, `role_id`, `assigned_at`
- **Constraints**: Composite primary key on (user_id, role_id)
- **Cascade Delete**: Automatic cleanup when user or role is deleted

### RolePermission Junction Table

The `role_permissions` table manages the many-to-many relationship between roles and permissions:

- **Purpose**: Links roles to permissions with grant tracking
- **Key Fields**: `role_id`, `permission_id`, `granted_at`
- **Constraints**: Composite primary key on (role_id, permission_id)
- **Cascade Delete**: Automatic cleanup when role or permission is deleted

## Caching Strategy

### Redis Cache Structure

- **Key Pattern**: `perms:{userId}:{resource}:{action}`
- **TTL**: 1 hour (3600 seconds)
- **Values**: "true" or "false" strings
- **Invalidation**: Manual invalidation when permissions change

### Cache Invalidation

The cache is invalidated when:

1. User roles are modified
2. Role permissions are modified
3. Permissions are modified
4. Explicit cache flush is requested

```typescript
async function invalidateUserPermissionCache(userId: string): Promise<void> {
  const pattern = `perms:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

## Migration Strategy

The migration from the previous single-role system to the new many-to-many RBAC system involved:

1. **Phase 1**: Create new tables and columns
2. **Phase 2**: Migrate existing data
3. **Phase 3**: Update application code
4. **Phase 4**: Verify and clean up

### Data Migration Steps

1. Create new `permissions` table with default permissions
2. Create `user_roles` and `role_permissions` junction tables
3. Migrate existing user roles to new structure
4. Populate default permissions for existing roles
5. Update JWT token structure to include roles array
6. Deploy updated application code

## API Endpoints

### Role Management

- `GET /api/roles` - List all roles
- `POST /api/roles` - Create new role
- `GET /api/roles/:id` - Get role details
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role (if not system role)

### Permission Management

- `GET /api/permissions` - List all permissions
- `POST /api/permissions` - Create new permission
- `GET /api/permissions/:id` - Get permission details
- `PUT /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission

### User Role Management

- `GET /api/users/:id/roles` - Get user roles
- `POST /api/users/:id/roles` - Assign role to user
- `DELETE /api/users/:id/roles/:roleId` - Remove role from user

### Role Permission Management

- `GET /api/roles/:id/permissions` - Get role permissions
- `POST /api/roles/:id/permissions` - Grant permission to role
- `DELETE /api/roles/:id/permissions/:permissionId` - Revoke permission from role

## Security Considerations

### Protection Against Common Vulnerabilities

1. **Privilege Escalation**: All permission checks are server-side and cannot be bypassed
2. **Race Conditions**: Database constraints prevent duplicate role assignments
3. **Cache Poisoning**: Cache keys are specific to user-resource-action combinations
4. **Data Integrity**: Foreign key constraints ensure referential integrity

### System Roles

System roles are marked with `is_system = true` and cannot be deleted:

- **admin**: Full system access
- **manager**: Management access with some limitations
- **user**: Standard user access
- **guest**: Minimal access for unauthenticated users

### Audit Trail

All role assignments and permission grants are tracked:

- **User Role Assignment**: `assigned_at` timestamp
- **Role Permission Grant**: `granted_at` timestamp
- **Full Audit Log**: Optional comprehensive logging of all permission checks

## Performance Optimizations

### Database Optimizations

1. **Indexing Strategy**:
   - Primary keys on all tables
   - Unique constraints on user_roles and role_permissions
   - Indexes on resource and action columns in permissions table

2. **Query Optimization**:
   - JOIN queries through junction tables
   - Optimized permission check queries
   - Connection pooling with Prisma

### Caching Optimizations

1. **Multi-Level Caching**:
   - Application-level permission cache
   - Redis distributed cache
   - Database query result caching

2. **Cache Warm-up**:
   - Pre-cache common permissions
   - Cache user roles on login
   - Background refresh for frequently accessed permissions

### Monitoring and Metrics

1. **Permission Check Latency**: Track average permission check time
2. **Cache Hit Rate**: Monitor cache effectiveness
3. **Database Query Performance**: Track slow queries
4. **Error Rates**: Monitor permission denied events

## Future Enhancements

### Planned Features

1. **Hierarchical Roles**: Support for role inheritance
2. **Attribute-Based Access Control (ABAC)**: Policy-based access control
3. **Time-Based Permissions**: Temporary or expiring permissions
4. **IP-Based Restrictions**: Location-based access control
5. **Multi-Tenant Support**: Organization-based permission isolation

### Scalability Considerations

1. **Permission Partitioning**: Sharding by user or resource
2. **Read Replicas**: Separate read replicas for permission checks
3. **Event-Driven Updates**: Event sourcing for permission changes
4. **GraphQL Integration**: Fine-grained permission queries

## Conclusion

The RBAC system implemented in Smart AI Hub provides a robust, scalable, and flexible permission management solution. The many-to-many relationship design allows for granular control while maintaining simplicity in user management. The caching strategy ensures high performance, and the migration approach minimizes disruption to existing users.

The system is designed to evolve with the growing needs of the platform while maintaining security and performance standards.
