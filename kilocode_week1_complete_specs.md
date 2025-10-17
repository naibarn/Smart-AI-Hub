Create comprehensive Specification documents for Smart AI Hub's Multi-tier Hierarchy, Referral System, and related features following Spec Kit standards.

# Task: Week 1 - Complete Specification Documentation

## Objective
Create and restructure all specification documents for Smart AI Hub to achieve Spec Kit Compliance ≥ 90%. This includes creating 2 new main specifications, 2 addendum documents, and restructuring 2 existing documents to meet Spec Kit standards.

## Context
Smart AI Hub has implemented a Multi-tier User Hierarchy and Referral System with comprehensive security features. The backend implementation is complete, but formal specification documents are missing or non-compliant with Spec Kit standards. This task will create the missing documentation to ensure proper requirements documentation and compliance.

---

## Part 1: Hierarchy & Referral System Specification (Day 2-3)

### Task 1.1: Create spec_multi_tier_hierarchy_referral.md

Create a comprehensive specification document with all 16 Spec Kit sections covering the complete Multi-tier Hierarchy and Referral System.

#### Required Sections (16 total)
1. Overview
2. Objectives
3. User Stories (minimum 8 stories covering all tiers)
4. Scope
5. Functional Requirements
6. Non-Functional Requirements
7. Data Models
8. API Specifications
9. Business Logic
10. Security Considerations
11. Error Handling
12. Performance Requirements
13. Deployment Strategy
14. Testing Strategy
15. Documentation Requirements
16. Examples and Use Cases

#### Content Requirements

##### 1. 5-Tier User Hierarchy

Document the complete hierarchy structure:

**Tier 1: Administrator**
- Highest privilege level
- Can manage all users in the system
- Can transfer Points/Credits to anyone
- Can block/unblock any user
- Can access all admin functions
- Can view all users (no visibility restrictions)

**Tier 2: Agency**
- Manages multiple Organizations
- Can create and manage Organizations under them
- Can transfer Points/Credits to their Organizations and General users
- Can block/unblock Organizations, Admins, and Generals under them
- Can configure Referral Rewards for signup bonuses
- Can view: All Organizations under them + their Admins/Generals

**Tier 3: Organization**
- Manages Admins and General users within the organization
- Can transfer Points/Credits to Admins and Generals in their org
- Can block/unblock Admins and Generals in their org
- Cannot configure Referral Rewards (uses Agency settings)
- Can view: All Admins and Generals in their organization only

**Tier 4: Admin**
- Manages General users within the same organization
- Can transfer Points/Credits to Generals in same org only
- Can block/unblock Generals in same org only
- Cannot configure Referral Rewards
- Can view: Only Generals in the same organization

**Tier 5: General**
- Regular user with basic privileges
- Cannot transfer Points/Credits to others
- Cannot block users
- Cannot manage other users
- Can view: Only themselves
- Can use services and earn/spend Points

##### 2. Transfer System

Document the complete transfer functionality:

**Transfer Types:**
- Points transfer
- Credits transfer
- Combined transfer (both Points and Credits)

**Authorization Rules:**
- Administrator → Can transfer to anyone
- Agency → Can transfer to their Organizations and any General
- Organization → Can transfer to Admins and Generals in their org
- Admin → Can transfer to Generals in same org only
- General → Cannot transfer (no permission)

**Transfer Validation:**
- Check sufficient balance (Points/Credits)
- Check authorization (can sender transfer to recipient?)
- Check visibility (can sender see recipient?)
- Check minimum transfer amount
- Check recipient account status (not blocked)

**Transfer Process:**
- Atomic database transaction
- Deduct from sender
- Add to recipient
- Create transfer record
- Create audit log
- Send notifications

##### 3. Referral System

Document the complete referral functionality:

**Invite Code Generation:**
- Unique code per user
- Format: 8 characters alphanumeric
- Never expires
- Can be regenerated

**Invite Link:**
- Format: `https://smartaihub.com/register?invite={code}`
- Shareable via social media, email, QR code
- Tracks referrer automatically

**Referral Rewards:**
- **Agency-configured rewards:**
  - Organization signup reward (Points)
  - Admin signup reward (Points)
  - General signup reward (Points)
- **Reward source:** Deducted from Agency's balance
- **Reward timing:** Immediately upon successful registration
- **Reward tracking:** Recorded in ReferralReward table

**Referral Statistics:**
- Total referrals count
- Active referrals count
- Total rewards earned
- Referral history with details

##### 4. Block/Unblock System

Document the complete block functionality:

**Block Authorization:**
- Administrator → Can block anyone
- Agency → Can block their Organizations, Admins, Generals
- Organization → Can block their Admins and Generals
- Admin → Can block Generals in same org
- General → Cannot block anyone

**Block Effects:**
- User cannot login
- User cannot use API
- User cannot receive transfers
- User's scheduled tasks suspended
- User's active sessions terminated

**Unblock:**
- Same authorization rules as block
- Restores all access
- Logged in BlockLog table

**Block Logging:**
- Who blocked whom
- When blocked
- Reason for block
- When unblocked (if applicable)

##### 5. User Visibility Rules (Critical Security)

Document the complete visibility system:

**Visibility Matrix:**

| User Tier | Can View |
|-----------|----------|
| Administrator | All users in system |
| Agency | Organizations under them + their Admins/Generals |
| Organization | Admins and Generals in their organization |
| Admin | Generals in same organization |
| General | Only themselves |

**Visibility Enforcement:**
- Middleware: `visibilityCheckRaw.ts`
- Applied to ALL relevant API endpoints
- Filters query results based on user tier
- Sanitizes response data
- Prevents data leakage

**Critical Security Requirements:**
- Agency A CANNOT see Agency B's data
- Organization A CANNOT see Organization B's data
- Admin CANNOT see users outside their org
- General CANNOT see other users
- All visibility checks MUST be server-side
- Frontend MUST hide UI elements based on visibility

##### 6. Authorization Matrix

Create comprehensive authorization tables:

**Transfer Authorization:**

| From Tier | To Administrator | To Agency | To Organization | To Admin | To General |
|-----------|------------------|-----------|-----------------|----------|------------|
| Administrator | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agency | ❌ | ❌ | ✅ (own) | ❌ | ✅ |
| Organization | ❌ | ❌ | ❌ | ✅ (own) | ✅ (own) |
| Admin | ❌ | ❌ | ❌ | ❌ | ✅ (own org) |
| General | ❌ | ❌ | ❌ | ❌ | ❌ |

**Block Authorization:**

| Blocker Tier | Can Block |
|--------------|-----------|
| Administrator | All users |
| Agency | Organizations (own), Admins (under own orgs), Generals (under own orgs) |
| Organization | Admins (own org), Generals (own org) |
| Admin | Generals (own org) |
| General | None |

**API Access Authorization:**

| Endpoint | Administrator | Agency | Organization | Admin | General |
|----------|---------------|--------|--------------|-------|---------|
| GET /api/v1/hierarchy/members | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /api/v1/transfer | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /api/v1/block | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /api/v1/referral/stats | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/v1/referral/invite | ✅ | ✅ | ✅ | ✅ | ✅ |

#### Database Schema

Document the following tables:

**User Fields:**
- `tier` (enum: administrator, agency, organization, admin, general)
- `agencyId` (reference to parent Agency)
- `organizationId` (reference to parent Organization)
- `isBlocked` (boolean)
- `inviteCode` (unique string)
- `referrerId` (reference to referrer User)

**Transfer Table:**
- id, fromUserId, toUserId, type (points/credits), amount, status, createdAt

**ReferralReward Table:**
- id, referrerId, referredUserId, rewardType, rewardAmount, createdAt

**AgencyReferralConfig Table:**
- id, agencyId, organizationSignupReward, adminSignupReward, generalSignupReward

**BlockLog Table:**
- id, blockedUserId, blockedByUserId, reason, blockedAt, unblockedAt

#### API Specifications

Document all endpoints from:
- `hierarchy.controller.ts`
- `referral.controller.ts`
- `transfer.controller.ts`

Include:
- Endpoint path and method
- Request parameters
- Request body schema
- Response schema
- Authorization requirements
- Visibility filters applied
- Error responses

#### Security Considerations

Must include:
- Visibility middleware implementation
- Authorization checks at every endpoint
- Input validation and sanitization
- Rate limiting per tier
- Audit logging for sensitive operations
- Prevention of privilege escalation
- Protection against data leakage
- CSRF protection
- SQL injection prevention

#### Reference Files

Use these existing files as reference:
- `/home/ubuntu/smart-ai-hub-latest/packages/core-service/src/controllers/hierarchy.controller.ts`
- `/home/ubuntu/smart-ai-hub-latest/packages/core-service/src/controllers/referral.controller.ts`
- `/home/ubuntu/smart-ai-hub-latest/packages/core-service/src/controllers/transfer.controller.ts`
- `/home/ubuntu/smart-ai-hub-latest/packages/core-service/prisma/schema.prisma`
- `/home/ubuntu/smart-ai-hub-latest/HIERARCHY_SYSTEM_IMPLEMENTATION.md`
- `/home/ubuntu/kilocode_hierarchy_referral_prompt_v2_secure.md`

#### Deliverable

**File:** `spec_multi_tier_hierarchy_referral.md`

**Requirements:**
- ✅ All 16 Spec Kit sections
- ✅ Comprehensive coverage of all 6 features
- ✅ Authorization Matrix tables
- ✅ Visibility Rules Matrix
- ✅ Database schema documentation
- ✅ Complete API documentation
- ✅ Security considerations detailed
- ✅ Professional writing style (paragraphs, not bullets)
- ✅ Spec Kit compliant

---

## Part 2: Addendum Documents (Day 3-4)

### Task 2.1: Create user_visibility_rules_addendum.md

Create a focused addendum document specifically for User Visibility Rules.

#### Required Content

##### 1. Visibility Rules Matrix

Comprehensive table showing what each tier can see:

| Viewer Tier | Can View | Cannot View | Conditions |
|-------------|----------|-------------|------------|
| Administrator | All users | None | No restrictions |
| Agency | Own Organizations + their members | Other Agencies, Other Organizations | Must be under same Agency |
| Organization | Own Admins + Generals | Other Organizations, Other Agencies | Must be in same Organization |
| Admin | Generals in same org | Users outside org | Must be in same Organization |
| General | Self only | All other users | No access to member lists |

##### 2. Authorization Checks

Document the `checkUserVisibility()` function:

```typescript
async function checkUserVisibility(
  viewerId: string,
  targetUserId: string
): Promise<boolean>
```

**Logic:**
- Get viewer's tier and hierarchy info
- Get target's tier and hierarchy info
- Apply visibility rules based on tier
- Return true if viewer can see target, false otherwise

**Implementation Details:**
- Used as middleware in API routes
- Applied before database queries
- Filters results in list endpoints
- Blocks access in detail endpoints

##### 3. Security Considerations

**Critical Security Requirements:**
- All visibility checks MUST be server-side
- Never trust client-side filtering
- Apply visibility to ALL user-related endpoints
- Sanitize response data based on visibility
- Log unauthorized access attempts
- Rate limit failed visibility checks

**Threat Scenarios:**
- Agency A trying to view Agency B's data
- Organization trying to view users outside their org
- Admin trying to access other organizations
- General trying to access member lists
- API manipulation to bypass visibility

**Mitigations:**
- Middleware on every endpoint
- Database-level filtering
- Response sanitization
- Audit logging
- Rate limiting
- Input validation

##### 4. Test Cases

Provide comprehensive test scenarios:

**Positive Tests:**
- Administrator can view any user
- Agency can view their Organizations
- Organization can view their Admins
- Admin can view Generals in same org

**Negative Tests:**
- Agency CANNOT view other Agencies
- Organization CANNOT view other Organizations
- Admin CANNOT view users outside org
- General CANNOT view member lists

**Edge Cases:**
- User changes tier (visibility updates)
- User moves to different org (visibility updates)
- User gets blocked (visibility maintained)
- Orphaned users (no agency/org)

#### Deliverable

**File:** `user_visibility_rules_addendum.md`

**Requirements:**
- ✅ Comprehensive Visibility Matrix
- ✅ Detailed authorization logic
- ✅ Security threat analysis
- ✅ Complete test cases
- ✅ Code examples
- ✅ Professional writing style

---

### Task 2.2: Create auto_topup_feature_addition.md

Create a focused addendum document specifically for Auto Top-up Feature.

#### Required Content

##### 1. Auto Top-up Logic

**Trigger Condition:**
- Check Points balance after every Points deduction
- If Points ≤ threshold (default: 10), trigger auto top-up
- Configurable threshold per user or system-wide

**Auto Top-up Process:**

```
1. Check if auto top-up is enabled for user
2. Check if Points ≤ threshold
3. Check if Credits ≥ 1
4. Begin database transaction
5. Deduct 1 Credit from user
6. Add 1,000 Points to user (based on exchange rate)
7. Create PointTransaction record (type: auto_topup_from_credit)
8. Create AutoTopupLog record
9. Commit transaction
10. Send notification to user
```

**Exchange Rate:**
- Default: 1 Credit = 1,000 Points
- Configurable via ExchangeRate table
- Admin can update exchange rate
- Historical rates preserved

##### 2. Configuration Options

**System-wide Configuration:**
- `AUTO_TOPUP_ENABLED` (boolean, default: true)
- `AUTO_TOPUP_THRESHOLD` (number, default: 10)
- `AUTO_TOPUP_AMOUNT_CREDITS` (number, default: 1)
- `AUTO_TOPUP_EXCHANGE_RATE` (number, default: 1000)

**User-level Configuration:**
- User can enable/disable auto top-up
- User can set custom threshold (if allowed)
- User preferences stored in UserSettings table

**Admin Configuration:**
- Admin can enable/disable system-wide
- Admin can set default threshold
- Admin can set exchange rate
- Admin can view auto top-up statistics

##### 3. Edge Cases

**Scenario 1: Insufficient Credits**
- User has Points ≤ 10
- User has 0 Credits
- **Result:** Auto top-up does NOT trigger
- **Action:** User notified to purchase Credits

**Scenario 2: Disabled Auto Top-up**
- User has Points ≤ 10
- User has Credits ≥ 1
- Auto top-up is disabled
- **Result:** Auto top-up does NOT trigger
- **Action:** User continues with low Points

**Scenario 3: Multiple Rapid Deductions**
- User makes 3 rapid service calls
- Each deducts 5 Points
- Points drop from 20 → 15 → 10 → 5
- **Result:** Auto top-up triggers ONCE at Points = 5
- **Prevention:** Use database locks to prevent race conditions

**Scenario 4: Exchange Rate Changes**
- User triggers auto top-up
- Exchange rate is 1:1000
- Admin changes rate to 1:1500 during transaction
- **Result:** Transaction uses rate at start of transaction
- **Prevention:** Use transaction isolation

**Scenario 5: Concurrent Auto Top-ups**
- Two service calls happen simultaneously
- Both check Points ≤ 10
- Both try to trigger auto top-up
- **Result:** Only ONE auto top-up executes
- **Prevention:** Use database row locks

##### 4. Test Scenarios

**Unit Tests:**
- Test auto top-up trigger logic
- Test exchange rate application
- Test transaction atomicity
- Test notification sending

**Integration Tests:**
- Test auto top-up with real database
- Test concurrent auto top-up prevention
- Test exchange rate changes during transaction
- Test insufficient Credits scenario

**E2E Tests:**
- User uses service → Points drop → Auto top-up triggers
- User disables auto top-up → Points drop → No auto top-up
- User has no Credits → Points drop → No auto top-up
- Admin changes exchange rate → Next auto top-up uses new rate

#### Deliverable

**File:** `auto_topup_feature_addition.md`

**Requirements:**
- ✅ Detailed auto top-up logic
- ✅ Configuration options documented
- ✅ All edge cases covered
- ✅ Comprehensive test scenarios
- ✅ Code examples
- ✅ Professional writing style

---

## Part 3: Restructure Existing Documents (Day 4)

### Task 3.1: Restructure HIERARCHY_SYSTEM_IMPLEMENTATION.md

**Current State:**
- Implementation-focused document
- Missing many Spec Kit sections
- ~35% Spec Kit compliance

**Required Changes:**
1. Add missing sections to reach 16 total
2. Reorganize content to match Spec Kit structure
3. Add User Stories section
4. Add Objectives section
5. Expand Security Considerations
6. Add Testing Strategy
7. Add Examples and Use Cases
8. Improve writing style (paragraphs, not bullets)

**Deliverable:**
- ✅ Updated `HIERARCHY_SYSTEM_IMPLEMENTATION.md`
- ✅ All 16 Spec Kit sections present
- ✅ Spec Kit compliance ≥ 90%

---

### Task 3.2: Restructure kilocode_hierarchy_referral_prompt_v2_secure.md

**Current State:**
- Prompt-style document
- Missing many Spec Kit sections
- ~40% Spec Kit compliance

**Required Changes:**
1. Convert from prompt format to specification format
2. Add missing sections to reach 16 total
3. Add User Stories section
4. Add Objectives section
5. Reorganize security content into proper section
6. Add Performance Requirements
7. Add Deployment Strategy
8. Improve writing style (paragraphs, not bullets)

**Deliverable:**
- ✅ Updated `kilocode_hierarchy_referral_prompt_v2_secure.md`
- ✅ All 16 Spec Kit sections present
- ✅ Spec Kit compliance ≥ 90%

---

## Quality Standards

### Writing Style
- Use professional, academic writing style
- Write in complete paragraphs, not bullet points (except for lists and tables)
- Use tables to organize and compare information
- Include hyperlinks to relevant external resources
- Use **bold** for emphasis on key concepts
- Use blockquotes for definitions or important notes
- Use Mermaid diagrams where appropriate

### Completeness
- Each section must be comprehensive and detailed
- Include specific numbers, thresholds, and limits
- Provide concrete examples for each feature
- Include edge cases and error scenarios
- Cover all user tiers and their permissions

### Accuracy
- Align with existing implementation in the codebase
- Reference actual database tables and API endpoints
- Use correct technical terminology
- Ensure consistency across all documents

### Spec Kit Compliance
- All documents must have 16 sections
- Each section must be substantial (not just placeholders)
- Follow Spec Kit format and structure
- Target compliance score ≥ 90%

---

## Success Criteria (Week 1)

The Week 1 task is considered complete when:

- ✅ `spec_multi_tier_hierarchy_referral.md` created (16 sections, comprehensive)
- ✅ `user_visibility_rules_addendum.md` created (focused, detailed)
- ✅ `auto_topup_feature_addition.md` created (focused, detailed)
- ✅ `HIERARCHY_SYSTEM_IMPLEMENTATION.md` restructured (16 sections, ≥90% compliance)
- ✅ `kilocode_hierarchy_referral_prompt_v2_secure.md` restructured (16 sections, ≥90% compliance)
- ✅ All documents follow professional writing style
- ✅ All documents are Spec Kit compliant
- ✅ Overall Spec Kit Compliance ≥ 90%
- ✅ Documents pass Spec Kit validation

---

## Instructions for Kilo Code

### Step 1: Read Reference Materials
1. Read all existing implementation files
2. Read existing documentation files
3. Read Spec Kit example (`spec_example_good.md`)
4. Understand the current system architecture

### Step 2: Create New Specifications
1. Create `spec_multi_tier_hierarchy_referral.md` with all 16 sections
2. Create `user_visibility_rules_addendum.md` with focused content
3. Create `auto_topup_feature_addition.md` with focused content

### Step 3: Restructure Existing Documents
1. Update `HIERARCHY_SYSTEM_IMPLEMENTATION.md` to Spec Kit format
2. Update `kilocode_hierarchy_referral_prompt_v2_secure.md` to Spec Kit format

### Step 4: Validate
1. Ensure all documents have 16 sections
2. Check writing style and formatting
3. Verify technical accuracy
4. Run Spec Kit validation
5. Confirm compliance ≥ 90%

### Step 5: Save Files
1. Save all files in the project root directory
2. Use exact file names as specified
3. Use Markdown format (.md extension)

---

## Notes

- This is a documentation task, not a coding task
- Do NOT modify any existing code
- Do NOT create new features
- ONLY create and restructure specification documents
- Documents should reflect the EXISTING implementation
- Focus on clarity, completeness, and compliance with Spec Kit standards
- Use tables, diagrams, and examples extensively
- Ensure all security considerations are thoroughly documented

---

## Expected Timeline

- **Day 2-3:** Create `spec_multi_tier_hierarchy_referral.md` (6-8 hours)
- **Day 3:** Create `user_visibility_rules_addendum.md` (2-3 hours)
- **Day 3:** Create `auto_topup_feature_addition.md` (2-3 hours)
- **Day 4:** Restructure existing documents (4-5 hours)
- **Total:** ~15-20 hours of work

---

## Deliverables Summary

At the end of Week 1, the following files should be ready:

1. ✅ `spec_multi_tier_hierarchy_referral.md` (NEW, 16 sections)
2. ✅ `user_visibility_rules_addendum.md` (NEW, focused)
3. ✅ `auto_topup_feature_addition.md` (NEW, focused)
4. ✅ `HIERARCHY_SYSTEM_IMPLEMENTATION.md` (UPDATED, 16 sections)
5. ✅ `kilocode_hierarchy_referral_prompt_v2_secure.md` (UPDATED, 16 sections)

**Total:** 5 specification documents, all Spec Kit compliant

**Compliance Target:** ≥ 90%

---

## Output

Please create all specification documents and confirm when complete. The documents should be ready for review and approval by the product team.

