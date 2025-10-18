---
title: 'User Visibility Rules Addendum'
author: 'Development Team'
version: '1.0.0'
status: 'draft'
priority: 'high'
created_at: '2025-10-16'
updated_at: '2025-10-16'
type: 'specification'
description: "Focused addendum document for User Visibility Rules in Smart AI Hub's Multi-tier Hierarchy System"
---

# User Visibility Rules Addendum

## 1. Overview

This addendum document provides detailed specifications for the User Visibility Rules system within Smart AI Hub's Multi-tier Hierarchy architecture. The visibility system is a critical security component that enforces data access restrictions based on user tiers and hierarchical relationships. This document serves as a comprehensive reference for understanding, implementing, and maintaining the visibility enforcement mechanisms that prevent unauthorized data access while enabling legitimate business operations within the hierarchy structure.

## 2. Visibility Rules Matrix

### 2.1 Complete Visibility Matrix

| Viewer Tier   | Can View                                                                           | Cannot View                                                     | Conditions                                                               |
| ------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Administrator | All users in system                                                                | None                                                            | No restrictions - full system visibility                                 |
| Agency        | Own Organizations + their Admins + their Generals                                  | Other Agencies, Administrators, users not under their Agency    | Must be directly under the Agency or in an Organization under the Agency |
| Organization  | Own Admins + own Generals + parent Agency (basic info)                             | Other Organizations, Agencies, users outside their Organization | Must be in the same Organization or the parent Agency                    |
| Admin         | Generals in same org + other Admins in same org + parent Organization (basic info) | Users outside their Organization, Organizations, Agencies       | Must be in the same Organization                                         |
| General       | Self only + parent Organization (basic info) + Admins in same org (contact info)   | All other users                                                 | Can only see their own profile and limited org information               |

### 2.2 Visibility Implementation Details

**Administrator Tier Visibility:**

- Can view all user profiles in the system
- Can view all user attributes including sensitive information
- Can access all user management functions
- Can bypass all visibility restrictions for administrative purposes
- Can view all hierarchy relationships regardless of depth

**Agency Tier Visibility:**

- Can view all Organizations where `parentAgencyId` equals their user ID
- Can view all Admins and Generals in Organizations under their Agency
- Can view limited profile information for users in their hierarchy
- Cannot view other Agencies or their hierarchical relationships
- Cannot view Administrators or system-level information

**Organization Tier Visibility:**

- Can view all Admins where `parentOrganizationId` equals their user ID
- Can view all Generals where `parentOrganizationId` equals their user ID
- Can view basic information about their parent Agency
- Cannot view users in other Organizations
- Cannot view other Organizations or Agencies
- Cannot view Administrator users

**Admin Tier Visibility:**

- Can view all Generals in the same Organization
- Can view other Admins in the same Organization
- Can view basic contact information for parent Organization
- Cannot view Generals in other Organizations
- Cannot view Organizations or Agencies
- Cannot view Administrator users

**General Tier Visibility:**

- Can view their own complete profile information
- Can view basic information about their parent Organization
- Can view basic contact information for Admins in their Organization
- Cannot view other General users
- Cannot view member lists or user directories
- Cannot view any organizational hierarchy beyond their immediate parent

## 3. Authorization Checks

### 3.1 checkUserVisibility Function Implementation

```typescript
async function checkUserVisibility(
  currentUserId: string,
  targetUserId: string,
  context: VisibilityContext = {}
): Promise<VisibilityResult>;
```

**Function Parameters:**

- `currentUserId`: The ID of the user attempting to view another user
- `targetUserId`: The ID of the user being viewed
- `context`: Optional context object with additional visibility parameters

**Return Value:**

```typescript
interface VisibilityResult {
  canView: boolean; // Whether visibility is allowed
  reason?: string; // Explanation of visibility decision
  filteredFields?: string[]; // Fields that must be filtered out
  accessLevel: VisibilityAccessLevel; // Level of access granted
}

enum VisibilityAccessLevel {
  FULL = 'full', // Complete access to all user data
  BASIC = 'basic', // Limited access to basic information
  CONTACT = 'contact', // Contact information only
  NONE = 'none', // No access allowed
}
```

### 3.2 Visibility Logic Implementation

**Step 1: User Retrieval**

```typescript
const currentUser = await prisma.user.findUnique({
  where: { id: currentUserId },
  select: {
    tier: true,
    parentAgencyId: true,
    parentOrganizationId: true,
    isBlocked: true,
  },
});

const targetUser = await prisma.user.findUnique({
  where: { id: targetUserId },
  select: {
    tier: true,
    parentAgencyId: true,
    parentOrganizationId: true,
    isBlocked: true,
  },
});
```

**Step 2: Basic Validations**

```typescript
// Check if users exist
if (!currentUser || !targetUser) {
  return { canView: false, reason: 'User not found', accessLevel: VisibilityAccessLevel.NONE };
}

// Check if current user is blocked
if (currentUser.isBlocked) {
  return {
    canView: false,
    reason: 'Current user is blocked',
    accessLevel: VisibilityAccessLevel.NONE,
  };
}

// Check if target user is blocked (unless current user is Administrator)
if (targetUser.isBlocked && currentUser.tier !== 'administrator') {
  return {
    canView: false,
    reason: 'Target user is blocked',
    accessLevel: VisibilityAccessLevel.NONE,
  };
}
```

**Step 3: Tier-Based Visibility Rules**

```typescript
switch (currentUser.tier) {
  case 'administrator':
    return { canView: true, accessLevel: VisibilityAccessLevel.FULL };

  case 'agency':
    return checkAgencyVisibility(currentUser, targetUser);

  case 'organization':
    return checkOrganizationVisibility(currentUser, targetUser);

  case 'admin':
    return checkAdminVisibility(currentUser, targetUser);

  case 'general':
    return checkGeneralVisibility(currentUser, targetUser);

  default:
    return { canView: false, reason: 'Invalid user tier', accessLevel: VisibilityAccessLevel.NONE };
}
```

**Step 4: Agency Visibility Check**

```typescript
function checkAgencyVisibility(agency: User, target: User): VisibilityResult {
  // Agency can see Organizations directly under them
  if (target.tier === 'organization' && target.parentAgencyId === agency.id) {
    return { canView: true, accessLevel: VisibilityAccessLevel.BASIC };
  }

  // Agency can see Admins in their Organizations
  if (target.tier === 'admin') {
    return checkAgencyToAdminVisibility(agency, target);
  }

  // Agency can see Generals directly under them or in their Organizations
  if (target.tier === 'general') {
    if (target.parentAgencyId === agency.id) {
      return { canView: true, accessLevel: VisibilityAccessLevel.BASIC };
    }
    return checkAgencyToGeneralInOrgVisibility(agency, target);
  }

  return {
    canView: false,
    reason: 'Agency cannot view this user type',
    accessLevel: VisibilityAccessLevel.NONE,
  };
}
```

### 3.3 Middleware Implementation

**Visibility Check Middleware:**

```typescript
export async function visibilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const currentUserId = req.user?.id;
  const targetUserId = req.params.userId || req.query.userId;

  if (!currentUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (targetUserId && targetUserId !== currentUserId) {
    const visibilityResult = await checkUserVisibility(currentUserId, targetUserId);

    if (!visibilityResult.canView) {
      return res.status(403).json({
        error: 'Access denied',
        reason: visibilityResult.reason,
      });
    }

    // Store visibility result for use in route handlers
    req.visibility = visibilityResult;
  }

  next();
}
```

**List Visibility Middleware:**

```typescript
export async function listVisibilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const currentUserId = req.user?.id;

  if (!currentUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Build visibility filter based on user tier
  const visibilityFilter = await buildVisibilityFilter(currentUserId);

  // Store filter for use in route handlers
  req.visibilityFilter = visibilityFilter;

  next();
}

async function buildVisibilityFilter(userId: string): Promise<Prisma.UserWhereInput> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, id: true, parentAgencyId: true, parentOrganizationId: true },
  });

  switch (currentUser?.tier) {
    case 'administrator':
      return {}; // No filter for administrator

    case 'agency':
      return {
        OR: [
          { tier: 'organization', parentAgencyId: currentUser.id },
          { tier: 'general', parentAgencyId: currentUser.id },
          {
            tier: 'admin',
            parentOrganization: { parentAgencyId: currentUser.id },
          },
          {
            tier: 'general',
            parentOrganization: { parentAgencyId: currentUser.id },
          },
        ],
      };

    case 'organization':
      return {
        parentOrganizationId: currentUser.id,
        tier: { in: ['admin', 'general'] },
      };

    case 'admin':
      return {
        parentOrganizationId: currentUser.parentOrganizationId,
        tier: 'general',
      };

    case 'general':
      return { id: currentUser.id }; // Can only see self

    default:
      return { id: 'never-matches-anything' }; // No visibility
  }
}
```

## 4. Security Considerations

### 4.1 Critical Security Requirements

**Server-Side Enforcement:**

- All visibility checks MUST be performed server-side
- Client-side filtering is supplementary only and must not be relied upon for security
- API responses must never include data that users cannot see
- Visibility checks must be applied before any database queries are executed

**Defense in Depth:**

- Multiple layers of visibility enforcement must be implemented
- Database queries must include visibility filters
- Response data must be sanitized based on visibility rules
- API endpoints must validate visibility before returning data

**Audit and Monitoring:**

- All visibility checks must be logged for security monitoring
- Repeated visibility violations must trigger alerts
- Unauthorized access attempts must be tracked and reported
- Visibility rule bypass attempts must be investigated immediately

### 4.2 Threat Scenarios and Mitigations

**Threat Scenario 1: Agency A attempting to view Agency B's data**

- **Attack Vector:** Manipulating API parameters to access users outside Agency A's hierarchy
- **Potential Impact:** Data breach, competitive intelligence disclosure
- **Mitigation:** Strict visibility checks in all API endpoints, database query filtering, audit logging of all access attempts
- **Detection:** Monitor for cross-agency access attempts, alert on repeated violations

**Threat Scenario 2: Organization attempting to view users outside their organization**

- **Attack Vector:** Direct API calls to user endpoints with user IDs from other organizations
- **Potential Impact:** Internal data leakage, privacy violations
- **Mitigation:** Organization-level visibility enforcement, query parameter validation, response sanitization
- **Detection:** Log and monitor organization boundary violations

**Threat Scenario 3: Admin attempting to access users in other organizations**

- **Attack Vector:** Using shared credentials or session tokens to access other organizations
- **Potential Impact:** Horizontal privilege escalation, data exposure
- **Mitigation:** Session validation, organization context verification, IP-based monitoring
- **Detection:** Monitor for concurrent access from multiple organizations

**Threat Scenario 4: General user attempting to access member lists**

- **Attack Vector:** Direct API calls to list endpoints without proper authorization
- **Potential Impact:** Privacy violation, data scraping
- **Mitigation:** Role-based access control, endpoint protection, rate limiting
- **Detection:** Monitor for unusual access patterns from General tier users

**Threat Scenario 5: API manipulation to bypass visibility filters**

- **Attack Vector:** Modifying API requests to bypass visibility middleware
- **Potential Impact:** Complete system compromise
- **Mitigation:** Input validation, middleware enforcement, defense in depth
- **Detection:** Comprehensive API monitoring, anomaly detection

### 4.3 Security Implementation Guidelines

**Input Validation:**

```typescript
function validateUserAccessInput(userId: string): boolean {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return false;
  }

  // Validate user exists
  return prisma.user.findUnique({ where: { id: userId } }) !== null;
}
```

**Rate Limiting:**

```typescript
// Apply stricter rate limiting to visibility-sensitive endpoints
const visibilityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply even stricter limits to General tier users
const generalUserRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Rate limit exceeded for General tier users',
});
```

**Audit Logging:**

```typescript
async function logVisibilityCheck(
  currentUserId: string,
  targetUserId: string,
  result: VisibilityResult,
  context: any
): Promise<void> {
  await prisma.visibilityAuditLog.create({
    data: {
      currentUserId,
      targetUserId,
      canView: result.canView,
      reason: result.reason,
      accessLevel: result.accessLevel,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      timestamp: new Date(),
    },
  });

  // Trigger alert for suspicious activity
  if (!result.canView && isSuspiciousPattern(currentUserId, targetUserId)) {
    await triggerSecurityAlert({
      type: 'VISIBILITY_VIOLATION',
      currentUserId,
      targetUserId,
      context,
    });
  }
}
```

## 5. Test Cases

### 5.1 Positive Test Cases

**Test Case 1: Administrator can view any user**

```typescript
describe('Administrator Visibility', () => {
  test('Administrator can view any user in the system', async () => {
    const admin = await createUser({ tier: 'administrator' });
    const agency = await createUser({ tier: 'agency' });
    const organization = await createUser({ tier: 'organization' });
    const adminUser = await createUser({ tier: 'admin' });
    const general = await createUser({ tier: 'general' });

    const result = await checkUserVisibility(admin.id, agency.id);
    expect(result.canView).toBe(true);
    expect(result.accessLevel).toBe(VisibilityAccessLevel.FULL);

    const result2 = await checkUserVisibility(admin.id, general.id);
    expect(result2.canView).toBe(true);
    expect(result2.accessLevel).toBe(VisibilityAccessLevel.FULL);
  });
});
```

**Test Case 2: Agency can view their Organizations**

```typescript
describe('Agency Visibility', () => {
  test('Agency can view Organizations under them', async () => {
    const agency = await createUser({ tier: 'agency' });
    const orgUnderAgency = await createUser({
      tier: 'organization',
      parentAgencyId: agency.id,
    });
    const orgNotUnderAgency = await createUser({
      tier: 'organization',
      parentAgencyId: 'other-agency-id',
    });

    const result = await checkUserVisibility(agency.id, orgUnderAgency.id);
    expect(result.canView).toBe(true);
    expect(result.accessLevel).toBe(VisibilityAccessLevel.BASIC);

    const result2 = await checkUserVisibility(agency.id, orgNotUnderAgency.id);
    expect(result2.canView).toBe(false);
  });
});
```

**Test Case 3: Organization can view their Admins and Generals**

```typescript
describe('Organization Visibility', () => {
  test('Organization can view Admins and Generals in their org', async () => {
    const organization = await createUser({ tier: 'organization' });
    const adminInOrg = await createUser({
      tier: 'admin',
      parentOrganizationId: organization.id,
    });
    const generalInOrg = await createUser({
      tier: 'general',
      parentOrganizationId: organization.id,
    });
    const adminOutsideOrg = await createUser({
      tier: 'admin',
      parentOrganizationId: 'other-org-id',
    });

    const result = await checkUserVisibility(organization.id, adminInOrg.id);
    expect(result.canView).toBe(true);

    const result2 = await checkUserVisibility(organization.id, generalInOrg.id);
    expect(result2.canView).toBe(true);

    const result3 = await checkUserVisibility(organization.id, adminOutsideOrg.id);
    expect(result3.canView).toBe(false);
  });
});
```

### 5.2 Negative Test Cases

**Test Case 4: Agency cannot view other Agencies**

```typescript
describe('Agency Visibility Restrictions', () => {
  test('Agency CANNOT view other Agencies', async () => {
    const agencyA = await createUser({ tier: 'agency' });
    const agencyB = await createUser({ tier: 'agency' });

    const result = await checkUserVisibility(agencyA.id, agencyB.id);
    expect(result.canView).toBe(false);
    expect(result.reason).toContain('cannot view this user type');
  });
});
```

**Test Case 5: Organization cannot view other Organizations**

```typescript
describe('Organization Visibility Restrictions', () => {
  test('Organization CANNOT view other Organizations', async () => {
    const orgA = await createUser({ tier: 'organization' });
    const orgB = await createUser({ tier: 'organization' });

    const result = await checkUserVisibility(orgA.id, orgB.id);
    expect(result.canView).toBe(false);
  });
});
```

**Test Case 6: Admin cannot view users outside their org**

```typescript
describe('Admin Visibility Restrictions', () => {
  test('Admin CANNOT view users outside their org', async () => {
    const adminA = await createUser({ tier: 'admin', parentOrganizationId: 'org-a-id' });
    const generalInOrgB = await createUser({
      tier: 'general',
      parentOrganizationId: 'org-b-id',
    });

    const result = await checkUserVisibility(adminA.id, generalInOrgB.id);
    expect(result.canView).toBe(false);
  });
});
```

**Test Case 7: General cannot view other Generals**

```typescript
describe('General Visibility Restrictions', () => {
  test('General CANNOT view other Generals even in same org', async () => {
    const org = await createUser({ tier: 'organization' });
    const generalA = await createUser({
      tier: 'general',
      parentOrganizationId: org.id,
    });
    const generalB = await createUser({
      tier: 'general',
      parentOrganizationId: org.id,
    });

    const result = await checkUserVisibility(generalA.id, generalB.id);
    expect(result.canView).toBe(false);
  });
});
```

### 5.3 Edge Cases

**Test Case 8: User changes tier**

```typescript
describe('Tier Change Visibility', () => {
  test('Visibility updates when user changes tier', async () => {
    const user = await createUser({ tier: 'general' });
    const admin = await createUser({ tier: 'admin' });

    // Initially general cannot see admin
    let result = await checkUserVisibility(user.id, admin.id);
    expect(result.canView).toBe(false);

    // Change user to admin in same organization
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: 'admin',
        parentOrganizationId: admin.parentOrganizationId,
      },
    });

    // Clear cache and check again
    await clearVisibilityCache(user.id);
    result = await checkUserVisibility(user.id, admin.id);
    expect(result.canView).toBe(true);
  });
});
```

**Test Case 9: User moves to different org**

```typescript
describe('Organization Change Visibility', () => {
  test('Visibility updates when user moves to different org', async () => {
    const orgA = await createUser({ tier: 'organization' });
    const orgB = await createUser({ tier: 'organization' });
    const admin = await createUser({
      tier: 'admin',
      parentOrganizationId: orgA.id,
    });
    const general = await createUser({
      tier: 'general',
      parentOrganizationId: orgA.id,
    });

    // Admin can see general initially
    let result = await checkUserVisibility(admin.id, general.id);
    expect(result.canView).toBe(true);

    // Move general to different organization
    await prisma.user.update({
      where: { id: general.id },
      data: { parentOrganizationId: orgB.id },
    });

    // Clear cache and check again
    await clearVisibilityCache(admin.id);
    result = await checkUserVisibility(admin.id, general.id);
    expect(result.canView).toBe(false);
  });
});
```

**Test Case 10: Blocked user visibility**

```typescript
describe('Blocked User Visibility', () => {
  test('Blocked users visibility handling', async () => {
    const admin = await createUser({ tier: 'admin' });
    const general = await createUser({ tier: 'general' });

    // Initially admin can see general
    let result = await checkUserVisibility(admin.id, general.id);
    expect(result.canView).toBe(true);

    // Block the general user
    await prisma.user.update({
      where: { id: general.id },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: 'Violation of terms',
      },
    });

    // Check visibility again
    result = await checkUserVisibility(admin.id, general.id);
    expect(result.canView).toBe(false);
    expect(result.reason).toContain('blocked');
  });
});
```

### 5.4 Integration Test Cases

**Test Case 11: API endpoint visibility enforcement**

```typescript
describe('API Visibility Enforcement', () => {
  test('API endpoints enforce visibility rules', async () => {
    const agencyA = await createUser({ tier: 'agency' });
    const agencyB = await createUser({ tier: 'agency' });
    const orgB = await createUser({
      tier: 'organization',
      parentAgencyId: agencyB.id,
    });

    const agencyAToken = generateToken(agencyA);

    // Try to access user from other agency through API
    const response = await request(app)
      .get(`/api/v1/users/${orgB.id}`)
      .set('Authorization', `Bearer ${agencyAToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Access denied');
  });
});
```

**Test Case 12: List API visibility filtering**

```typescript
describe('List API Visibility Filtering', () => {
  test('List APIs filter results based on visibility', async () => {
    const agency = await createUser({ tier: 'agency' });
    const orgUnderAgency = await createUser({
      tier: 'organization',
      parentAgencyId: agency.id,
    });
    const orgNotUnderAgency = await createUser({
      tier: 'organization',
      parentAgencyId: 'other-agency-id',
    });

    const agencyToken = generateToken(agency);

    const response = await request(app)
      .get('/api/v1/users')
      .query({ tier: 'organization' })
      .set('Authorization', `Bearer ${agencyToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(orgUnderAgency.id);
    expect(response.body.data.some((u) => u.id === orgNotUnderAgency.id)).toBe(false);
  });
});
```

### 5.5 Performance Test Cases

**Test Case 13: Visibility check performance**

```typescript
describe('Visibility Performance', () => {
  test('Visibility checks complete within performance requirements', async () => {
    const admin = await createUser({ tier: 'administrator' });
    const users = await createMultipleUsers(1000);

    const startTime = Date.now();

    for (const user of users) {
      await checkUserVisibility(admin.id, user.id);
    }

    const endTime = Date.now();
    const averageTime = (endTime - startTime) / users.length;

    expect(averageTime).toBeLessThan(50); // Should be under 50ms per check
  });
});
```

**Test Case 14: Concurrent visibility checks**

```typescript
describe('Concurrent Visibility', () => {
  test('System handles concurrent visibility checks', async () => {
    const admin = await createUser({ tier: 'administrator' });
    const users = await createMultipleUsers(100);

    const promises = users.map((user) => checkUserVisibility(admin.id, user.id));

    const results = await Promise.all(promises);

    expect(results).toHaveLength(100);
    expect(results.every((r) => r.canView)).toBe(true);
  });
});
```

This addendum document provides comprehensive specifications for the User Visibility Rules system, including detailed implementation guidelines, security considerations, and thorough test cases. The visibility system is designed to be both secure and performant, ensuring that users can only access data they are authorized to see while maintaining system performance at scale.
