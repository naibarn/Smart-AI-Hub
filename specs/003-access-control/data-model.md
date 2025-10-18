# Data Model Specification: Access Control & Permissions

## Overview

This document defines the data models for the Access Control & Permissions feature (FEAT-002), which implements a Role-Based Access Control (RBAC) system with hierarchical roles and fine-grained permissions.

## Database Schema

### Permissions Table

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL
);

-- Unique constraint on resource-action combination
CREATE UNIQUE INDEX idx_permissions_resource_action ON permissions(resource, action);

-- Index for permission lookups
CREATE INDEX idx_permissions_name ON permissions(name);
```

### Roles Table

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key for role hierarchy
ALTER TABLE roles ADD CONSTRAINT fk_roles_parent 
    FOREIGN KEY (parent_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_parent_id ON roles(parent_id);

-- Prevent circular references in role hierarchy
CREATE CONSTRAINT check_no_circular_reference 
    CHECK (id != parent_id);
```

### Role Permissions Table

```sql
CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
```

## Prisma Schema Definition

```prisma
model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  resource    String   // users, credits, services
  action      String   // create, read, update, delete

  roles       RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String
  parentId    String?  @map("parent_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Self-referencing relationship for hierarchy
  parent      Role?           @relation("RoleHierarchy", fields: [parentId], references: [id])
  children    Role[]          @relation("RoleHierarchy")
  
  // Relationships to other entities
  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}

model RolePermission {
  roleId       String   @map("role_id")
  permissionId String   @map("permission_id")

  // Relations
  role       Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}
```

## Entity Relationships

### Permission Entity
- **Primary Key**: id (UUID)
- **Unique Fields**: name, resource+action combination
- **Attributes**:
  - `name`: Human-readable permission name (e.g., "user.create")
  - `resource`: Resource type (users, credits, services, etc.)
  - `action`: Action type (create, read, update, delete, etc.)
- **Relationships**:
  - One-to-many with RolePermission

### Role Entity
- **Primary Key**: id (UUID)
- **Unique Fields**: name
- **Attributes**:
  - `name`: Unique role name (e.g., "admin", "moderator", "user")
  - `description`: Role description
  - `parentId`: Reference to parent role for inheritance
  - `createdAt`: Role creation timestamp
  - `updatedAt`: Last update timestamp
- **Relationships**:
  - Self-referencing parent-child relationship for hierarchy
  - One-to-many with UserRole
  - One-to-many with RolePermission

### RolePermission Entity
- **Composite Primary Key**: roleId + permissionId
- **Foreign Keys**: roleId (references Role), permissionId (references Permission)
- **Relationships**:
  - Many-to-one with Role
  - Many-to-one with Permission

## Data Validation Rules

### Permission Entity Validation
- **name**: Must be unique, follow pattern "resource.action"
- **resource**: Must be a valid resource type defined in the system
- **action**: Must be a valid action type (create, read, update, delete, etc.)
- **resource+action**: Combination must be unique

### Role Entity Validation
- **name**: Must be unique, cannot be empty
- **description**: Optional but recommended
- **parentId**: Must reference an existing role or be null
- **Hierarchy**: Cannot create circular references
- **Deletion**: Cannot delete role if assigned to users

### RolePermission Entity Validation
- **roleId**: Must reference an existing role
- **permissionId**: Must reference an existing permission
- **Uniqueness**: Role-permission combination must be unique

## Security Considerations

### Access Control Enforcement
- Permission checks must be performed at multiple layers
- Database access must be controlled by application-level permissions
- Sensitive operations must require multiple permissions
- Permission inheritance must be properly implemented and secured

### Data Protection
- Role and permission data must be protected from unauthorized modification
- Audit logs must track all permission changes
- Permission caches must be properly secured
- Role hierarchy must be protected from manipulation

### Performance Security
- Permission checks must be optimized to prevent timing attacks
- Caching mechanisms must not expose permission information
- Error messages must not reveal sensitive permission information

## Performance Optimization

### Indexing Strategy
- Primary key indexes on all tables
- Unique indexes on permission resource-action combinations
- Composite indexes on role-permission relationships
- Indexes for frequently queried role hierarchy paths

### Query Optimization
- Use recursive queries for role hierarchy resolution
- Implement efficient permission aggregation algorithms
- Optimize database queries for complex permission checks
- Consider materialized views for complex permission calculations

### Caching Strategy
- Cache user permissions with appropriate TTL
- Cache role-permission mappings for frequently accessed roles
- Implement cache invalidation on permission changes
- Consider distributed caching for high-availability scenarios

## Migration Strategy

### Initial Migration
```sql
-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL
);

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create indexes
CREATE UNIQUE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_parent_id ON roles(parent_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Add foreign key constraints
ALTER TABLE roles ADD CONSTRAINT fk_roles_parent 
    FOREIGN KEY (parent_id) REFERENCES roles(id) ON DELETE SET NULL;
```

### Seed Data
```sql
-- Insert basic permissions
INSERT INTO permissions (name, resource, action) VALUES
('user.create', 'users', 'create'),
('user.read', 'users', 'read'),
('user.update', 'users', 'update'),
('user.delete', 'users', 'delete'),
('credit.create', 'credits', 'create'),
('credit.read', 'credits', 'read'),
('credit.update', 'credits', 'update'),
('credit.delete', 'credits', 'delete');

-- Insert basic roles
INSERT INTO roles (name, description) VALUES
('admin', 'System administrator with full access'),
('moderator', 'Content moderator with limited administrative access'),
('user', 'Regular user with basic access');

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin';
```

### Future Schema Changes
- All schema changes must maintain backward compatibility
- Role hierarchy changes must be carefully tested
- Permission changes must consider existing assignments
- Use database migrations for all structural changes

## Cross-References

- [Access Control Specification](spec.md)
- [User Management & Profiles](../002-user-management/spec.md)
- [User Authentication & Authorization](../001-user-authentication/spec.md)
- [API Specification](contracts/api-spec.json)