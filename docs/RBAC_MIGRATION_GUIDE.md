# RBAC Migration Guide

This guide helps developers migrate their code to work with the new Role-Based Access Control (RBAC) system.

## Overview of Changes

The authentication and authorization system has been significantly refactored to implement a proper RBAC system with many-to-many relationships between users, roles, and permissions.

## Key API Changes

### User Model Changes

#### Before

```javascript
// User had single role
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { role: true },
});

// Check if user is verified
if (user.emailVerified) {
  // ...
}
```

#### After

```javascript
// User has multiple roles
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    userRoles: {
      include: { role: true },
    },
  },
});

// Extract roles array
const roles = user.userRoles.map((ur) => ur.role.name);

// Check if user is verified
if (user.verified) {
  // ...
}
```

### Permission Checking

#### Before

```javascript
// Permissions were stored in role as JSON
const permissions = user.role.permissions;
if (permissions.includes('users:delete')) {
  // Allow action
}
```

#### After

```javascript
// Use permission service to check permissions
const hasPermission = await permissionService.hasPermission(userId, 'users', 'delete');

if (hasPermission) {
  // Allow action
}
```

### Middleware Usage

#### Before

```javascript
// Single role check
const requireAdmin = requireRole('admin');
app.delete('/users/:id', requireAdmin, deleteUser);
```

#### After

```javascript
// Multiple roles or permission check
const requireAdminOrManager = requireRoles(['admin', 'manager']);
app.delete('/users/:id', requireAdminOrManager, deleteUser);

// Or check specific permission
const requireUserDelete = requirePermission('users', 'delete');
app.delete('/users/:id', requireUserDelete, deleteUser);

// Or allow access to own resources or admin
const requireSelfOrAdmin = requireSelfOrRole(['admin']);
app.get('/users/:id', requireSelfOrAdmin, getUser);
```

### JWT Token Structure

#### Before

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "roleId": "role-id",
  "role": "admin"
}
```

#### After

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "roles": ["admin", "user"],
  "permissions": ["users:read", "users:write", "credits:read"]
}
```

### Credit Account Operations

#### Before

```javascript
// Multiple balance fields
const account = await prisma.creditAccount.findUnique({
  where: { userId },
});

console.log(account.currentBalance);
console.log(account.totalPurchased);
console.log(account.totalUsed);
```

#### After

```javascript
// Single balance field
const account = await prisma.creditAccount.findUnique({
  where: { userId },
});

console.log(account.balance);
// Historical data available in credit transactions
```

## Code Migration Steps

### 1. Update User Queries

Replace all single role queries with many-to-many relationship queries:

```javascript
// Old
const userWithRole = await prisma.user.findUnique({
  where: { id: userId },
  include: { role: true },
});

// New
const userWithRoles = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    userRoles: {
      include: { role: true },
    },
  },
});
```

### 2. Update Permission Checks

Replace hardcoded permission checks with service calls:

```javascript
// Old
if (user.role.permissions.includes('users:delete')) {
  // Allow action
}

// New
const hasPermission = await permissionService.hasPermission(userId, 'users', 'delete');
if (hasPermission) {
  // Allow action
}
```

### 3. Update Middleware

Replace role-based middleware with new RBAC middleware:

```javascript
// Old
const requireAdmin = requireRole('admin');

// New
const requireAdmin = requireRoles(['admin']);
// Or better yet, use permission-based
const requireUserDelete = requirePermission('users', 'delete');
```

### 4. Update Credit Operations

Simplify credit account operations:

```javascript
// Old
await prisma.creditAccount.update({
  where: { userId },
  data: {
    currentBalance: newBalance,
    totalUsed: totalUsed + amount,
  },
});

// New
await prisma.creditAccount.update({
  where: { userId },
  data: { balance: newBalance },
});
```

## Database Migration

The migration files handle the database transformation automatically. However, if you need to run manual queries:

### Create User Roles

```sql
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT id, role_id, NOW()
FROM users
WHERE role_id IS NOT NULL;
```

### Create Role Permissions

```sql
-- This is handled by the migration script
-- Permissions are extracted from the old JSON format
```

### Update Credit Accounts

```sql
UPDATE credit_accounts
SET balance = current_balance;
```

## Testing Your Changes

1. **Run the test suite** to ensure compatibility:

   ```bash
   npm test
   ```

2. **Test authentication flows**:
   - Login with existing users
   - Verify JWT token structure
   - Test role-based access

3. **Test permission checks**:
   - Verify users can access resources based on roles
   - Test permission inheritance
   - Validate resource ownership checks

## Common Issues and Solutions

### Issue: "permissionService.hasPermission is not a function"

**Solution**: Make sure you're importing the permission service correctly:

```javascript
import * as permissionService from '../services/permission.service';
```

### Issue: "user.role is undefined"

**Solution**: Update your queries to include the userRoles relationship:

```javascript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { userRoles: { include: { role: true } } },
});
```

### Issue: "balance field does not exist"

**Solution**: Regenerate Prisma client:

```bash
npx prisma generate
```

## Best Practices

1. **Use permission-based checks** rather than role-based checks when possible
2. **Leverage the requireSelfOrRole middleware** for user-owned resources
3. **Cache permissions** in your service layer for better performance
4. **Use transactions** when updating permissions or roles
5. **Log role and permission changes** for audit purposes

## Getting Help

If you encounter issues during migration:

1. Check the [RBAC Implementation Documentation](./RBAC_IMPLEMENTATION.md)
2. Review the test files for examples
3. Check the migration files for understanding data transformations
4. Contact the development team for assistance

## Timeline

- **Phase 1**: Backend migration completed
- **Phase 2**: Frontend integration (pending)
- **Phase 3**: Admin UI for role/permission management (pending)
- **Phase 4**: Full production rollout (pending)

Make sure to complete your migration before Phase 2 begins to ensure compatibility.
