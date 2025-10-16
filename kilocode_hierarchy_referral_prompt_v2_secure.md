Implement Multi-tier User Hierarchy and Referral System for Smart AI Hub

## Overview

Add a comprehensive 5-tier user hierarchy system with referral functionality, transfer capabilities, and member management to Smart AI Hub.

**CRITICAL SECURITY REQUIREMENT:** All user data access MUST respect visibility rules based on hierarchy relationships.

## User Tiers (Highest to Lowest)

1. **Administrator** - System admin with full control
2. **Agency** - Partner organizations managing multiple Organizations
3. **Organization** - Companies/groups managing Admins and General users
4. **Admin** - Organization managers
5. **General** - Regular users

## Core Features to Implement

### 1. User Hierarchy System

**Database Changes:**
- Add `tier` enum field to User model: `administrator`, `agency`, `organization`, `admin`, `general`
- Add `parentAgencyId` field (for Organization and General under Agency)
- Add `parentOrganizationId` field (for Admin and General under Organization)
- Add `inviteCode` field (unique, auto-generated)
- Add `invitedBy` field (referrer user ID)
- Add `isBlocked`, `blockedReason`, `blockedAt`, `blockedBy` fields

**Authorization Rules:**
- Administrator: Can manage all users, transfer to anyone, block anyone
- Agency: Can transfer to Organizations under them and General users, can block them
- Organization: Can transfer to Admins/General in their org, can block them
- Admin: Can transfer to General in same org only
- General: Cannot transfer or block

**🔒 CRITICAL: User Visibility Rules**

Users can ONLY see other users based on their tier and hierarchy relationship:

**Administrator:**
- ✅ Can see ALL users in the system (no restrictions)

**Agency:**
- ✅ Can see Organizations where `parentAgencyId === agency.id`
- ✅ Can see Admins in Organizations under them
- ✅ Can see General where `parentAgencyId === agency.id` OR in Organizations under them
- ❌ CANNOT see other Agencies
- ❌ CANNOT see Administrators
- ❌ CANNOT see General not under their Agency

**Organization:**
- ✅ Can see Admins where `parentOrganizationId === organization.id`
- ✅ Can see General where `parentOrganizationId === organization.id`
- ✅ Can see parent Agency (basic info only)
- ❌ CANNOT see other Organizations
- ❌ CANNOT see Admins/General of other Organizations
- ❌ CANNOT see Agencies
- ❌ CANNOT see Administrators

**Admin:**
- ✅ Can see General where `parentOrganizationId === admin.parentOrganizationId`
- ✅ Can see other Admins in same Organization
- ✅ Can see parent Organization (basic info only)
- ❌ CANNOT see Admins/General of other Organizations
- ❌ CANNOT see Organizations
- ❌ CANNOT see Agencies
- ❌ CANNOT see Administrators

**General:**
- ✅ Can see ONLY themselves
- ✅ Can see parent Organization (basic info only, if applicable)
- ✅ Can see Admins in same Organization (basic contact info only)
- ❌ CANNOT see other Generals (even in same Organization)
- ❌ CANNOT see member lists
- ❌ CANNOT see Organizations
- ❌ CANNOT see Agencies
- ❌ CANNOT see Administrators

### 2. Transfer System

**Create Transfer Model:**
```prisma
model Transfer {
  id           String          @id @default(uuid())
  senderId     String
  receiverId   String
  type         TransferType    // manual, referral_reward, admin_adjustment
  currency     TransferCurrency // points, credits
  amount       Int
  description  String?
  metadata     Json            @default("{}")
  status       TransferStatus  @default(completed)
  createdAt    DateTime        @default(now())
  
  sender       User            @relation("TransferSender")
  receiver     User            @relation("TransferReceiver")
}

enum TransferType { manual, referral_reward, admin_adjustment }
enum TransferCurrency { points, credits }
enum TransferStatus { pending, completed, failed, cancelled }
```

**Transfer APIs:**
- `POST /api/transfer/points` - Transfer points to another user
- `POST /api/transfer/credits` - Transfer credits to another user
- `GET /api/transfer/history` - View transfer history
- `GET /api/transfer/validate` - Check if transfer is allowed

**Transfer Validation Logic:**
```typescript
// Check authorization based on hierarchy
async function canTransfer(senderTier, receiverTier, sender, receiver) {
  // First check visibility - sender must be able to see receiver
  const canSee = await checkUserVisibility(sender.id, receiver.id);
  if (!canSee) {
    return false;
  }
  
  switch (senderTier) {
    case 'administrator':
      return true; // Can transfer to anyone
      
    case 'agency':
      // Can transfer to Organizations under this Agency or General
      if (receiverTier === 'organization') {
        return receiver.parentAgencyId === sender.id;
      }
      if (receiverTier === 'general') {
        return receiver.parentAgencyId === sender.id;
      }
      return false;
      
    case 'organization':
      // Can transfer to Admin/General in same Organization
      if (receiverTier === 'admin' || receiverTier === 'general') {
        return receiver.parentOrganizationId === sender.id;
      }
      return false;
      
    case 'admin':
      // Can transfer to General in same Organization only
      if (receiverTier === 'general') {
        return receiver.parentOrganizationId === sender.parentOrganizationId;
      }
      return false;
      
    case 'general':
      return false; // Cannot transfer
  }
}
```

**🔒 User Visibility Check Middleware:**
```typescript
// middleware/checkUserVisibility.ts

export async function checkUserVisibility(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { tier: true, parentAgencyId: true, parentOrganizationId: true }
  });
  
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { tier: true, parentAgencyId: true, parentOrganizationId: true }
  });
  
  if (!currentUser || !targetUser) {
    return false;
  }
  
  // Administrator can see everyone
  if (currentUser.tier === 'administrator') {
    return true;
  }
  
  // Agency can see Organizations and Generals under them
  if (currentUser.tier === 'agency') {
    if (targetUser.tier === 'organization' || targetUser.tier === 'general') {
      return targetUser.parentAgencyId === currentUserId;
    }
    // Agency can see Admins in their Organizations
    if (targetUser.tier === 'admin') {
      const targetOrg = await prisma.user.findUnique({
        where: { id: targetUser.parentOrganizationId },
        select: { parentAgencyId: true }
      });
      return targetOrg?.parentAgencyId === currentUserId;
    }
    return false;
  }
  
  // Organization can see Admins and Generals in their org
  if (currentUser.tier === 'organization') {
    if (targetUser.tier === 'admin' || targetUser.tier === 'general') {
      return targetUser.parentOrganizationId === currentUserId;
    }
    return false;
  }
  
  // Admin can see Generals in same org
  if (currentUser.tier === 'admin') {
    if (targetUser.tier === 'general') {
      return targetUser.parentOrganizationId === currentUser.parentOrganizationId;
    }
    // Admin can see other Admins in same org
    if (targetUser.tier === 'admin') {
      return targetUser.parentOrganizationId === currentUser.parentOrganizationId;
    }
    return false;
  }
  
  // General can only see themselves
  if (currentUser.tier === 'general') {
    return targetUserId === currentUserId;
  }
  
  return false;
}
```

### 3. Referral System

**Create ReferralReward Model:**
```prisma
model ReferralReward {
  id                    String   @id @default(uuid())
  referrerId            String
  refereeId             String
  referrerTier          UserTier
  refereeTier           UserTier
  referrerRewardPoints  Int
  refereeRewardPoints   Int
  agencyBonusPoints     Int?
  agencyId              String?
  status                RewardStatus @default(pending)
  processedAt           DateTime?
  createdAt             DateTime @default(now())
  
  referrer              User     @relation("ReferralRewardRecipient")
  referee               User     @relation("ReferralRewardGiver")
}

enum RewardStatus { pending, completed, failed }
```

**Create AgencyReferralConfig Model:**
```prisma
model AgencyReferralConfig {
  id                       String   @id @default(uuid())
  agencyId                 String   @unique
  organizationRewardPoints Int      @default(5000)
  adminRewardPoints        Int      @default(3000)
  generalRewardPoints      Int      @default(1000)
  isActive                 Boolean  @default(true)
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
}
```

**Referral APIs:**
- `GET /api/referral/invite-link` - Get user's invite link and QR code
- `GET /api/referral/stats` - Get referral statistics
- `POST /api/referral/register` - Register with invite code
- `GET /api/referral/rewards` - View referral rewards history

**Referral Rewards Logic:**

**For General referrer:**
```typescript
// When someone signs up via General's invite
1. New user gets: 1,000 Points (Base Reward from system)
2. General referrer gets: 2,000 Points (Referral Reward)
3. New user is independent (not part of any Organization)
```

**For Organization referrer:**
```typescript
// When someone signs up via Organization's invite
1. New user gets: 1,000 Points (Base Reward from system)
2. Organization referrer gets: 2,000 Points (Referral Reward)
3. New user automatically joins the Organization (becomes General in that Organization)
```

**For Agency referrer:**
```typescript
// When someone signs up via Agency's invite
1. New user gets: 1,000 Points (Base Reward from system)
2. New user gets: X Points (Agency Bonus - configurable by Agency)
3. Agency is deducted: X Points (transferred to new user)
4. New user belongs to Agency (tier determined during signup)

// Examples:
- Sign up as Organization: 1,000 (Base) + 5,000 (Agency Bonus) = 6,000 Points
- Sign up as Admin: 1,000 (Base) + 3,000 (Agency Bonus) = 4,000 Points
- Sign up as General: 1,000 (Base) + 1,000 (Agency Bonus) = 2,000 Points
```

**Agency Referral Config APIs:**
- `GET /api/agency/referral-config` - Get Agency's referral reward settings
- `PUT /api/agency/referral-config` - Update referral reward settings (Agency only)

### 4. Block/Unblock System

**Create BlockLog Model:**
```prisma
model BlockLog {
  id         String      @id @default(uuid())
  userId     String
  blockedBy  String
  action     BlockAction // block, unblock
  reason     String?
  metadata   Json        @default("{}")
  createdAt  DateTime    @default(now())
}

enum BlockAction { block, unblock }
```

**Block APIs:**
- `POST /api/hierarchy/block` - Block a user
- `POST /api/hierarchy/unblock` - Unblock a user
- `GET /api/hierarchy/block-logs` - View block/unblock history

**Block Authorization:**
```typescript
async function canBlock(blockerTier, userTier, blocker, user) {
  // First check visibility - blocker must be able to see user
  const canSee = await checkUserVisibility(blocker.id, user.id);
  if (!canSee) {
    return false;
  }
  
  switch (blockerTier) {
    case 'administrator':
      return true; // Can block anyone
      
    case 'agency':
      if (userTier === 'organization') {
        return user.parentAgencyId === blocker.id;
      }
      if (userTier === 'general') {
        return user.parentAgencyId === blocker.id;
      }
      return false;
      
    case 'organization':
      if (userTier === 'admin' || userTier === 'general') {
        return user.parentOrganizationId === blocker.id;
      }
      return false;
      
    default:
      return false; // Admin and General cannot block
  }
}
```

**Block Effects:**
- Blocked users cannot login
- Blocked users cannot use API
- Show message: "Your account has been blocked. Please contact support."
- Send notification when blocked/unblocked

### 5. Hierarchy Management APIs

**🔒 CRITICAL: All these APIs MUST apply visibility filters**

- `GET /api/hierarchy/members` - List members under current user (FILTERED by visibility rules)
- `GET /api/hierarchy/tree` - View hierarchy tree (FILTERED by visibility rules)
- `GET /api/hierarchy/stats` - Get hierarchy statistics (FILTERED by visibility rules)

**Implementation of /api/hierarchy/members with Visibility:**
```typescript
export async function getMemberList(req: Request, res: Response) {
  const currentUserId = req.user.id;
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { tier: true, parentAgencyId: true, parentOrganizationId: true }
  });
  
  let members = [];
  
  switch (currentUser.tier) {
    case 'administrator':
      // Can see everyone
      members = await prisma.user.findMany({
        where: req.query.tier ? { tier: req.query.tier } : {}
      });
      break;
      
    case 'agency':
      // Can see Organizations and Generals under them, and Admins in their Organizations
      members = await prisma.user.findMany({
        where: {
          OR: [
            { tier: 'organization', parentAgencyId: currentUserId },
            { tier: 'general', parentAgencyId: currentUserId },
            { 
              tier: 'admin',
              parentOrganization: { parentAgencyId: currentUserId }
            },
            {
              tier: 'general',
              parentOrganization: { parentAgencyId: currentUserId }
            }
          ]
        }
      });
      break;
      
    case 'organization':
      // Can see Admins and Generals in their org ONLY
      members = await prisma.user.findMany({
        where: {
          parentOrganizationId: currentUserId,
          tier: { in: ['admin', 'general'] }
        }
      });
      break;
      
    case 'admin':
      // Can see Generals in same org ONLY
      members = await prisma.user.findMany({
        where: {
          parentOrganizationId: currentUser.parentOrganizationId,
          tier: 'general'
        }
      });
      break;
      
    case 'general':
      // CANNOT see member list - return 403
      return res.status(403).json({
        error: 'You do not have permission to view member list'
      });
      
    default:
      return res.status(403).json({
        error: 'Invalid user tier'
      });
  }
  
  return res.json({ data: members, total: members.length });
}
```

### 6. Frontend UI Components

**Pages:**
- `/invite` - Invite Link and QR Code page
- `/referrals` - Referral statistics page
- `/transfer` - Transfer Points/Credits page
- `/members` - Manage members page (Organization/Agency) - **HIDE from General users**
- `/agency/settings` - Agency referral reward settings

**Components:**
- `<InviteCard />` - Display invite link and QR code with copy button
- `<ReferralStats />` - Show referral statistics and earnings
- `<TransferForm />` - Form to transfer Points/Credits (with user search FILTERED by visibility)
- `<MemberList />` - List of members with actions (FILTERED by visibility)
- `<HierarchyTree />` - Visual hierarchy tree (FILTERED by visibility)
- `<BlockButton />` - Block/Unblock button with confirmation
- `<AgencyRewardSettings />` - Agency referral reward configuration
- `<TierBadge />` - Display user tier with icon

**🔒 Frontend Access Control:**
```typescript
// components/MemberList.tsx
export function MemberList() {
  const { user } = useAuth();
  
  // General users cannot access member list
  if (user.tier === 'general') {
    return (
      <Alert severity="warning">
        You do not have permission to view member list.
      </Alert>
    );
  }
  
  const { data: members, isLoading } = useQuery(
    ['members', user.id],
    () => fetchMembers()  // Backend will filter based on visibility
  );
  
  return (
    <div>
      <h2>Members</h2>
      {members?.map(member => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}

// pages/members.tsx
export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  // Redirect if user is General
  if (session?.user?.tier === 'general') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false
      }
    };
  }
  
  return { props: {} };
}
```

### 7. Security & Validation

**Must implement:**
- ✅ Check authorization before every transfer
- ✅ Use database transactions for transfers (atomic operations)
- ✅ Rate limiting on transfer APIs (max 10 transfers/minute)
- ✅ Validate invite codes are unique and cannot be guessed
- ✅ Prevent self-referral (cannot use own invite code)
- ✅ Check receiver is not blocked before transfer
- ✅ Audit log for all transfers and block/unblock actions
- ✅ Row-level locking to prevent race conditions
- ✅ **Apply `checkUserVisibility()` middleware to ALL user data access APIs**
- ✅ **Return 403 Forbidden if user tries to access data they cannot see**
- ✅ **Filter all member lists, search results, and hierarchy trees by visibility rules**
- ✅ **Log all unauthorized access attempts**

**Validations:**
- Transfer amount must be > 0
- Sender must have sufficient balance
- Receiver must exist and not be blocked
- Sender must have permission to transfer to receiver
- **Sender must be able to SEE receiver (visibility check)**
- Invite code must be valid and not expired
- Agency bonus rewards cannot exceed Agency's balance

### 8. Database Migrations

**Migration Steps:**
1. Add new fields to User model: `tier`, `isBlocked`, `inviteCode`, etc.
2. Create Transfer, ReferralReward, AgencyReferralConfig, BlockLog models
3. Create indexes for performance:
   - `users(tier)`
   - `users(parentAgencyId)`
   - `users(parentOrganizationId)`
   - `users(inviteCode)`
   - `transfers(senderId, createdAt)`
   - `transfers(receiverId, createdAt)`
4. Seed data:
   - Set existing users to `tier = 'general'`
   - Generate `inviteCode` for existing users
5. Create foreign key constraints and relations

### 9. Testing Requirements

**Unit Tests:**
- Test `canTransfer()` for all tier combinations
- Test `canBlock()` for all tier combinations
- Test referral reward calculations
- Test transfer validation logic
- **Test `checkUserVisibility()` for ALL tier combinations**

**Integration Tests:**
- Test transfer APIs with different user tiers
- Test referral registration flow
- Test block/unblock functionality
- Test transaction atomicity
- **Test member list API returns only visible users**
- **Test search API filters by visibility**
- **Test hierarchy tree API filters by visibility**

**E2E Tests:**
- Test General invites friend and receives reward
- Test Organization invites member and member joins org
- Test Agency sets custom rewards and new user receives bonus
- Test Organization transfers Points to Admin and General
- Test Agency blocks Organization and Organization cannot login
- **Test Agency A cannot see Organizations of Agency B**
- **Test Organization A cannot see Admins of Organization B**
- **Test Admin cannot see Generals of other Organization**
- **Test General cannot see other Generals**
- **Test General cannot access member list page**

**🔒 Security Test Cases:**
```typescript
// Test Case 1: Agency cannot see other Agency's Organizations
test('Agency A cannot see Organizations of Agency B', async () => {
  const agencyA = await createUser({ tier: 'agency' });
  const agencyB = await createUser({ tier: 'agency' });
  const orgB = await createUser({ 
    tier: 'organization', 
    parentAgencyId: agencyB.id 
  });
  
  const canSee = await checkUserVisibility(agencyA.id, orgB.id);
  expect(canSee).toBe(false);
  
  // Try to access via API - should return 403
  const response = await request(app)
    .get(`/api/users/${orgB.id}`)
    .set('Authorization', `Bearer ${agencyAToken}`);
  expect(response.status).toBe(403);
});

// Test Case 2: Organization cannot see Admins of other Organization
test('Organization A cannot see Admins of Organization B', async () => {
  const orgA = await createUser({ tier: 'organization' });
  const orgB = await createUser({ tier: 'organization' });
  const adminB = await createUser({ 
    tier: 'admin', 
    parentOrganizationId: orgB.id 
  });
  
  const canSee = await checkUserVisibility(orgA.id, adminB.id);
  expect(canSee).toBe(false);
});

// Test Case 3: General cannot see other Generals
test('General A cannot see General B even in same org', async () => {
  const org = await createUser({ tier: 'organization' });
  const generalA = await createUser({ 
    tier: 'general', 
    parentOrganizationId: org.id 
  });
  const generalB = await createUser({ 
    tier: 'general', 
    parentOrganizationId: org.id 
  });
  
  const canSee = await checkUserVisibility(generalA.id, generalB.id);
  expect(canSee).toBe(false);
});

// Test Case 4: General cannot access member list
test('General user gets 403 when accessing member list', async () => {
  const general = await createUser({ tier: 'general' });
  const token = generateToken(general);
  
  const response = await request(app)
    .get('/api/hierarchy/members')
    .set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(403);
});
```

### 10. Environment Variables

Add to `.env`:
```env
# Referral System
BASE_REFERRAL_REWARD=1000
GENERAL_REFERRAL_REWARD=2000
DEFAULT_AGENCY_ORG_REWARD=5000
DEFAULT_AGENCY_ADMIN_REWARD=3000
DEFAULT_AGENCY_GENERAL_REWARD=1000

# Transfer Limits
MAX_TRANSFER_AMOUNT=1000000
TRANSFER_RATE_LIMIT=10

# Invite
INVITE_CODE_LENGTH=12
INVITE_BASE_URL=https://smartaihub.com/signup
```

### 11. Success Criteria

- [ ] All 5 user tiers implemented with correct hierarchy
- [ ] Transfer system works for Points and Credits
- [ ] Authorization checks prevent unauthorized transfers
- [ ] **Visibility checks prevent unauthorized data access**
- [ ] **Member lists only show users that current user can see**
- [ ] **Search results filtered by visibility rules**
- [ ] **Hierarchy tree filtered by visibility rules**
- [ ] **General users cannot access member list**
- [ ] Referral system generates unique invite codes
- [ ] Referral rewards distributed correctly for all scenarios
- [ ] Agency can configure custom referral rewards
- [ ] Block/Unblock system works with proper authorization
- [ ] All transactions are atomic (no partial failures)
- [ ] UI displays invite link, QR code, and statistics
- [ ] All APIs have proper error handling and validation
- [ ] Audit logs capture all important actions
- [ ] **Audit logs capture unauthorized access attempts**
- [ ] Tests cover all critical paths including visibility
- [ ] Documentation is complete

### 12. Implementation Order

1. **Day 1:** Database schema and migrations
2. **Day 2:** Implement `checkUserVisibility()` middleware (CRITICAL)
3. **Day 3-4:** Transfer system with visibility checks
4. **Day 5-6:** Referral system
5. **Day 7:** Block/Unblock system with visibility checks
6. **Day 8:** Update all member list APIs with visibility filters
7. **Day 9-10:** Frontend UI components with access control
8. **Day 11-12:** Integration testing with focus on visibility
9. **Day 13-14:** E2E testing and security testing
10. **Day 15:** Documentation and deployment

### 13. Important Notes

- This is NOT an MLM system - only direct referrals get rewards
- General users can exist independently or within Organizations
- Agency bonus rewards are deducted from Agency's balance
- All transfers must be logged for audit purposes
- Blocked users cannot perform any actions
- Organization and Agency creation requires Administrator approval
- Invite codes never expire
- Only Administrator can change user tiers
- Transfer transactions must use database locks to prevent race conditions
- **🔒 CRITICAL: Users can ONLY see and interact with users they have visibility to**
- **🔒 All APIs must check visibility before returning user data**
- **🔒 Frontend must hide UI elements for users without permission**
- **🔒 Log all unauthorized access attempts for security monitoring**

### 14. Additional Considerations

**Performance:**
- Add database indexes for fast queries
- Cache hierarchy relationships in Redis
- Use connection pooling for database
- Implement pagination for member lists

**Monitoring:**
- Track transfer volumes and patterns
- Monitor referral conversion rates
- Alert on suspicious transfer activity
- Log all authorization failures
- **Alert on repeated unauthorized access attempts**
- **Monitor visibility check performance**

**Data Sanitization:**
```typescript
// Only show sensitive data to authorized users
function sanitizeUserData(user: User, viewerTier: UserTier) {
  const baseData = {
    id: user.id,
    email: user.email,
    tier: user.tier,
    profile: {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName
    }
  };
  
  // Only Administrator can see sensitive data
  if (viewerTier === 'administrator') {
    return {
      ...baseData,
      points: user.points,
      credits: user.credits,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt
    };
  }
  
  return baseData;
}
```

**Future Enhancements (Out of Scope):**
- Multi-level commission system
- Leaderboard and ranking
- Referral contests and campaigns
- Cash out functionality
- Bulk transfer operations

---

## 🔒 Security Checklist

Before deployment, verify:

- [ ] `checkUserVisibility()` middleware implemented
- [ ] All member list APIs apply visibility filters
- [ ] All search APIs apply visibility filters
- [ ] All hierarchy tree APIs apply visibility filters
- [ ] Transfer APIs check visibility before allowing transfer
- [ ] Block APIs check visibility before allowing block
- [ ] Frontend hides member list from General users
- [ ] Frontend hides transfer form from General users
- [ ] API returns 403 for unauthorized access
- [ ] Audit log records unauthorized access attempts
- [ ] All test cases for visibility pass
- [ ] Security review completed
- [ ] Penetration testing completed

---

## Expected Deliverables

1. **Backend:**
   - All models and migrations
   - All API endpoints with visibility checks
   - Authorization middleware
   - **Visibility check middleware**
   - Service layer with business logic
   - Unit and integration tests
   - Security tests

2. **Frontend:**
   - All pages and components
   - Forms with validation
   - Responsive design
   - Error handling
   - Loading states
   - **Access control (hide UI for unauthorized users)**

3. **Documentation:**
   - API documentation (Swagger)
   - User guide
   - Admin guide
   - Database schema documentation
   - **Security documentation (visibility rules)**

4. **Testing:**
   - Unit tests (>80% coverage)
   - Integration tests
   - E2E tests
   - **Security tests (visibility violations)**
   - Test reports

Please implement this system following the Smart AI Hub coding standards and architecture patterns. Ensure all code is production-ready with proper error handling, logging, and security measures.

**🔒 CRITICAL: Pay special attention to user visibility rules. This is a security-critical feature that must be implemented correctly to prevent data leaks.**

