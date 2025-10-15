---
title: "Credit Transaction Data Model"
author: "Development Team"
created_date: "2025-10-15"
version: "1.0"
status: "Draft"
priority: "P1"
type: "data_model"
category: "architecture"
dependencies: ["credit_account.md", "user.md"]
---

# Credit Transaction Data Model

## 1. ภาพรวม (Overview)

Credit Transaction เป็น data model ที่ใช้สำหรับบันทึกการเคลื่อนไหวของเครดิตทั้งหมดในระบบ Smart AI Hub โมเดลนี้เก็บข้อมูลการซื้อเครดิต การใช้เครดิต การคืนเครดิต และการเพิ่มเครดิตจากโปรโมชั่นต่างๆ ทุกการเปลี่ยนแปลงเครดิตในระบบจะถูกบันทึกเป็น transaction เพื่อให้สามารถตรวจสอบย้อนหลังและวิเคราะห์พฤติกรรมการใช้งานของผู้ใช้ได้

## 2. วัตถุประสงค์ (Objectives)

- 2.1 บันทึกประวัติการเคลื่อนไหวของเครดิตทั้งหมดในระบบ
- 2.2 รองรับการตรวจสอบย้อนหลังและการทำรายงานการใช้เครดิต
- 2.3 จัดเตรียมข้อมูลสำหรับระบบ billing และ analytics
- 2.4 รับประกันความถูกต้องและความสมบูรณ์ของข้อมูลการเคลื่อนไหวเครดิต
- 2.5 รองรับการคำนวณสถิติและสรุปยอดการใช้งานเครดิต

## 3. User Stories

### 3.1 ในฐานะผู้ดูแลระบบ ฉันต้องการดูประวัติการเคลื่อนไหวเครดิตของผู้ใช้เพื่อตรวจสอบปัญหา

**Acceptance Criteria:**
- AC 3.1.1: ฉันสามารถค้นหาประวัติการเคลื่อนไหวเครดิตตามผู้ใช้ได้
- AC 3.1.2: ฉันสามารถกรองตามช่วงเวลาที่ต้องการได้
- AC 3.1.3: ฉันสามารถดูรายละเอียดของแต่ละ transaction (จำนวนเครดิต ประเภท เหตุผล) ได้
- AC 3.1.4: ฉันสามารถ export ข้อมูลประวัติการเคลื่อนไหวเครดิตเป็น CSV ได้
- AC 3.1.5: ฉันสามารถดูสรุปยอดการเคลื่อนไหวเครดิตรายวัน/รายเดือนได้
- AC 3.1.6: ระบบต้องแสดงข้อมูลการคำนวณยอดคงเหลืออย่างถูกต้อง
- AC 3.1.7: ฉันสามารถตรวจสอบความถูกต้องของการคำนวณเครดิตย้อนหลังได้

### 3.2 ในฐานะผู้ใช้งาน ฉันต้องการดูประวัติการใช้เครดิตของฉันเพื่อจัดการการใช้งาน

**Acceptance Criteria:**
- AC 3.2.1: ฉันสามารถดูประวัติการใช้เครดิตล่าสุดของฉันได้
- AC 3.2.2: ฉันสามารถดูรายละเอียดว่าใช้เครดิตไปกับบริการอะไร
- AC 3.2.3: ฉันสามารถดูยอดเครดิตคงเหลือปัจจุบันได้
- AC 3.2.4: ฉันสามารถดูประวัติการซื้อเครดิตและการเพิ่มเครดิตจากโปรโมชั่นได้
- AC 3.2.5: ฉันสามารถดูรายงานการใช้เครดิตรายเดือนของฉันได้
- AC 3.2.6: ฉันสามารถค้นหา transaction ตามคำสำคัญได้
- AC 3.2.7: ระบบต้องแสดงข้อมูลเป็นภาษาที่ฉันเข้าใจง่าย

## 4. ขอบเขตงาน (Scope)

### In Scope:
- 4.1 การออกแบบ database schema สำหรับ credit transactions
- 4.2 การบันทึกทุกการเคลื่อนไหวของเครดิต (ซื้อ/ใช้/คืน/เพิ่ม)
- 4.3 การเชื่อมโยงกับ credit accounts และ users
- 4.4 การจัดเก็บ metadata สำหรับข้อมูลเพิ่มเติม
- 4.5 การสร้าง indexes สำหรับการค้นหาที่มีประสิทธิภาพ
- 4.6 การรองรับการทำรายงานและ analytics
- 4.7 การตรวจสอบความถูกต้องของข้อมูล

### Out of Scope:
- 4.8 การประมวลผลการชำระเงิน (อยู่ใน payment service)
- 4.9 การจัดการโปรโมชั่น (อยู่ใน promo service)
- 4.10 การส่งการแจ้งเตือนเมื่อเครดิตเปลี่ยนแปลง
- 4.11 การทำนายการใช้เครดิตของผู้ใช้
- 4.12 การจัดการ dispute หรือ chargebacks

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Database Schema

```sql
CREATE TABLE credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL,
  amount      INTEGER NOT NULL,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
  reason      VARCHAR(50) NOT NULL CHECK (reason IN ('purchase', 'usage', 'refund', 'promo', 'adjustment')),
  metadata    JSONB,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (account_id) REFERENCES credit_accounts(id),
  
  INDEX idx_credit_transactions_account_created (account_id, created_at),
  INDEX idx_credit_transactions_type (type),
  INDEX idx_credit_transactions_reason (reason),
  INDEX idx_credit_transactions_created_at (created_at)
);
```

### 5.2 Prisma Model Definition

```prisma
model CreditTransaction {
  id          String   @id @default(uuid())
  accountId   String
  amount      Int
  type        String   // debit, credit
  reason      String   // purchase, usage, refund, promo, adjustment
  metadata    Json?
  createdAt   DateTime @default(now())

  account CreditAccount @relation(fields: [accountId], references: [id])

  @@index([accountId, createdAt])
  @@index([type])
  @@index([reason])
  @@index([createdAt])
  @@map("credit_transactions")
}
```

### 5.3 API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/transactions` | GET | List transactions for authenticated user | Bearer Token |
| `/api/transactions/:id` | GET | Get transaction details | Bearer Token |
| `/api/admin/transactions` | GET | List all transactions (admin) | Admin Token |
| `/api/admin/transactions/:userId` | GET | Get user transactions (admin) | Admin Token |
| `/api/admin/transactions/export` | GET | Export transactions to CSV | Admin Token |
| `/api/admin/transactions/summary` | GET | Get transaction summary | Admin Token |

### 5.4 Security Requirements

- SR 5.4.1: ผู้ใช้สามารถดู transactions ของตัวเองเท่านั้น
- SR 5.4.2: Admin เท่านั้นที่สามารถดู transactions ของผู้ใช้อื่นได้
- SR 5.4.3: ข้อมูลที่บอกความละเอียดเกินไปต้องถูกเข้ารหัส
- SR 5.4.4: ต้องมี audit log สำหรับการเข้าถึงข้อมูล transactions
- SR 5.4.5: จำกัดจำนวน transactions ที่แสดงต่อหน้า (pagination)

### 5.5 Frontend Requirements

- FR 5.5.1: Transaction history page ใน user dashboard
- FR 5.5.2: Transaction details modal สำหรับดูข้อมูลเพิ่มเติม
- FR 5.5.3: Filter และ search functionality สำหรับ transactions
- FR 5.5.4: Export to CSV button สำหรับ admin users
- FR 5.5.5: Transaction summary charts ใน admin dashboard
- FR 5.5.6: Responsive design สำหรับ mobile devices
- FR 5.5.7: Loading states และ error handling

## 6. การทดสอบ (Testing)

### 6.1 Unit Testing
- UT 6.1.1: Test transaction creation พร้อม validation ทุกกรณี
- UT 6.1.2: Test transaction type validation (debit/credit)
- UT 6.1.3: Test transaction reason validation (purchase/usage/refund/promo)
- UT 6.1.4: Test metadata handling สำหรับข้อมูลเพิ่มเติม
- UT 6.1.5: Test transaction calculation logic

### 6.2 Integration Testing
- IT 6.2.1: Test transaction creation กับ credit account balance updates
- IT 6.2.2: Test API endpoints สำหรับดึงข้อมูล transactions
- IT 6.2.3: Test database queries สำหรับ filtering และ sorting
- IT 6.2.4: Test transaction export functionality
- IT 6.2.5: Test transaction summary calculations

### 6.3 E2E Testing
- E2E 6.3.1: Test user views transaction history ใน UI
- E2E 6.3.2: Test admin views user transactions ใน admin panel
- E2E 6.3.3: Test transaction filtering และ search functionality
- E2E 6.3.4: Test transaction export to CSV
- E2E 6.3.5: Test transaction details view

## 7. Dependencies และ Assumptions

### 7.1 Dependencies
- D 7.1.1: Credit Account model สำหรับเชื่อมโยง transactions
- D 7.1.2: User model สำหรับตรวจสอบสิทธิ์การเข้าถึง
- D 7.1.3: Authentication service สำหรับ verify user tokens
- D 7.1.4: Database service สำหรับ data persistence
- D 7.1.5: Logging service สำหรับ audit trails

### 7.2 Assumptions
- A 7.2.1: ทุกการเปลี่ยนแปลงเครดิตต้องถูกบันทึกเป็น transaction
- A 7.2.2: มีการ backup ข้อมูล transactions เป็นประจำ
- A 7.2.3: ผู้ใช้มีความเข้าใจเกี่ยวกับประเภทของ transactions
- A 7.2.4: ระบบมีประสิทธิภาพเพียงพอสำหรับจำนวน transactions ที่เพิ่มขึ้น
- A 7.2.5: มีการ monitor และ alert สำหรับ transactions ที่ผิดปกติ

## 8. Non-Functional Requirements

### 8.1 Performance
- NFR 8.1.1: Query response time < 200ms สำหรับการดึงข้อมูล transactions
- NFR 8.1.2: รองรับได้ 10,000 transactions ต่อนาที
- NFR 8.1.3: Export ข้อมูล 10,000 transactions ภายใน 30 วินาที
- NFR 8.1.4: Database indexes ถูกสร้างอย่างเหมาะสมสำหรับ queries

### 8.2 Reliability
- NFR 8.2.1: Transaction data integrity 100% (ไม่สูญหาย)
- NFR 8.2.2: System uptime 99.9% สำหรับ transaction services
- NFR 8.2.3: มี backup และ recovery plan สำหรับข้อมูล transactions
- NFR 8.2.4: มี monitoring สำหรับตรวจจับข้อผิดพลาด

### 8.3 Scalability
- NFR 8.3.1: รองรับการเพิ่มขึ้นของ transactions ได้ 1 ล้านรายการต่อเดือน
- NFR 8.3.2: สามารถ archive ข้อมูล transactions เก่าได้
- NFR 8.3.3: Database สามารถ scale ได้ตามการเติบโตของข้อมูล
- NFR 8.3.4: มีการ partition tables สำหรับข้อมูลขนาดใหญ่

## 9. Timeline และ Milestones

### Phase 1 (Week 1): Database Design
- 9.1.1: Finalize database schema และ Prisma model
- 9.1.2: Create database migration scripts
- 9.1.3: Setup database indexes สำหรับ performance
- 9.1.4: Create seed data สำหรับ testing

### Phase 2 (Week 2): Backend Development
- 9.2.1: Implement transaction service logic
- 9.2.2: Create API endpoints สำหรับ transactions
- 9.2.3: Implement authentication และ authorization
- 9.2.4: Add validation และ error handling

### Phase 3 (Week 3): Frontend Development
- 9.3.1: Create transaction history UI components
- 9.3.2: Implement filtering และ search functionality
- 9.3.3: Add transaction details view
- 9.3.4: Create admin transaction management interface

### Phase 4 (Week 4): Testing & Deployment
- 9.4.1: Complete unit, integration และ E2E testing
- 9.4.2: Performance testing และ optimization
- 9.4.3: Security audit สำหรับ transaction data
- 9.4.4: Deploy to production และ monitor

### Success Metrics
- SM 9.5.1: Transaction query response time < 200ms
- SM 9.5.2: Zero data loss incidents
- SM 9.5.3: User satisfaction score > 4.5/5 สำหรับ transaction history
- SM 9.5.4: Admin efficiency improvement > 50% สำหรับ transaction monitoring