---
title: "Subscription Plans and Monetization System"
author: "Development Team"
created_date: "2025-10-17"
last_updated: "2025-10-17"
version: "1.0"
status: "Draft - Pending Development"
priority: "P1 - High"
related_specs: ["POINTS_SYSTEM_SPEC", "HIERARCHY_REFERRAL_SPEC", "PAYMENT_SYSTEM_SPEC"]
---

# Subscription Plans and Monetization System

## 1. ภาพรวม (Overview)

ระบบ Subscription Plans เป็นระบบการจัดการแผนการใช้งานและการเก็บเงินของ Smart AI Hub ที่ช่วยให้ผู้ใช้สามารถเลือกแผนที่เหมาะสมกับความต้องการและงบประมาณของตนเอง ระบบนี้รองรับ 5 แผนหลัก (Free, Basic, Pro, Enterprise, Enterprise Plus) พร้อมฟีเจอร์ที่แตกต่างกันตามระดับของแผน

**คุณสมบัติหลัก:**
- **5 Subscription Plans** ตั้งแต่ Free ถึง Enterprise Plus
- **Administrator UI** สำหรับจัดการ Plans และราคา
- **Free Credits System** สำหรับผู้ใช้ใหม่
- **Promo Code System** พร้อม UI จัดการ
- **Plan-based Features** (API Rate Limits, Quotas, Support Tiers, Advanced Features)
- **Agency Revenue Sharing** (10% commission, PayPal withdrawal)
- **Flexible Pricing** ที่ Administrator ปรับได้

**ความสำคัญ:**
- เพิ่มรายได้ประจำ (Recurring Revenue)
- ลด Barrier to Entry ด้วย Free Tier
- เพิ่ม User Engagement ด้วย Daily Rewards
- สร้างความยืดหยุ่นในการเลือกแผน
- รองรับ Business Model หลากหลาย

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

1. **สร้างรายได้ที่ยั่งยืน**
   - Recurring revenue จาก monthly subscriptions
   - Multiple pricing tiers สำหรับ market segments ต่างๆ
   - Agency revenue sharing model

2. **เพิ่ม User Acquisition**
   - Free Tier ลด barrier to entry
   - Free Credits สำหรับผู้ใช้ใหม่
   - Promo Codes สำหรับ marketing campaigns

3. **เพิ่ม User Retention**
   - Daily Login Rewards
   - Plan upgrades สำหรับ power users
   - Loyalty benefits

4. **ยืดหยุ่นในการจัดการ**
   - Administrator สามารถปรับ Plans และราคาได้
   - Promo Code management
   - Free Credits configuration

5. **รองรับ Business Growth**
   - Scalable pricing model
   - Enterprise plans สำหรับองค์กรขนาดใหญ่
   - Agency partnership program

## 3. User Stories

### Story 1: เลือก Subscription Plan

**ในฐานะ** ผู้ใช้ใหม่  
**ฉันต้องการ** เลือก Subscription Plan ที่เหมาะกับความต้องการของฉัน  
**เพื่อที่จะ** เริ่มใช้งาน Smart AI Hub ได้อย่างเหมาะสม

**Acceptance Criteria:**
- [ ] หน้า Pricing ต้องแสดง Plans ทั้ง 5 แผนอย่างชัดเจน
- [ ] แต่ละ Plan ต้องแสดง: ราคา, Credits/เดือน, Daily Rewards, Features
- [ ] มีปุ่ม "เลือกแผนนี้" (Select Plan) สำหรับแต่ละ Plan
- [ ] Free Tier ต้องมีปุ่ม "เริ่มใช้งานฟรี" (Start Free)
- [ ] มีตารางเปรียบเทียบ Features ระหว่าง Plans
- [ ] แสดง "Most Popular" badge สำหรับ Pro Plan
- [ ] แสดง "Best Value" badge สำหรับ Enterprise Plan

### Story 2: สมัคร Free Tier และรับ Free Credits

**ในฐานะ** ผู้ใช้ใหม่  
**ฉันต้องการ** สมัคร Free Tier และรับ Free Credits  
**เพื่อที่จะ** ทดลองใช้งานโดยไม่ต้องจ่ายเงิน

**Acceptance Criteria:**
- [ ] เมื่อสมัครสมาชิกสำเร็จ ต้องได้รับ 100 Credits ฟรีทันที
- [ ] เมื่อ Verify Email ต้องได้รับ 500 Points ฟรี
- [ ] เมื่อ Complete Profile ต้องได้รับ 1,000 Points ฟรี
- [ ] แสดง notification เมื่อได้รับ Free Credits/Points
- [ ] Free Credits ต้องแสดงใน Dashboard
- [ ] มี progress bar แสดงขั้นตอนการรับ Free Credits

### Story 3: ใช้ Promo Code

**ในฐานะ** ผู้ใช้  
**ฉันต้องการ** ใช้ Promo Code เพื่อรับส่วนลด  
**เพื่อที่จะ** ประหยัดค่าใช้จ่าย

**Acceptance Criteria:**
- [ ] หน้า Checkout ต้องมีช่องกรอก Promo Code
- [ ] เมื่อกรอก Code ถูกต้อง ต้องแสดงส่วนลดที่ได้รับ
- [ ] เมื่อกรอก Code ผิด ต้องแสดงข้อความ "Promo Code ไม่ถูกต้องหรือหมดอายุ"
- [ ] Promo Code ต้องมีวันหมดอายุ
- [ ] Promo Code ต้องมี usage limit (จำนวนครั้งที่ใช้ได้)
- [ ] แสดงราคาก่อนและหลังใช้ Promo Code
- [ ] Promo Code ต้องใช้ได้เพียงครั้งเดียวต่อผู้ใช้ (ถ้ากำหนด)

### Story 4: Administrator จัดการ Subscription Plans

**ในฐานะ** Administrator  
**ฉันต้องการ** จัดการ Subscription Plans และราคา  
**เพื่อที่จะ** ปรับ pricing strategy ตามสถานการณ์ตลาด

**Acceptance Criteria:**
- [ ] มีหน้า Admin UI สำหรับจัดการ Plans (/admin/plans)
- [ ] สามารถ Create, Edit, Delete Plans ได้
- [ ] สามารถกำหนด: Plan Name, Price, Credits/month, Daily Rewards, Features
- [ ] สามารถกำหนด API Rate Limits ต่อ Plan
- [ ] สามารถ Enable/Disable Plans
- [ ] สามารถกำหนด Plan สำหรับ User Tier ใด (General, Organization, Agency)
- [ ] มี Preview ของ Pricing Page ก่อน Publish
- [ ] มี Audit Log บันทึกการเปลี่ยนแปลง Plans

### Story 5: Administrator จัดการ Promo Codes

**ในฐานะ** Administrator  
**ฉันต้องการ** สร้างและจัดการ Promo Codes  
**เพื่อที่จะ** ทำ marketing campaigns และเพิ่ม conversions

**Acceptance Criteria:**
- [ ] มีหน้า Admin UI สำหรับจัดการ Promo Codes (/admin/promo-codes)
- [ ] สามารถ Create, Edit, Delete, Disable Promo Codes ได้
- [ ] สามารถกำหนด: Code, Discount (%), Valid From, Valid To, Usage Limit
- [ ] สามารถกำหนด: First-time User Only, Specific Plans Only
- [ ] แสดง Usage Statistics (จำนวนครั้งที่ใช้, Revenue Impact)
- [ ] สามารถ Export รายการผู้ใช้ที่ใช้ Promo Code
- [ ] มี Bulk Create สำหรับ Campaign Codes (เช่น NEWYEAR2025-001 ถึง NEWYEAR2025-100)

### Story 6: Administrator จัดการ Free Credits

**ในฐานะ** Administrator  
**ฉันต้องการ** กำหนดจำนวน Free Credits สำหรับผู้ใช้ใหม่  
**เพื่อที่จะ** ปรับ acquisition strategy

**Acceptance Criteria:**
- [ ] มีหน้า Admin UI สำหรับจัดการ Free Credits (/admin/free-credits)
- [ ] สามารถกำหนด: Signup Credits, Email Verification Credits, Profile Completion Credits
- [ ] สามารถ Enable/Disable แต่ละ milestone
- [ ] แสดง Statistics (จำนวนผู้ใช้ที่ได้รับ, Total Credits ที่แจก)
- [ ] สามารถกำหนดเงื่อนไข Profile Completion (เช่น ต้องกรอกอะไรบ้าง)
- [ ] มี Preview ของ Onboarding Flow

### Story 7: Agency รับ Revenue Sharing

**ในฐานะ** Agency User  
**ฉันต้องการ** รับ commission 10% จาก subscriptions ของ users ภายใต้ตน  
**เพื่อที่จะ** สร้างรายได้จากการบริหารจัดการ users

**Acceptance Criteria:**
- [ ] Agency ได้รับ 10% commission เป็น Credits เมื่อ users ภายใต้ตนซื้อ subscription
- [ ] แสดง Commission Balance ใน Agency Dashboard
- [ ] แสดง Commission History (รายการ commission ที่ได้รับ)
- [ ] สามารถ Withdraw เป็นเงินผ่าน PayPal ได้ (ขั้นต่ำ $100)
- [ ] ต้องคงเหลือ Credits อย่างน้อย 10,000 ในบัญชี
- [ ] สามารถ Withdraw เฉพาะ Credits ส่วนเกิน 10,000 เท่านั้น
- [ ] ใช้ตารางแปลง Credits → USD ตามอัตราที่กำหนด
- [ ] มี Withdrawal History และ Status (Pending, Completed, Failed)

### Story 8: Upgrade/Downgrade Plan

**ในฐานะ** ผู้ใช้  
**ฉันต้องการ** Upgrade หรือ Downgrade Plan  
**เพื่อที่จะ** ปรับแผนให้เหมาะกับความต้องการที่เปลี่ยนไป

**Acceptance Criteria:**
- [ ] มีปุ่ม "Upgrade Plan" / "Downgrade Plan" ใน Dashboard
- [ ] แสดงตารางเปรียบเทียบ Current Plan vs New Plan
- [ ] แสดงราคาที่ต้องจ่ายเพิ่ม (Prorated) สำหรับ Upgrade
- [ ] แสดง Refund Amount (Prorated) สำหรับ Downgrade
- [ ] มี Confirmation Dialog ก่อน Upgrade/Downgrade
- [ ] Upgrade มีผลทันที, Downgrade มีผลในรอบถัดไป
- [ ] ส่ง Email confirmation หลัง Upgrade/Downgrade

### Story 9: ดู Usage และ Quotas

**ในฐานะ** ผู้ใช้  
**ฉันต้องการ** ดู Usage และ Quotas ของ Plan ปัจจุบัน  
**เพื่อที่จะ** ทราบว่าใช้ไปเท่าไหร่และเหลืออีกเท่าไหร่

**Acceptance Criteria:**
- [ ] Dashboard แสดง Current Plan และ Renewal Date
- [ ] แสดง Credits Usage (Used / Total)
- [ ] แสดง API Requests (Used / Limit)
- [ ] แสดง Daily Rewards (Claimed / Total)
- [ ] แสดง Progress Bar สำหรับแต่ละ metric
- [ ] แจ้งเตือนเมื่อใกล้ถึง Quota Limit (80%, 90%, 100%)

### Story 10: Cancel Subscription

**ในฐานะ** ผู้ใช้  
**ฉันต้องการ** Cancel Subscription  
**เพื่อที่จะ** หยุดการเรียกเก็บเงินรายเดือน

**Acceptance Criteria:**
- [ ] มีปุ่ม "Cancel Subscription" ใน Settings
- [ ] แสดง Confirmation Dialog พร้อมเหตุผลในการ Cancel
- [ ] แสดงว่า Subscription จะหมดอายุเมื่อไหร่
- [ ] แสดงว่าจะเปลี่ยนเป็น Free Tier เมื่อหมดอายุ
- [ ] ไม่มี Refund สำหรับเดือนปัจจุบัน
- [ ] ส่ง Email confirmation หลัง Cancel
- [ ] มีตัวเลือก "Pause Subscription" แทน Cancel

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

**4.1.1 Subscription Plans Management**
- 5 Plans: Free, Basic ($9.99), Pro ($49.99), Enterprise ($299.99), Enterprise Plus ($499.99)
- Administrator UI สำหรับจัดการ Plans และราคา
- Plan-based Credits allocation (monthly)
- Plan-based Daily Login Rewards
- Plan-based API Rate Limits
- Plan-based Features (Support Tiers, Advanced Analytics, Custom Integrations)
- Plan assignment ตาม User Tier (General, Organization, Agency)

**4.1.2 Free Credits System**
- 100 Credits ฟรีเมื่อสมัครสมาชิก
- 500 Points ฟรีเมื่อ Verify Email
- 1,000 Points ฟรีเมื่อ Complete Profile
- Administrator UI สำหรับกำหนดจำนวน Free Credits
- Milestone tracking และ notifications

**4.1.3 Promo Code System**
- Promo Code creation และ management
- Discount percentage (เช่น 20% off)
- Expiration date (Valid From - Valid To)
- Usage limits (จำนวนครั้งที่ใช้ได้ทั้งหมด)
- First-time user only option
- Specific plans only option
- Usage statistics และ reporting
- Administrator UI สำหรับจัดการ Promo Codes
- Bulk creation สำหรับ campaigns

**4.1.4 Agency Revenue Sharing**
- 10% commission จาก subscriptions ของ users ภายใต้ Agency
- Commission paid เป็น Credits
- PayPal withdrawal (ขั้นต่ำ $100)
- ต้องคงเหลือ 10,000 Credits ในบัญชี
- Withdraw เฉพาะ Credits ส่วนเกิน 10,000
- ใช้ตารางแปลง Credits → USD
- Commission dashboard และ history
- Withdrawal request และ processing

**4.1.5 Plan-based Features**
- API Rate Limits ตาม Plan
- Usage Quotas ตาม Plan
- Support Tiers (Email, Priority Email, Dedicated)
- Advanced Features (Analytics, Custom Models) สำหรับ Pro+
- SLA Guarantee สำหรับ Enterprise+

**4.1.6 Subscription Management**
- Subscribe to Plan
- Upgrade Plan (prorated billing)
- Downgrade Plan (effective next billing cycle)
- Cancel Subscription
- Pause Subscription
- Renewal management
- Payment method management

### 4.2 นอกขอบเขตงาน (Out of Scope)

- Annual billing (รองรับเฉพาะ monthly) - Phase 2
- Custom Plans สำหรับ Enterprise - Phase 2
- Trial periods (Free Tier ทดแทน) - Phase 2
- Add-ons (Extra Credits, Extra API Calls) - Phase 2
- Team management ภายใน Plan - Phase 2
- Usage-based billing - Phase 2
- Cryptocurrency payments - Phase 3
- Reseller program (นอกจาก Agency) - Phase 3
- White-label solutions - Phase 3

## 5. ข้อกำหนดด้านฟังก์ชัน (Functional Requirements)

### FR-1: Subscription Plans

**FR-1.1: Plan Definitions**

| Plan | Price | User Tier | Credits/Month | Daily Rewards | API Rate Limit | Features |
|------|-------|-----------|---------------|---------------|----------------|----------|
| **Free** | $0 | General | 100 (signup) | 50 Points/day | 10 req/min | Basic |
| **Basic** | $9.99 | General | 1,000 | 100 Points/day | 60 req/min | + Email Support |
| **Pro** | $49.99 | Organization | 10,000 | 500 Points/day | 300 req/min | + Priority Support, Analytics |
| **Enterprise** | $299.99 | Organization | 100,000 | 2,000 Points/day | Unlimited | + Dedicated Support, Custom Integrations, SLA |
| **Enterprise Plus** | $499.99 | Agency | 200,000 | 4,000 Points/day | Unlimited | + Revenue Sharing (10%) |

**FR-1.2: Plan Management (Administrator)**

- Create new Plan
- Edit existing Plan (Name, Price, Credits, Rewards, Features)
- Delete Plan (ถ้าไม่มีผู้ใช้งาน)
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

| Milestone | Credits | Points | Condition |
|-----------|---------|--------|-----------|
| Signup | 100 | 0 | เมื่อสมัครสมาชิกสำเร็จ |
| Email Verification | 0 | 500 | เมื่อ verify email สำเร็จ |
| Profile Completion | 0 | 1,000 | เมื่อกรอกข้อมูลครบ: Name, Phone, Avatar, Bio |

**FR-2.2: Free Credits Management (Administrator)**

- Configure Credits/Points per milestone
- Enable/Disable milestones
- Set Profile Completion requirements
- View Statistics (Total users, Total credits given)

**FR-2.3: User Experience**

- Progress bar แสดงขั้นตอนการรับ Free Credits
- Notification เมื่อได้รับ Free Credits/Points
- Dashboard แสดง Free Credits ที่ได้รับ

### FR-3: Promo Code System

**FR-3.1: Promo Code Attributes**

- Code (unique, alphanumeric, case-insensitive)
- Discount Type: Percentage (%)
- Discount Value (0-100%)
- Valid From (datetime)
- Valid To (datetime)
- Usage Limit (จำนวนครั้งทั้งหมด, 0 = unlimited)
- Usage Count (จำนวนครั้งที่ใช้ไปแล้ว)
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
- One-time use per user (ถ้ากำหนด)
- Save Promo Code usage to history

### FR-4: Agency Revenue Sharing

**FR-4.1: Commission Calculation**

- Agency ได้รับ 10% commission จากทุก subscription payment ของ users ภายใต้ตน
- Commission paid เป็น Credits
- Commission = (Subscription Price in USD) × 10% × (Credits per USD rate)
- ตัวอย่าง: User ซื้อ Pro Plan ($49.99) → Agency ได้ $4.999 → แปลงเป็น Credits ตามอัตรา

**FR-4.2: Credits to USD Conversion**

ใช้ตารางแปลงเดียวกับการซื้อ Credits:
- 100 Credits = $10 → 1 Credit = $0.10
- 1,000 Credits = $80 → 1 Credit = $0.08
- 10,000 Credits = $600 → 1 Credit = $0.06

สำหรับ Withdrawal ใช้อัตรา: **1 Credit = $0.08** (อัตรากลาง)

**FR-4.3: Withdrawal Requirements**

- ขั้นต่ำ: $100 (= 1,250 Credits)
- ต้องคงเหลือ: 10,000 Credits ในบัญชี
- Withdraw ได้เฉพาะ: Credits ส่วนเกิน 10,000
- ตัวอย่าง: มี 15,000 Credits → Withdraw ได้สูงสุด 5,000 Credits ($400)

**FR-4.4: Withdrawal Process**

1. Agency request withdrawal (specify amount in USD)
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
- Commission History (รายการ commission ที่ได้รับ)
- Withdrawal History (รายการ withdrawal requests)
- Withdrawal Status (Pending, Approved, Completed, Rejected)
- Request Withdrawal button

### FR-5: Plan-based Features

**FR-5.1: API Rate Limits**

| Plan | Rate Limit | Implementation |
|------|------------|----------------|
| Free | 10 req/min | Express rate limiter |
| Basic | 60 req/min | Express rate limiter |
| Pro | 300 req/min | Express rate limiter |
| Enterprise | Unlimited | No rate limit |
| Enterprise Plus | Unlimited | No rate limit |

**FR-5.2: Usage Quotas**

| Plan | Credits/Month | Daily Rewards | Rollover |
|------|---------------|---------------|----------|
| Free | 100 (one-time) | 50 Points | No |
| Basic | 1,000 | 100 Points | No |
| Pro | 10,000 | 500 Points | Yes (up to 2x) |
| Enterprise | 100,000 | 2,000 Points | Yes (up to 2x) |
| Enterprise Plus | 200,000 | 4,000 Points | Yes (up to 2x) |

**FR-5.3: Support Tiers**

| Plan | Support Type | Response Time | Channels |
|------|--------------|---------------|----------|
| Free | Community | Best effort | Forum |
| Basic | Email | 48 hours | Email |
| Pro | Priority Email | 24 hours | Email, Chat |
| Enterprise | Dedicated | 4 hours | Email, Chat, Phone |
| Enterprise Plus | Dedicated | 2 hours | Email, Chat, Phone, Slack |

**FR-5.4: Advanced Features**

| Feature | Free | Basic | Pro | Enterprise | Enterprise Plus |
|---------|------|-------|-----|------------|-----------------|
| Basic AI Models | ✅ | ✅ | ✅ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ | ✅ | ✅ |
| Custom Models | ❌ | ❌ | ❌ | ✅ | ✅ |
| Custom Integrations | ❌ | ❌ | ❌ | ✅ | ✅ |
| SLA Guarantee | ❌ | ❌ | ❌ | 99.9% | 99.95% |
| Revenue Sharing | ❌ | ❌ | ❌ | ❌ | ✅ |

## 6. ข้อกำหนดด้านไม่ใช่ฟังก์ชัน (Non-Functional Requirements)

**NFR-1: Performance**
- Pricing Page ต้องโหลดเสร็จภายใน 2 วินาที
- Subscription API ต้อง respond ภายใน 500ms
- Promo Code validation ต้องเสร็จภายใน 200ms
- Commission calculation ต้องเสร็จภายใน 1 วินาที

**NFR-2: Scalability**
- รองรับ 10,000+ concurrent users
- รองรับ 1,000+ subscriptions/day
- รองรับ 10,000+ promo code validations/day

**NFR-3: Reliability**
- Subscription system uptime ≥ 99.9%
- Payment processing success rate ≥ 99%
- Commission calculation accuracy 100%

**NFR-4: Security**
- Payment information ต้องเข้ารหัส (PCI DSS compliant)
- Promo Codes ต้องป้องกัน brute force
- Agency withdrawal ต้องมี 2FA verification
- Administrator actions ต้องมี audit log

**NFR-5: Usability**
- Pricing Page ต้อง responsive (mobile-friendly)
- Plan comparison ต้องชัดเจนและเข้าใจง่าย
- Checkout flow ต้องไม่เกิน 3 steps
- Error messages ต้องชัดเจนและเป็นมิตร

**NFR-6: Maintainability**
- Administrator UI ต้องใช้งานง่าย (no technical knowledge required)
- Plans และ Promo Codes ต้องแก้ไขได้โดยไม่ต้อง deploy code
- Commission rates ต้อง configurable

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
  supportTier: "Community" | "Email" | "Priority" | "Dedicated";
  slaUptime: number | null; // 99.9, 99.95, or null
  
  // Eligibility
  userTiers: ("General" | "Organization" | "Admin" | "Agency" | "Administrator")[];
  
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
  status: "active" | "canceled" | "past_due" | "paused";
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
  discountType: "percentage";
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
  status: "pending" | "paid";
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
  status: "pending" | "approved" | "processing" | "completed" | "rejected";
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
  if (!promo) return { valid: false, message: "Promo code not found" };
  
  // 2. Check active status
  if (!promo.isActive) return { valid: false, message: "Promo code is inactive" };
  
  // 3. Check expiration
  const now = new Date();
  if (now < promo.validFrom || now > promo.validTo) {
    return { valid: false, message: "Promo code has expired" };
  }
  
  // 4. Check usage limit
  if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) {
    return { valid: false, message: "Promo code usage limit reached" };
  }
  
  // 5. Check first-time user only
  if (promo.firstTimeUserOnly) {
    const hasSubscribed = checkUserHasSubscribed(userId);
    if (hasSubscribed) {
      return { valid: false, message: "Promo code is for first-time users only" };
    }
  }
  
  // 6. Check applicable plans
  if (promo.applicablePlans.length > 0 && !promo.applicablePlans.includes(planId)) {
    return { valid: false, message: "Promo code not applicable to this plan" };
  }
  
  // 7. Check if user already used this code
  const alreadyUsed = checkPromoCodeUsage(userId, promo.id);
  if (alreadyUsed) {
    return { valid: false, message: "You have already used this promo code" };
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
  const commissionRate = 0.10;
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
    status: "pending"
  };
  
  // 6. Credit to agency account
  creditAgencyAccount(user.agencyId, commissionCredits);
  
  // 7. Mark as paid
  commission.status = "paid";
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
    throw new Error("Minimum withdrawal amount is $100");
  }
  
  // 3. Convert USD to Credits
  const creditsToUSDRate = 0.08;
  const creditsAmount = Math.ceil(usdAmount / creditsToUSDRate);
  
  // 4. Validate balance
  if (balance.credits < creditsAmount) {
    throw new Error("Insufficient balance");
  }
  
  // 5. Validate remaining balance
  const remainingCredits = balance.credits - creditsAmount;
  if (remainingCredits < 10000) {
    throw new Error("Must maintain minimum balance of 10,000 Credits");
  }
  
  // 6. Create withdrawal request
  const withdrawal = {
    agencyUserId,
    creditsAmount,
    usdAmount,
    conversionRate: creditsToUSDRate,
    paypalEmail,
    status: "pending"
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
    case "signup":
      if (config.signupCredits > 0) {
        creditUserAccount(userId, config.signupCredits, 0);
        notify(userId, `Welcome! You received ${config.signupCredits} free Credits`);
      }
      break;
      
    case "email_verification":
      if (config.emailVerificationPoints > 0) {
        const alreadyClaimed = checkMilestoneClaimed(userId, "email_verification");
        if (!alreadyClaimed) {
          creditUserAccount(userId, 0, config.emailVerificationPoints);
          markMilestoneClaimed(userId, "email_verification");
          notify(userId, `Email verified! You received ${config.emailVerificationPoints} free Points`);
        }
      }
      break;
      
    case "profile_completion":
      if (config.profileCompletionPoints > 0) {
        const profileComplete = checkProfileComplete(userId, config.profileRequirements);
        if (profileComplete) {
          const alreadyClaimed = checkMilestoneClaimed(userId, "profile_completion");
          if (!alreadyClaimed) {
            creditUserAccount(userId, 0, config.profileCompletionPoints);
            markMilestoneClaimed(userId, "profile_completion");
            notify(userId, `Profile completed! You received ${config.profileCompletionPoints} free Points`);
          }
        }
      }
      break;
  }
}
```

## 10. Security Considerations

**SC-1: Payment Security**
- ใช้ Stripe สำหรับ payment processing (PCI DSS compliant)
- ไม่เก็บ credit card information ใน database
- ใช้ Stripe Customer Portal สำหรับ payment method management
- ใช้ HTTPS สำหรับทุก payment-related requests

**SC-2: Promo Code Security**
- Promo codes ต้อง case-insensitive แต่เก็บเป็น uppercase
- Rate limit promo code validation (10 attempts per minute per IP)
- Log ทุกการใช้ promo code
- Prevent brute force attacks

**SC-3: Agency Withdrawal Security**
- ต้องมี 2FA verification สำหรับ withdrawal requests
- Administrator ต้อง approve ทุก withdrawal
- Log ทุก withdrawal request และ approval
- Verify PayPal email ownership

**SC-4: Administrator Actions**
- ทุก admin action ต้องมี audit log
- Plan changes ต้องมี approval workflow (ถ้าเป็น production)
- Promo code creation ต้องมี rate limit
- Sensitive actions ต้องมี 2FA

**SC-5: Subscription Security**
- Validate user tier eligibility สำหรับแต่ละ plan
- Prevent subscription fraud (multiple free trials)
- Detect และ block suspicious payment patterns
- Implement webhook signature verification (Stripe)

## 11. Error Handling

| Error Scenario | HTTP Code | Error Message | User Action |
|----------------|-----------|---------------|-------------|
| Invalid promo code | 400 | "Promo code not found or expired" | Try another code |
| Promo code usage limit reached | 400 | "This promo code has reached its usage limit" | Try another code |
| Already used promo code | 400 | "You have already used this promo code" | Try another code |
| Payment failed | 402 | "Payment failed. Please check your payment method." | Update payment method |
| Insufficient balance (withdrawal) | 400 | "Insufficient balance for withdrawal" | Request smaller amount |
| Below minimum withdrawal | 400 | "Minimum withdrawal amount is $100" | Request larger amount |
| Below minimum balance after withdrawal | 400 | "Must maintain minimum balance of 10,000 Credits" | Request smaller amount |
| Plan not available for user tier | 403 | "This plan is not available for your account type" | Choose another plan |
| Subscription already active | 409 | "You already have an active subscription" | Upgrade/downgrade instead |
| Downgrade not allowed (contractual) | 403 | "Downgrade not allowed during contract period" | Wait until contract ends |

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

ถ้าเกิดปัญหาร้ายแรง:
1. Disable new subscriptions (feature flag)
2. Revert backend deployment
3. Revert frontend deployment
4. Keep existing subscriptions active
5. Debug และ fix issues
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