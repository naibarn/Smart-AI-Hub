---
title: 'Subscription Plans and Monetization System'
spec_id: 'FEAT-012'
author: 'Development Team'
created_date: '2025-10-17'
last_updated: '2025-10-17'
version: '1.0'
status: 'Draft - Pending Development'
priority: 'P1 - High'
related_specs: ['POINTS_SYSTEM_SPEC', 'HIERARCHY_REFERRAL_SPEC', 'PAYMENT_SYSTEM_SPEC']
tags: ['monetization', 'subscription', 'revenue', 'business']
---

# Subscription Plans and Monetization System

## 1. Overview

The Subscription Plans system is a comprehensive subscription management and monetization platform for Smart AI Hub that enables users to select plans appropriate to their needs and budget. This system supports 5 main plans (Free, Basic, Pro, Enterprise, Enterprise Plus) with different features according to plan levels.

**Key Features:**

- **5 Subscription Plans** from Free to Enterprise Plus
- **Administrator UI** for managing Plans and pricing
- **Free Credits System** for new users
- **Promo Code System** with management UI
- **Plan-based Features** (API Rate Limits, Quotas, Support Tiers, Advanced Features)
- **Agency Revenue Sharing** (10% commission, PayPal withdrawal)
- **Flexible Pricing** adjustable by Administrator

**Importance:**

- Increases recurring revenue
- Reduces barrier to entry with Free Tier
- Increases user engagement with Daily Rewards
- Creates flexibility in plan selection
- Supports multiple business models

## 2. Objectives

This system is designed to:

1. **Create Sustainable Revenue**
   - Recurring revenue from monthly subscriptions
   - Multiple pricing tiers for different market segments
   - Agency revenue sharing model

2. **Increase User Acquisition**
   - Free Tier reduces barrier to entry
   - Free Credits for new users
   - Promo Codes for marketing campaigns

3. **Increase User Retention**
   - Daily Login Rewards
   - Plan upgrades for power users
   - Loyalty benefits

4. **Flexible Management**
   - Administrators can adjust Plans and pricing
   - Promo Code management
   - Free Credits configuration

5. **Support Business Growth**
   - Scalable pricing model
   - Enterprise plans for large organizations
   - Agency partnership program

## 3. User Stories

### Story 1: Choose Subscription Plan

**As a** new user  
**I want to** choose a Subscription Plan that fits my needs  
**So that I can** start using Smart AI Hub appropriately

**Acceptance Criteria:**

- [ ] Pricing page must clearly display all 5 plans
- [ ] Each plan must show: Price, Credits/month, Daily Rewards, Features
- [ ] Must have "Select Plan" button for each plan
- [ ] Free Tier must have "Start Free" button
- [ ] Must have feature comparison table between plans
- [ ] Display "Most Popular" badge for Pro Plan
- [ ] Display "Best Value" badge for Enterprise Plan

### Story 2: Sign up for Free Tier and Receive Free Credits

**As a** new user  
**I want to** sign up for Free Tier and receive Free Credits  
**So that I can** try the service without paying

**Acceptance Criteria:**

- [ ] When successfully registered, must receive 100 Credits immediately
- [ ] When verifying email, must receive 500 Points for free
- [ ] When completing profile, must receive 1,000 Points for free
- [ ] Display notification when receiving Free Credits/Points
- [ ] Free Credits must display in Dashboard
- [ ] Must have progress bar showing steps to receive Free Credits

### Story 3: Use Promo Code

**As a** user  
**I want to** use Promo Code to get discounts  
**So that I can** save costs

**Acceptance Criteria:**

- [ ] Checkout page must have Promo Code input field
- [ ] When entering correct code, must display discount received
- [ ] When entering wrong code, must display "Promo Code invalid or expired"
- [ ] Promo Code must have expiration date
- [ ] Promo Code must have usage limit (number of times usable)
- [ ] Display price before and after using Promo Code
- [ ] Promo Code must be usable only once per user (if specified)

### Story 4: Administrator Manage Subscription Plans

**As an** Administrator  
**I want to** manage Subscription Plans and pricing  
**So that I can** adjust pricing strategy according to market conditions

**Acceptance Criteria:**

- [ ] Must have Admin UI for managing Plans (/admin/plans)
- [ ] Can Create, Edit, Delete Plans
- [ ] Can specify: Plan Name, Price, Credits/month, Daily Rewards, Features
- [ ] Can set API Rate Limits per Plan
- [ ] Can Enable/Disable Plans
- [ ] Can set Plan for which User Tier (General, Organization, Agency)
- [ ] Must have Preview of Pricing Page before Publish
- [ ] Must have Audit Log recording Plan changes

### Story 5: Administrator Manage Promo Codes

**As an** Administrator  
**I want to** create and manage Promo Codes  
**So that I can** do marketing campaigns and increase conversions

**Acceptance Criteria:**

- [ ] Must have Admin UI for managing Promo Codes (/admin/promo-codes)
- [ ] Can Create, Edit, Delete, Disable Promo Codes
- [ ] Can specify: Code, Discount (%), Valid From, Valid To, Usage Limit
- [ ] Can specify: First-time User Only, Specific Plans Only
- [ ] Display Usage Statistics (usage count, Revenue Impact)
- [ ] Can Export list of users who used Promo Code
- [ ] Must have Bulk Create for Campaign Codes (e.g., NEWYEAR2025-001 to NEWYEAR2025-100)

### Story 6: Administrator Manage Free Credits

**As an** Administrator  
**I want to** set the amount of Free Credits for new users  
**So that I can** adjust acquisition strategy

**Acceptance Criteria:**

- [ ] Must have Admin UI for managing Free Credits (/admin/free-credits)
- [ ] Can set: Signup Credits, Email Verification Credits, Profile Completion Credits
- [ ] Can Enable/Disable each milestone
- [ ] Display Statistics (number of users who received, Total Credits distributed)
- [ ] Can set Profile Completion requirements (e.g., what fields to fill)
- [ ] Must have Preview of Onboarding Flow

### Story 7: Agency Receive Revenue Sharing

**As an** Agency User  
**I want to** receive 10% commission from subscriptions of users under me  
**So that I can** create revenue from managing users

**Acceptance Criteria:**

- [ ] Agency receives 10% commission as Credits when users under them buy subscriptions
- [ ] Display Commission Balance in Agency Dashboard
- [ ] Display Commission History (list of commissions received)
- [ ] Can Withdraw as money via PayPal (minimum $100)
- [ ] Must maintain at least 10,000 Credits in account
- [ ] Can Withdraw only Credits exceeding 10,000
- [ ] Use Credits → USD conversion table according to set rate
- [ ] Must have Withdrawal History and Status (Pending, Completed, Failed)

### Story 8: Upgrade/Downgrade Plan

**As a** user  
**I want to** Upgrade or Downgrade Plan  
**So that I can** adjust plan to fit changing needs

**Acceptance Criteria:**

- [ ] Must have "Upgrade Plan" / "Downgrade Plan" button in Dashboard
- [ ] Display comparison table of Current Plan vs New Plan
- [ ] Display additional price to pay (Prorated) for Upgrade
- [ ] Display Refund Amount (Prorated) for Downgrade
- [ ] Must have Confirmation Dialog before Upgrade/Downgrade
- [ ] Upgrade takes effect immediately, Downgrade takes effect in next cycle
- [ ] Send Email confirmation after Upgrade/Downgrade

### Story 9: View Usage and Quotas

**As a** user  
**I want to** view Usage and Quotas of current Plan  
**So that I can** know how much I've used and how much is left

**Acceptance Criteria:**

- [ ] Dashboard displays Current Plan and Renewal Date
- [ ] Display Credits Usage (Used / Total)
- [ ] Display API Requests (Used / Limit)
- [ ] Display Daily Rewards (Claimed / Total)
- [ ] Display Progress Bar for each metric
- [ ] Notify when approaching Quota Limit (80%, 90%, 100%)

### Story 10: Cancel Subscription

**As a** user  
**I want to** Cancel Subscription  
**So that I can** stop monthly billing

**Acceptance Criteria:**

- [ ] Must have "Cancel Subscription" button in Settings
- [ ] Display Confirmation Dialog with reason for cancellation
- [ ] Display when Subscription will expire
- [ ] Display will change to Free Tier when expired
- [ ] No Refund for current month
- [ ] Send Email confirmation after Cancel
- [ ] Must have "Pause Subscription" option instead of Cancel

## 4. Scope

### 4.1 In Scope

**4.1.1 Subscription Plans Management**

- 5 Plans: Free, Basic ($9.99), Pro ($49.99), Enterprise ($299.99), Enterprise Plus ($499.99)
- Administrator UI for managing Plans and pricing
- Plan-based Credits allocation (monthly)
- Plan-based Daily Login Rewards
- Plan-based API Rate Limits
- Plan-based Features (Support Tiers, Advanced Analytics, Custom Integrations)
- Plan assignment according to User Tier (General, Organization, Agency)

**4.1.2 Free Credits System**

- 100 Credits free when registering
- 500 Points free when verifying email
- 1,000 Points free when completing profile
- Administrator UI for setting Free Credits amount
- Milestone tracking and notifications

**4.1.3 Promo Code System**

- Promo Code creation and management
- Discount percentage (e.g., 20% off)
- Expiration date (Valid From - Valid To)
- Usage limits (total number of times usable)
- First-time user only option
- Specific plans only option
- Usage statistics and reporting
- Administrator UI for managing Promo Codes
- Bulk creation for campaigns

**4.1.4 Agency Revenue Sharing**

- 10% commission from subscriptions of users under Agency
- Commission paid as Credits
- PayPal withdrawal (minimum $100)
- Must maintain 10,000 Credits in account
- Withdraw only Credits exceeding 10,000
- Use Credits → USD conversion table
- Commission dashboard and history
- Withdrawal request and processing

**4.1.5 Plan-based Features**

- API Rate Limits according to Plan
- Usage Quotas according to Plan
- Support Tiers (Email, Priority Email, Dedicated)
- Advanced Features (Analytics, Custom Models) for Pro+
- SLA Guarantee for Enterprise+

**4.1.6 Subscription Management**

- Subscribe to Plan
- Upgrade Plan (prorated billing)
- Downgrade Plan (effective next billing cycle)
- Cancel Subscription
- Pause Subscription
- Renewal management
- Payment method management

### 4.2 Out of Scope

- Annual billing (supports only monthly) - Phase 2
- Custom Plans for Enterprise - Phase 2
- Trial periods (Free Tier替代) - Phase 2
- Add-ons (Extra Credits, Extra API Calls) - Phase 2
- Team management within Plan - Phase 2
- Usage-based billing - Phase 2
- Cryptocurrency payments - Phase 3
- Reseller program (except Agency) - Phase 3
- White-label solutions - Phase 3

## 5. Functional Requirements

### FR-1: Subscription Plans

**FR-1.1: Plan Definitions**

| Plan                | Price   | User Tier    | Credits/Month | Daily Rewards    | API Rate Limit | Features                                      |
| ------------------- | ------- | ------------ | ------------- | ---------------- | -------------- | --------------------------------------------- |
| **Free**            | $0      | General      | 100 (signup)  | 50 Points/day    | 10 req/min     | Basic                                         |
| **Basic**           | $9.99   | General      | 1,000         | 100 Points/day   | 60 req/min     | + Email Support                               |
| **Pro**             | $49.99  | Organization | 10,000        | 500 Points/day   | 300 req/min    | + Priority Support, Analytics                 |
| **Enterprise**      | $299.99 | Organization | 100,000       | 2,000 Points/day | Unlimited      | + Dedicated Support, Custom Integrations, SLA |
| **Enterprise Plus** | $499.99 | Agency       | 200,000       | 4,000 Points/day | Unlimited      | + Revenue Sharing (10%)                       |

**FR-1.2: Plan Management (Administrator)**

- Create new Plan
- Edit existing Plan (Name, Price, Credits, Rewards, Features)
- Delete Plan (if no users)
- Enable/Disable Plan
- Set Plan visibility (Public/Private)
- Set Plan availability by User Tier
- Set API Rate Limits per Plan
- Set Features per Plan

**FR-1.3: Plan Subscription (User)**

- View available Plans (Pricing Page)
- Compare Plans (Feature comparison table)
- Subscribe to Plan (Payment flow)
- View Current Plan (Dashboard)
- View Usage and Quotas
- Upgrade Plan (immediate, prorated)
- Downgrade Plan (next billing cycle)
- Cancel Subscription

### FR-2: Free Credits System

**FR-2.1: Free Credits Allocation**

| Milestone          | Credits | Points | Condition                                                |
| ------------------ | ------- | ------ | -------------------------------------------------------- |
| Signup             | 100     | 0      | When successfully registered                             |
| Email Verification | 0       | 500    | When email verification successful                       |
| Profile Completion | 0       | 1,000  | When profile completely filled: Name, Phone, Avatar, Bio |

**FR-2.2: Free Credits Management (Administrator)**

- Configure Credits/Points per milestone
- Enable/Disable milestones
- Set Profile Completion requirements
- View Statistics (Total users, Total credits given)

**FR-2.3: User Experience**

- Progress bar showing steps to receive Free Credits
- Notification when receiving Free Credits/Points
- Dashboard displaying Free Credits received

### FR-3: Promo Code System

**FR-3.1: Promo Code Attributes**

- Code (unique, alphanumeric, case-insensitive)
- Discount Type: Percentage (%)
- Discount Value (0-100%)
- Valid From (datetime)
- Valid To (datetime)
- Usage Limit (total number, 0 = unlimited)
- Usage Count (number already used)
- First-time User Only (boolean)
- Applicable Plans (All or Specific Plans)
- Status (Active/Inactive)

**FR-3.2: Promo Code Management (Administrator)**

- Create Promo Code
- Edit Promo Code
- Delete Promo Code
- Enable/Disable Promo Code
- Bulk Create (generate multiple codes with pattern)
- View Usage Statistics
- Export Users who used Code

**FR-3.3: Promo Code Usage (User)**

- Enter Promo Code at Checkout
- Validate Promo Code (check expiration, usage limit, eligibility)
- Apply Discount to total price
- Display original price and discounted price
- One-time use per user (if specified)
- Save Promo Code usage to history

### FR-4: Agency Revenue Sharing

**FR-4.1: Commission Calculation**

- Agency receives 10% commission from every subscription payment of users under them
- Commission paid as Credits
- Commission = (Subscription Price in USD) × 10% × (Credits per USD rate)
- Example: User buys Pro Plan ($49.99) → Agency gets $4.999 → Convert to Credits according to rate

**FR-4.2: Credits to USD Conversion**

Use the same conversion table as buying Credits:

- 100 Credits = $10 → 1 Credit = $0.10
- 1,000 Credits = $80 → 1 Credit = $0.08
- 10,000 Credits = $600 → 1 Credit = $0.06

For Withdrawal use rate: **1 Credit = $0.08** (middle rate)

**FR-4.3: Withdrawal Requirements**

- Minimum: $100 (= 1,250 Credits)
- Must maintain: 10,000 Credits in account
- Withdrawable only: Credits exceeding 10,000
- Example: Have 15,000 Credits → Can withdraw maximum 5,000 Credits ($400)

**FR-4.4: Withdrawal Process**

1. Agency requests withdrawal (specify amount in USD)
2. System validates: balance, minimum, remaining credits
3. System converts Credits → USD
4. System creates withdrawal request (Pending)
5. Administrator reviews and approves
6. System processes PayPal payment
7. System deducts Credits from Agency account
8. System updates withdrawal status (Completed)

**FR-4.5: Agency Dashboard**

- Commission Balance (Credits)
- Commission Balance (USD equivalent)
- Commission History (list of commissions received)
- Withdrawal History (list of withdrawal requests)
- Withdrawal Status (Pending, Approved, Completed, Rejected)
- Request Withdrawal button

### FR-5: Plan-based Features

**FR-5.1: API Rate Limits**

| Plan            | Rate Limit  | Implementation       |
| --------------- | ----------- | -------------------- |
| Free            | 10 req/min  | Express rate limiter |
| Basic           | 60 req/min  | Express rate limiter |
| Pro             | 300 req/min | Express rate limiter |
| Enterprise      | Unlimited   | No rate limit        |
| Enterprise Plus | Unlimited   | No rate limit        |

**FR-5.2: Usage Quotas**

| Plan            | Credits/Month  | Daily Rewards | Rollover       |
| --------------- | -------------- | ------------- | -------------- |
| Free            | 100 (one-time) | 50 Points     | No             |
| Basic           | 1,000          | 100 Points    | No             |
| Pro             | 10,000         | 500 Points    | Yes (up to 2x) |
| Enterprise      | 100,000        | 2,000 Points  | Yes (up to 2x) |
| Enterprise Plus | 200,000        | 4,000 Points  | Yes (up to 2x) |

**FR-5.3: Support Tiers**

| Plan            | Support Type   | Response Time | Channels                  |
| --------------- | -------------- | ------------- | ------------------------- |
| Free            | Community      | Best effort   | Forum                     |
| Basic           | Email          | 48 hours      | Email                     |
| Pro             | Priority Email | 24 hours      | Email, Chat               |
| Enterprise      | Dedicated      | 4 hours       | Email, Chat, Phone        |
| Enterprise Plus | Dedicated      | 2 hours       | Email, Chat, Phone, Slack |

**FR-5.4: Advanced Features**

| Feature             | Free | Basic | Pro | Enterprise | Enterprise Plus |
| ------------------- | ---- | ----- | --- | ---------- | --------------- |
| Basic AI Models     | ✅   | ✅    | ✅  | ✅         | ✅              |
| Advanced Analytics  | ❌   | ❌    | ✅  | ✅         | ✅              |
| Custom Models       | ❌   | ❌    | ❌  | ✅         | ✅              |
| Custom Integrations | ❌   | ❌    | ❌  | ✅         | ✅              |
| SLA Guarantee       | ❌   | ❌    | ❌  | 99.9%      | 99.95%          |
| Revenue Sharing     | ❌   | ❌    | ❌  | ❌         | ✅              |

## 6. Non-Functional Requirements

**NFR-1: Performance**

- Pricing Page must load within 2 seconds
- Subscription API must respond within 500ms
- Promo Code validation must complete within 200ms
- Commission calculation must complete within 1 second

**NFR-2: Scalability**

- Support 10,000+ concurrent users
- Support 1,000+ subscriptions/day
- Support 10,000+ promo code validations/day

**NFR-3: Reliability**

- Subscription system uptime ≥ 99.9%
- Payment processing success rate ≥ 99%
- Commission calculation accuracy 100%

**NFR-4: Security**

- Payment information must be encrypted (PCI DSS compliant)
- Promo Codes must prevent brute force
- Agency withdrawal must have 2FA verification
- Administrator actions must have audit log

**NFR-5: Usability**

- Pricing Page must be responsive (mobile-friendly)
- Plan comparison must be clear and easy to understand
- Checkout flow must not exceed 3 steps
- Error messages must be clear and friendly

**NFR-6: Maintainability**

- Administrator UI must be easy to use (no technical knowledge required)
- Plans and Promo Codes must be editable without deploying code
- Commission rates must be configurable

## 7. Data Models

### 7.1 Subscription Plan Model

```typescript
interface SubscriptionPlan {
  id: string;
  name: string; // "Free", "Basic", "Pro", "Enterprise", "Enterprise Plus"
  slug: string; // "free", "basic", "pro", "enterprise", "enterprise-plus"
  price: number; // Monthly price in USD
  currency: string; // "USD"

  // Allocations
  creditsPerMonth: number; // 0 for Free (one-time 100)
  dailyRewardsPoints: number;

  // Limits
  apiRateLimit: number; // requests per minute, 0 = unlimited

  // Features
  features: string[]; // ["Email Support", "Analytics", "Custom Models", etc.]
  supportTier: 'Community' | 'Email' | 'Priority' | 'Dedicated';
  slaUptime: number | null; // 99.9, 99.95, or null

  // Eligibility
  userTiers: ('General' | 'Organization' | 'Admin' | 'Agency' | 'Administrator')[];

  // Metadata
  isActive: boolean;
  isPublic: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.2 User Subscription Model

```typescript
interface UserSubscription {
  id: string;
  userId: string;
  planId: string;

  // Billing
  status: 'active' | 'canceled' | 'past_due' | 'paused';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt: Date | null; // scheduled cancellation
  canceledAt: Date | null;

  // Payment
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  paymentMethodId: string;

  // Usage
  creditsUsed: number;
  apiRequestsUsed: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.3 Promo Code Model

```typescript
interface PromoCode {
  id: string;
  code: string; // unique, uppercase

  // Discount
  discountType: 'percentage';
  discountValue: number; // 0-100 for percentage

  // Validity
  validFrom: Date;
  validTo: Date;

  // Usage
  usageLimit: number; // 0 = unlimited
  usageCount: number;

  // Restrictions
  firstTimeUserOnly: boolean;
  applicablePlans: string[]; // Plan IDs, empty = all plans

  // Metadata
  isActive: boolean;
  createdBy: string; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.4 Promo Code Usage Model

```typescript
interface PromoCodeUsage {
  id: string;
  promoCodeId: string;
  userId: string;
  subscriptionId: string;

  // Discount Applied
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;

  // Metadata
  usedAt: Date;
}
```

### 7.5 Free Credits Config Model

```typescript
interface FreeCreditsConfig {
  id: string;

  // Milestones
  signupCredits: number;
  emailVerificationPoints: number;
  profileCompletionPoints: number;

  // Profile Completion Requirements
  profileRequirements: {
    name: boolean;
    phone: boolean;
    avatar: boolean;
    bio: boolean;
  };

  // Status
  isActive: boolean;

  // Metadata
  updatedBy: string; // Admin user ID
  updatedAt: Date;
}
```

### 7.6 Agency Commission Model

```typescript
interface AgencyCommission {
  id: string;
  agencyUserId: string;
  sourceUserId: string; // User who subscribed
  subscriptionId: string;

  // Commission
  subscriptionPrice: number; // USD
  commissionRate: number; // 0.10 (10%)
  commissionUSD: number;
  commissionCredits: number;
  creditsToUSDRate: number; // Conversion rate used

  // Status
  status: 'pending' | 'paid';
  paidAt: Date | null;

  // Metadata
  createdAt: Date;
}
```

### 7.7 Agency Withdrawal Model

```typescript
interface AgencyWithdrawal {
  id: string;
  agencyUserId: string;

  // Amount
  creditsAmount: number;
  usdAmount: number;
  conversionRate: number; // Credits to USD rate

  // PayPal
  paypalEmail: string;
  paypalTransactionId: string | null;

  // Status
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  rejectionReason: string | null;

  // Approval
  approvedBy: string | null; // Admin user ID
  approvedAt: Date | null;

  // Processing
  processedAt: Date | null;
  completedAt: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

## 8. API Specifications

### 8.1 Subscription Plans APIs

**GET /api/v1/plans**

- Description: Get all active subscription plans
- Auth: Public
- Response: `{ plans: SubscriptionPlan[] }`

**GET /api/v1/plans/:planId**

- Description: Get plan details
- Auth: Public
- Response: `{ plan: SubscriptionPlan }`

**POST /api/v1/subscriptions/subscribe** (User)

- Description: Subscribe to a plan
- Auth: Required (JWT)
- Request: `{ planId, paymentMethodId, promoCode? }`
- Response: `{ subscription: UserSubscription, clientSecret }`

**POST /api/v1/subscriptions/upgrade** (User)

- Description: Upgrade to higher plan
- Auth: Required (JWT)
- Request: `{ newPlanId }`
- Response: `{ subscription: UserSubscription, proratedAmount }`

**POST /api/v1/subscriptions/downgrade** (User)

- Description: Downgrade to lower plan
- Auth: Required (JWT)
- Request: `{ newPlanId }`
- Response: `{ subscription: UserSubscription, effectiveDate }`

**POST /api/v1/subscriptions/cancel** (User)

- Description: Cancel subscription
- Auth: Required (JWT)
- Request: `{ reason?, feedback? }`
- Response: `{ subscription: UserSubscription, cancelAt }`

**GET /api/v1/subscriptions/me** (User)

- Description: Get current subscription
- Auth: Required (JWT)
- Response: `{ subscription: UserSubscription, plan: SubscriptionPlan, usage: {...} }`

### 8.2 Promo Code APIs

**POST /api/v1/promo-codes/validate** (User)

- Description: Validate promo code
- Auth: Required (JWT)
- Request: `{ code, planId }`
- Response: `{ valid: boolean, discount: number, message? }`

**POST /api/v1/promo-codes/apply** (User)

- Description: Apply promo code at checkout
- Auth: Required (JWT)
- Request: `{ code, planId }`
- Response: `{ originalPrice, discountAmount, finalPrice }`

### 8.3 Free Credits APIs

**GET /api/v1/free-credits/status** (User)

- Description: Get free credits status
- Auth: Required (JWT)
- Response: `{ signupClaimed, emailVerified, profileCompleted, totalCredits, totalPoints }`

**POST /api/v1/free-credits/claim-email-verification** (User)

- Description: Claim email verification reward
- Auth: Required (JWT)
- Response: `{ points: 500, message }`

**POST /api/v1/free-credits/claim-profile-completion** (User)

- Description: Claim profile completion reward
- Auth: Required (JWT)
- Response: `{ points: 1000, message }`

### 8.4 Agency Commission APIs

**GET /api/v1/agency/commissions** (Agency)

- Description: Get commission history
- Auth: Required (JWT, Agency only)
- Query: `?page=1&limit=20`
- Response: `{ commissions: AgencyCommission[], total, balance }`

**GET /api/v1/agency/balance** (Agency)

- Description: Get commission balance
- Auth: Required (JWT, Agency only)
- Response: `{ creditsBalance, usdBalance, withdrawableCredits, withdrawableUSD }`

**POST /api/v1/agency/withdrawals/request** (Agency)

- Description: Request withdrawal
- Auth: Required (JWT, Agency only, 2FA)
- Request: `{ usdAmount, paypalEmail }`
- Response: `{ withdrawal: AgencyWithdrawal }`

**GET /api/v1/agency/withdrawals** (Agency)

- Description: Get withdrawal history
- Auth: Required (JWT, Agency only)
- Query: `?page=1&limit=20`
- Response: `{ withdrawals: AgencyWithdrawal[], total }`

### 8.5 Administrator APIs

**POST /api/v1/admin/plans** (Admin)

- Description: Create plan
- Auth: Required (JWT, Administrator only)
- Request: `{ name, price, creditsPerMonth, ... }`
- Response: `{ plan: SubscriptionPlan }`

**PUT /api/v1/admin/plans/:planId** (Admin)

- Description: Update plan
- Auth: Required (JWT, Administrator only)
- Request: `{ price?, creditsPerMonth?, ... }`
- Response: `{ plan: SubscriptionPlan }`

**DELETE /api/v1/admin/plans/:planId** (Admin)

- Description: Delete plan
- Auth: Required (JWT, Administrator only)
- Response: `{ success: true }`

**POST /api/v1/admin/promo-codes** (Admin)

- Description: Create promo code
- Auth: Required (JWT, Administrator only)
- Request: `{ code, discountValue, validFrom, validTo, ... }`
- Response: `{ promoCode: PromoCode }`

**POST /api/v1/admin/promo-codes/bulk** (Admin)

- Description: Bulk create promo codes
- Auth: Required (JWT, Administrator only)
- Request: `{ pattern, count, discountValue, ... }`
- Response: `{ promoCodes: PromoCode[] }`

**PUT /api/v1/admin/promo-codes/:codeId** (Admin)

- Description: Update promo code
- Auth: Required (JWT, Administrator only)
- Request: `{ discountValue?, validTo?, ... }`
- Response: `{ promoCode: PromoCode }`

**DELETE /api/v1/admin/promo-codes/:codeId** (Admin)

- Description: Delete promo code
- Auth: Required (JWT, Administrator only)
- Response: `{ success: true }`

**GET /api/v1/admin/promo-codes/:codeId/usage** (Admin)

- Description: Get promo code usage statistics
- Auth: Required (JWT, Administrator only)
- Response: `{ usageCount, users: [...], revenue: ... }`

**PUT /api/v1/admin/free-credits** (Admin)

- Description: Update free credits config
- Auth: Required (JWT, Administrator only)
- Request: `{ signupCredits, emailVerificationPoints, ... }`
- Response: `{ config: FreeCreditsConfig }`

**GET /api/v1/admin/free-credits/stats** (Admin)

- Description: Get free credits statistics
- Auth: Required (JWT, Administrator only)
- Response: `{ totalUsers, totalCreditsGiven, totalPointsGiven, ... }`

**GET /api/v1/admin/agency/withdrawals/pending** (Admin)

- Description: Get pending withdrawals
- Auth: Required (JWT, Administrator only)
- Response: `{ withdrawals: AgencyWithdrawal[] }`

**POST /api/v1/admin/agency/withdrawals/:withdrawalId/approve** (Admin)

- Description: Approve withdrawal
- Auth: Required (JWT, Administrator only)
- Response: `{ withdrawal: AgencyWithdrawal }`

**POST /api/v1/admin/agency/withdrawals/:withdrawalId/reject** (Admin)

- Description: Reject withdrawal
- Auth: Required (JWT, Administrator only)
- Request: `{ reason }`
- Response: `{ withdrawal: AgencyWithdrawal }`

## 9. Business Logic

### 9.1 Subscription Flow

```
User selects Plan → Enters Payment Info → Applies Promo Code (optional)
→ Validates Promo Code → Calculates Final Price → Processes Payment
→ Creates Subscription → Allocates Credits → Sends Confirmation Email
→ Calculates Agency Commission (if applicable) → Credits Commission to Agency
```

### 9.2 Promo Code Validation Logic

```javascript
function validatePromoCode(code, userId, planId) {
  // 1. Find promo code
  const promo = findPromoCode(code);
  if (!promo) return { valid: false, message: 'Promo code not found' };

  // 2. Check active status
  if (!promo.isActive) return { valid: false, message: 'Promo code is inactive' };

  // 3. Check expiration
  const now = new Date();
  if (now < promo.validFrom || now > promo.validTo) {
    return { valid: false, message: 'Promo code has expired' };
  }

  // 4. Check usage limit
  if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) {
    return { valid: false, message: 'Promo code usage limit reached' };
  }

  // 5. Check first-time user only
  if (promo.firstTimeUserOnly) {
    const hasSubscribed = checkUserHasSubscribed(userId);
    if (hasSubscribed) {
      return { valid: false, message: 'Promo code is for first-time users only' };
    }
  }

  // 6. Check applicable plans
  if (promo.applicablePlans.length > 0 && !promo.applicablePlans.includes(planId)) {
    return { valid: false, message: 'Promo code not applicable to this plan' };
  }

  // 7. Check if user already used this code
  const alreadyUsed = checkPromoCodeUsage(userId, promo.id);
  if (alreadyUsed) {
    return { valid: false, message: 'You have already used this promo code' };
  }

  // Valid
  return { valid: true, discount: promo.discountValue };
}
```

### 9.3 Agency Commission Calculation Logic

```javascript
function calculateAgencyCommission(subscription) {
  // 1. Get user's agency
  const user = getUser(subscription.userId);
  if (!user.agencyId) return null; // User not under any agency

  // 2. Get plan price
  const plan = getPlan(subscription.planId);
  const subscriptionPrice = plan.price; // USD

  // 3. Calculate commission (10%)
  const commissionRate = 0.1;
  const commissionUSD = subscriptionPrice * commissionRate;

  // 4. Convert USD to Credits
  const creditsToUSDRate = 0.08; // 1 Credit = $0.08
  const commissionCredits = Math.floor(commissionUSD / creditsToUSDRate);

  // 5. Create commission record
  const commission = {
    agencyUserId: user.agencyId,
    sourceUserId: user.id,
    subscriptionId: subscription.id,
    subscriptionPrice,
    commissionRate,
    commissionUSD,
    commissionCredits,
    creditsToUSDRate,
    status: 'pending',
  };

  // 6. Credit to agency account
  creditAgencyAccount(user.agencyId, commissionCredits);

  // 7. Mark as paid
  commission.status = 'paid';
  commission.paidAt = new Date();

  return commission;
}
```

### 9.4 Agency Withdrawal Logic

```javascript
function processWithdrawal(agencyUserId, usdAmount, paypalEmail) {
  // 1. Get agency balance
  const balance = getAgencyBalance(agencyUserId);

  // 2. Validate minimum amount
  if (usdAmount < 100) {
    throw new Error('Minimum withdrawal amount is $100');
  }

  // 3. Convert USD to Credits
  const creditsToUSDRate = 0.08;
  const creditsAmount = Math.ceil(usdAmount / creditsToUSDRate);

  // 4. Validate balance
  if (balance.credits < creditsAmount) {
    throw new Error('Insufficient balance');
  }

  // 5. Validate remaining balance
  const remainingCredits = balance.credits - creditsAmount;
  if (remainingCredits < 10000) {
    throw new Error('Must maintain minimum balance of 10,000 Credits');
  }

  // 6. Create withdrawal request
  const withdrawal = {
    agencyUserId,
    creditsAmount,
    usdAmount,
    conversionRate: creditsToUSDRate,
    paypalEmail,
    status: 'pending',
  };

  // 7. Wait for admin approval
  // (Admin will approve/reject via UI)

  return withdrawal;
}
```

### 9.5 Free Credits Allocation Logic

```javascript
function allocateFreeCredits(userId, milestone) {
  const config = getFreeCreditsConfig();

  switch (milestone) {
    case 'signup':
      if (config.signupCredits > 0) {
        creditUserAccount(userId, config.signupCredits, 0);
        notify(userId, `Welcome! You received ${config.signupCredits} free Credits`);
      }
      break;

    case 'email_verification':
      if (config.emailVerificationPoints > 0) {
        const alreadyClaimed = checkMilestoneClaimed(userId, 'email_verification');
        if (!alreadyClaimed) {
          creditUserAccount(userId, 0, config.emailVerificationPoints);
          markMilestoneClaimed(userId, 'email_verification');
          notify(
            userId,
            `Email verified! You received ${config.emailVerificationPoints} free Points`
          );
        }
      }
      break;

    case 'profile_completion':
      if (config.profileCompletionPoints > 0) {
        const profileComplete = checkProfileComplete(userId, config.profileRequirements);
        if (profileComplete) {
          const alreadyClaimed = checkMilestoneClaimed(userId, 'profile_completion');
          if (!alreadyClaimed) {
            creditUserAccount(userId, 0, config.profileCompletionPoints);
            markMilestoneClaimed(userId, 'profile_completion');
            notify(
              userId,
              `Profile completed! You received ${config.profileCompletionPoints} free Points`
            );
          }
        }
      }
      break;
  }
}
```

## 10. Security Considerations

**SC-1: Payment Security**

- Use Stripe for payment processing (PCI DSS compliant)
- Do not store credit card information in database
- Use Stripe Customer Portal for payment method management
- Use HTTPS for all payment-related requests

**SC-2: Promo Code Security**

- Promo codes must be case-insensitive but stored as uppercase
- Rate limit promo code validation (10 attempts per minute per IP)
- Log every promo code usage
- Prevent brute force attacks

**SC-3: Agency Withdrawal Security**

- Must have 2FA verification for withdrawal requests
- Administrator must approve every withdrawal
- Log every withdrawal request and approval
- Verify PayPal email ownership

**SC-4: Administrator Actions**

- All admin actions must have audit log
- Plan changes must have approval workflow (if production)
- Promo code creation must have rate limit
- Sensitive actions must have 2FA

**SC-5: Subscription Security**

- Validate user tier eligibility for each plan
- Prevent subscription fraud (multiple free trials)
- Detect and block suspicious payment patterns
- Implement webhook signature verification (Stripe)

## 11. Error Handling

| Error Scenario                         | HTTP Code | Error Message                                       | User Action               |
| -------------------------------------- | --------- | --------------------------------------------------- | ------------------------- |
| Invalid promo code                     | 400       | "Promo code not found or expired"                   | Try another code          |
| Promo code usage limit reached         | 400       | "This promo code has reached its usage limit"       | Try another code          |
| Already used promo code                | 400       | "You have already used this promo code"             | Try another code          |
| Payment failed                         | 402       | "Payment failed. Please check your payment method." | Update payment method     |
| Insufficient balance (withdrawal)      | 400       | "Insufficient balance for withdrawal"               | Request smaller amount    |
| Below minimum withdrawal               | 400       | "Minimum withdrawal amount is $100"                 | Request larger amount     |
| Below minimum balance after withdrawal | 400       | "Must maintain minimum balance of 10,000 Credits"   | Request smaller amount    |
| Plan not available for user tier       | 403       | "This plan is not available for your account type"  | Choose another plan       |
| Subscription already active            | 409       | "You already have an active subscription"           | Upgrade/downgrade instead |
| Downgrade not allowed (contractual)    | 403       | "Downgrade not allowed during contract period"      | Wait until contract ends  |

## 12. Performance Requirements

**PR-1: Page Load Times**

- Pricing Page: < 2 seconds
- Checkout Page: < 1.5 seconds
- Admin Plans UI: < 2 seconds
- Admin Promo Codes UI: < 2 seconds

**PR-2: API Response Times**

- GET /api/v1/plans: < 200ms
- POST /api/v1/subscriptions/subscribe: < 1 second
- POST /api/v1/promo-codes/validate: < 200ms
- GET /api/v1/agency/balance: < 300ms

**PR-3: Database Performance**

- Subscription queries: < 100ms
- Promo code lookups: < 50ms (indexed)
- Commission calculations: < 500ms

**PR-4: Scalability**

- Support 10,000+ active subscriptions
- Support 1,000+ promo code validations per minute
- Support 100+ concurrent admin users

## 13. Deployment Strategy

**DS-1: Database Migrations**

```sql
-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  credits_per_month INTEGER NOT NULL,
  daily_rewards_points INTEGER NOT NULL,
  api_rate_limit INTEGER DEFAULT 0,
  features JSONB,
  support_tier VARCHAR(50),
  sla_uptime DECIMAL(5,2),
  user_tiers TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at TIMESTAMP,
  canceled_at TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  payment_method_id VARCHAR(255),
  credits_used INTEGER DEFAULT 0,
  api_requests_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create promo_codes table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'percentage',
  discount_value DECIMAL(5,2) NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP NOT NULL,
  usage_limit INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  first_time_user_only BOOLEAN DEFAULT false,
  applicable_plans UUID[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create promo_code_usages table
CREATE TABLE promo_code_usages (
  id UUID PRIMARY KEY,
  promo_code_id UUID REFERENCES promo_codes(id),
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  original_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  final_price DECIMAL(10,2),
  used_at TIMESTAMP DEFAULT NOW()
);

-- Create free_credits_config table
CREATE TABLE free_credits_config (
  id UUID PRIMARY KEY,
  signup_credits INTEGER DEFAULT 100,
  email_verification_points INTEGER DEFAULT 500,
  profile_completion_points INTEGER DEFAULT 1000,
  profile_requirements JSONB,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create agency_commissions table
CREATE TABLE agency_commissions (
  id UUID PRIMARY KEY,
  agency_user_id UUID REFERENCES users(id),
  source_user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  subscription_price DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  commission_usd DECIMAL(10,2),
  commission_credits INTEGER,
  credits_to_usd_rate DECIMAL(10,4),
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create agency_withdrawals table
CREATE TABLE agency_withdrawals (
  id UUID PRIMARY KEY,
  agency_user_id UUID REFERENCES users(id),
  credits_amount INTEGER NOT NULL,
  usd_amount DECIMAL(10,2) NOT NULL,
  conversion_rate DECIMAL(10,4) NOT NULL,
  paypal_email VARCHAR(255) NOT NULL,
  paypal_transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_code_usages_user_id ON promo_code_usages(user_id);
CREATE INDEX idx_agency_commissions_agency_user_id ON agency_commissions(agency_user_id);
CREATE INDEX idx_agency_withdrawals_agency_user_id ON agency_withdrawals(agency_user_id);
CREATE INDEX idx_agency_withdrawals_status ON agency_withdrawals(status);
```

**DS-2: Deployment Steps**

1. **Phase 1: Database Setup**
   - Run migrations
   - Seed initial subscription plans
   - Create free credits config

2. **Phase 2: Backend Deployment**
   - Deploy subscription APIs
   - Deploy promo code APIs
   - Deploy agency commission APIs
   - Deploy admin APIs

3. **Phase 3: Frontend Deployment**
   - Deploy pricing page
   - Deploy checkout flow
   - Deploy admin UIs
   - Deploy agency dashboard

4. **Phase 4: Integration**
   - Setup Stripe webhooks
   - Setup PayPal integration
   - Configure email notifications
   - Test end-to-end flows

5. **Phase 5: Monitoring**
   - Setup monitoring dashboards
   - Setup alerts
   - Monitor subscription metrics
   - Monitor revenue metrics

**DS-3: Rollback Plan**

If serious problems occur:

1. Disable new subscriptions (feature flag)
2. Revert backend deployment
3. Revert frontend deployment
4. Keep existing subscriptions active
5. Debug and fix issues
6. Redeploy

## 14. Testing Strategy

**TS-1: Unit Tests**

- [ ] Promo code validation logic
- [ ] Commission calculation logic
- [ ] Withdrawal validation logic
- [ ] Free credits allocation logic
- [ ] Plan eligibility checks

**TS-2: Integration Tests**

- [ ] Subscription flow (end-to-end)
- [ ] Promo code application
- [ ] Agency commission crediting
- [ ] Withdrawal request and approval
- [ ] Free credits claiming
- [ ] Stripe webhook handling

**TS-3: E2E Tests**

- [ ] User selects plan and subscribes
- [ ] User applies promo code at checkout
- [ ] User upgrades plan
- [ ] User downgrades plan
- [ ] User cancels subscription
- [ ] Agency requests withdrawal
- [ ] Administrator creates plan
- [ ] Administrator creates promo code
- [ ] Administrator approves withdrawal

**TS-4: Performance Tests**

- [ ] Load test pricing page (1000 concurrent users)
- [ ] Load test promo code validation (500 req/s)
- [ ] Load test subscription API (100 req/s)
- [ ] Stress test commission calculation

**TS-5: Security Tests**

- [ ] Test promo code brute force protection
- [ ] Test payment security (Stripe)
- [ ] Test withdrawal 2FA
- [ ] Test admin authorization
- [ ] Test SQL injection (all inputs)

## 15. Documentation Requirements

**DR-1: User Documentation**

**File:** `docs/SUBSCRIPTION_PLANS_USER_GUIDE.md`

**Contents:**

- How to choose a plan
- How to subscribe
- How to use promo codes
- How to upgrade/downgrade
- How to cancel subscription
- How to claim free credits
- FAQ

**DR-2: Agency Documentation**

**File:** `docs/AGENCY_REVENUE_SHARING_GUIDE.md`

**Contents:**

- How revenue sharing works
- How to view commission balance
- How to request withdrawal
- Withdrawal requirements and limits
- PayPal setup
- FAQ

**DR-3: Administrator Documentation**

**File:** `docs/ADMIN_SUBSCRIPTION_MANAGEMENT_GUIDE.md`

**Contents:**

- How to create/edit plans
- How to create/manage promo codes
- How to configure free credits
- How to approve withdrawals
- How to monitor subscriptions
- Best practices

**DR-4: Developer Documentation**

**File:** `docs/SUBSCRIPTION_SYSTEM_DEVELOPMENT.md`

**Contents:**

- Architecture overview
- Database schema
- API specifications
- Business logic
- Integration with Stripe
- Integration with PayPal
- Testing guide

## 16. Examples and Use Cases

### Example 1: User Subscribes to Pro Plan with Promo Code

**Timeline:**

```
1. User visits Pricing Page
2. User clicks "Select Plan" on Pro Plan ($49.99)
3. User enters payment information
4. User enters promo code "LAUNCH20" (20% off)
5. System validates promo code → Valid
6. System calculates: $49.99 - 20% = $39.99
7. User confirms payment
8. Stripe processes payment → Success
9. System creates subscription
10. System allocates 10,000 Credits to user
11. System sends confirmation email
12. User's agency receives 10% commission (499 Credits)
```

**Result:**

- ✅ User subscribed to Pro Plan
- ✅ Paid $39.99 (saved $10)
- ✅ Received 10,000 Credits
- ✅ Agency received 499 Credits commission

---

### Example 2: New User Claims All Free Credits

**Timeline:**

```
1. User signs up → Receives 100 Credits immediately
2. User verifies email → Receives 500 Points
3. User completes profile (name, phone, avatar, bio) → Receives 1,000 Points
```

**Result:**

- ✅ Total: 100 Credits + 1,500 Points
- ✅ Ready to use Smart AI Hub services

---

### Example 3: Agency Requests Withdrawal

**Timeline:**

```
1. Agency has 25,000 Credits commission balance
2. Agency requests withdrawal: $1,200 (= 15,000 Credits)
3. System validates:
   - Balance: 25,000 Credits ✅
   - Minimum: $100 ✅
   - Remaining: 10,000 Credits ✅
4. System creates withdrawal request (Status: Pending)
5. Administrator reviews request
6. Administrator approves request
7. System processes PayPal payment
8. PayPal transfers $1,200 to Agency's account
9. System deducts 15,000 Credits from Agency
10. System updates withdrawal status (Status: Completed)
```

**Result:**

- ✅ Agency received $1,200 via PayPal
- ✅ Agency balance: 10,000 Credits remaining

---

### Example 4: Administrator Creates Seasonal Promo Code

**Timeline:**

```
1. Administrator goes to /admin/promo-codes
2. Administrator clicks "Create Promo Code"
3. Administrator fills form:
   - Code: NEWYEAR2025
   - Discount: 30%
   - Valid From: 2025-01-01 00:00
   - Valid To: 2025-01-31 23:59
   - Usage Limit: 1000
   - First-time User Only: Yes
   - Applicable Plans: All
4. Administrator clicks "Create"
5. System creates promo code
6. System displays success message
```

**Result:**

- ✅ Promo code "NEWYEAR2025" created
- ✅ 30% off for first-time users
- ✅ Valid for January 2025
- ✅ Limited to 1000 uses

---

### Example 5: User Upgrades from Basic to Pro

**Timeline:**

```
1. User currently on Basic Plan ($9.99/month)
2. User has used 10 days of current billing cycle (20 days remaining)
3. User clicks "Upgrade to Pro"
4. System calculates prorated amount:
   - Pro Plan: $49.99/month
   - Basic Plan refund: $9.99 × (20/30) = $6.66
   - Amount to pay: $49.99 - $6.66 = $43.33
5. User confirms upgrade
6. Stripe charges $43.33
7. System upgrades subscription immediately
8. System allocates 10,000 Credits (Pro Plan)
9. System sends confirmation email
```

**Result:**

- ✅ User upgraded to Pro Plan
- ✅ Paid $43.33 (prorated)
- ✅ Received 10,000 Credits immediately
- ✅ New billing cycle starts

---

## IMPORTANT NOTES

### This is a DOCUMENTATION ONLY Task

- **DO NOT implement any code**
- **DO NOT create any files except the Spec document**
- **Mark all features as "Pending Development"**
- **Focus on creating a comprehensive, detailed specification**

### Spec Kit Requirements

- **MUST have all 16 sections**
- **MUST follow the format from spec_example_good.md**
- **MUST be detailed and complete**
- **MUST include all 10 user stories with Acceptance Criteria**
- **MUST include all 5 examples with timelines**

### Next Steps After Spec Approval

1. Review and approve Spec document
2. Create implementation roadmap
3. Break down into development tasks
4. Assign to development team
5. Implement features
6. Test thoroughly
7. Deploy to production

---

## DELIVERABLE

**File:** `specs/SUBSCRIPTION_PLANS_SYSTEM_SPEC.md`

**Status:** Draft - Pending Development

**Estimated Development Time:** 8-10 weeks

**Priority:** P1 - High

---

REPOSITORY: https://github.com/naibarn/Smart-AI-Hub

START WITH: Creating the complete Spec Kit document with all 16 sections.
