---
title: 'Credit Account Management System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P0'
related_specs:
  ['FR-CREDIT-03', 'FR-CREDIT-04', 'credit_transaction.md', 'promo_code.md', 'promo_redemption.md']
---

# Credit Account Management System

## 1. ภาพรวม (Overview)

ระบบจัดการบัญชีเครดิต (Credit Account Management System) เป็นส่วนสำคัญของแพลตฟอร์ม Smart AI Hub ที่ใช้สำหรับจัดการยอดเงินเครดิตของผู้ใช้ ระบบนี้ทำงานร่วมกับระบบการชำระเงินผ่าน Stripe และรองรับการเติมเงิน การใช้งาน และการติดตามประวัติการทำรายการของผู้ใช้

ระบบนี้ทำงานโดยสร้างบัญชีเครดิตสำหรับผู้ใช้แต่ละคน เพื่อเก็บยอดเงินคงเหลือ ประวัติการทำรายการ และการใช้งานบริการต่างๆ ภายในแพลตฟอร์ม บัญชีเครดิตเป็นส่วนสำคัญในการควบคุมการเข้าถึงและการใช้งานบริการของ Smart AI Hub

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้สามารถจัดการยอดเงินเครดิตของผู้ใช้ได้อย่างปลอดภัย
- รองรับการเติมเงินผ่านระบบการชำระเงินต่างๆ
- ป้องกันการฉ้อโกงและการใช้งานโดยไม่ได้รับอนุญาต
- อำนวยความสะดวกในการติดตามประวัติการทำรายการ
- รองรับการใช้โปรโมชั่นและส่วนลดต่างๆ
- ทำงานร่วมกับระบบการชำระเงินอย่างมีประสิทธิภาพ
- ลดความซับซ้อนในการจัดการการเงินของผู้ใช้

## 3. User Stories

### Story 1: ผู้ใช้เติมเงินเข้าบัญชีเครดิต

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** เติมเงินเข้าบัญชีเครดิตของฉัน  
**เพื่อที่จะ** ใช้บริการต่างๆ ภายในแพลตฟอร์ม Smart AI Hub

**Acceptance Criteria:**

- [ ] หน้าจอเติมเงินต้องมีช่องกรอกจำนวนเงิน
- [ ] ต้องมีตัวเลือกช่องทางการชำระเงิน (บัตรเครดิต, โอนเงิน)
- [ ] ต้องมีการแสดงยอดเงินคงเหลือปัจจุบัน
- [ ] เมื่อชำระเงินสำเร็จ ต้องมีการอัปเดตยอดเงินในบัญชี
- [ ] ต้องมีการแสดงประวัติการเติมเงิน
- [ ] ต้องมีการแจ้งเตือนเมื่อเติมเงินสำเร็จ
- [ ] ต้องมีการบันทึกการทำรายการในระบบ

### Story 2: ผู้ใช้ตรวจสอบยอดเงินคงเหลือและประวัติการใช้งาน

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** ตรวจสอบยอดเงินคงเหลือและประวัติการใช้งาน  
**เพื่อที่จะ** ติดตามการใช้จ่ายเครดิตของฉัน

**Acceptance Criteria:**

- [ ] หน้า Dashboard ต้องแสดงยอดเงินคงเหลือปัจจุบัน
- [ ] ต้องมีหน้าจอสำหรับดูประวัติการทำรายการ
- [ ] ต้องสามารถกรองประวัติการทำรายการตามช่วงเวลา
- [ ] ต้องแสดงรายละเอียดของแต่ละรายการ (วันที่, จำนวนเงิน, ประเภท)
- [ ] ต้องมีการแสดงกราฟสรุปการใช้งาน
- [ ] ต้องสามารถส่งออกข้อมูลประวัติการทำรายการได้
- [ ] ต้องมีการแจ้งเตือนเมื่อยอดเงินใกล้หมด

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การสร้างและจัดการบัญชีเครดิต (Credit Account Creation and Management)
- การเติมเงินเข้าบัญชี (Credit Top-up)
- การตรวจสอบยอดเงินคงเหลือ (Balance Checking)
- การดึงข้อมูลประวัติการทำรายการ (Transaction History)
- การใช้เครดิตสำหรับบริการต่างๆ (Credit Usage)
- การจัดการโปรโมชั่นและส่วนลด (Promotion and Discount Management)
- การบันทึกและติดตามการทำรายการ (Transaction Logging)

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การจัดการบัญชีธนาคารโดยตรง (Direct Bank Account Management)
- การกู้ยืมเครดิต (Credit Loans)
- การจัดการดอกเบี้ย (Interest Management)
- การจัดการบัตรเครดิตโดยตรง (Direct Credit Card Management)
- การโอนเงินระหว่างผู้ใช้ (Peer-to-Peer Transfers)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint                                     | Description                   | Request Body                                 | Response                          |
| ------ | -------------------------------------------- | ----------------------------- | -------------------------------------------- | --------------------------------- |
| GET    | `/api/credit/accounts/:userId`               | ดึงข้อมูลบัญชีเครดิตของผู้ใช้ | -                                            | `{ creditAccount }`               |
| POST   | `/api/credit/accounts/:userId/topup`         | เติมเงินเข้าบัญชี             | `{ amount, paymentMethod }`                  | `{ transaction, updatedBalance }` |
| GET    | `/api/credit/accounts/:userId/transactions`  | ดึงประวัติการทำรายการ         | Query: `{ page, limit, startDate, endDate }` | `{ transactions, total }`         |
| POST   | `/api/credit/accounts/:userId/use`           | ใช้เครดิตสำหรับบริการ         | `{ amount, description, serviceId }`         | `{ transaction, updatedBalance }` |
| GET    | `/api/credit/accounts/:userId/balance`       | ตรวจสอบยอดเงินคงเหลือ         | -                                            | `{ balance }`                     |
| POST   | `/api/credit/accounts/:userId/promo/apply`   | ใช้โปรโมชั่น                  | `{ promoCode }`                              | `{ discount, updatedBalance }`    |
| GET    | `/api/credit/accounts/:userId/usage-summary` | ดึงสรุปการใช้งาน              | Query: `{ period }`                          | `{ summary }`                     |

### 5.2 Database Schema

```prisma
model CreditAccount {
  id            String   @id @default(uuid())
  userId        String   @unique
  balance       Int      @default(0) // เก็บเป็นหน่วยเงินที่เล็กที่สุด (เช่น สตางค์)
  currency      String   @default("THB")
  status        String   @default("active") // active, suspended, closed
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions  CreditTransaction[]
  promoRedemptions PromoRedemption[]

  @@index([userId])
  @@index([status])
  @@map("credit_accounts")
}
```

### 5.3 Security Requirements

- ต้องมีการตรวจสอบสิทธิ์ก่อนเข้าถึงข้อมูลบัญชีเครดิต
- ต้องมีการตรวจสอบสิทธิ์ก่อนทำรายการทางการเงิน
- ต้องมีการบันทึกการทำรายการทั้งหมดในระบบ Audit Log
- ต้องป้องกันการทำรายการที่ผิดกฎหมายหรือฉ้อโกง
- ต้องมีการตรวจสอบข้อมูลก่อนทำรายการ
- ต้องมีการจำกัดจำนวนเงินในการทำรายการ

### 5.4 Frontend Requirements

- มีหน้าจอสำหรับแสดงยอดเงินคงเหลือ
- มีหน้าจอสำหรับเติมเงิน
- มีหน้าจอสำหรับดูประวัติการทำรายการ
- มีการแสดงกราฟสรุปการใช้งาน
- มีการตรวจสอบสิทธิ์ก่อนแสดงข้อมูลการเงิน
- มีการแจ้งเตือนเมื่อมีการทำรายการ

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการสร้างบัญชีเครดิต
- [ ] ทดสอบการเติมเงินเข้าบัญชี
- [ ] ทดสอบการใช้เครดิต
- [ ] ทดสอบการตรวจสอบยอดเงินคงเหลือ
- [ ] ทดสอบการดึงประวัติการทำรายการ

### 6.2 Integration Tests

- [ ] ทดสอบ API Endpoints ทั้งหมด
- [ ] ทดสอบการทำงานร่วมกับระบบการชำระเงิน (Stripe)
- [ ] ทดสอบการทำงานร่วมกับระบบโปรโมชั่น
- [ ] ทดสอบการทำงานร่วมกับระบบผู้ใช้
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 E2E Tests

- [ ] ทดสอบการเติมเงินผ่าน UI
- [ ] ทดสอบการตรวจสอบยอดเงินคงเหลือ
- [ ] ทดสอบการดูประวัติการทำรายการ
- [ ] ทดสอบการใช้เครดิตสำหรับบริการ
- [ ] ทดสอบการใช้โปรโมชั่น

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ระบบต้องการ PostgreSQL Database สำหรับจัดเก็บข้อมูลบัญชีเครดิต
- ต้องมีระบบ User Management ที่ทำงานได้เต็มรูปแบบ
- ต้องมีระบบการชำระเงินผ่าน Stripe
- ต้องมีระบบจัดการโปรโมชั่น
- ต้องมีระบบติดตามการทำรายการ

### 7.2 Assumptions

- ผู้ใช้ต้องล็อกอินเข้าสู่ระบบก่อนทำการกระทำใดๆ
- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- มีการจัดการ Session และ Token อย่างปลอดภัย
- การทำรายการทางการเงินจะถูกบันทึกทั้งหมด

## 8. Non-Functional Requirements

### 8.1 Performance

- การตรวจสอบยอดเงินต้องทำงานได้ภายใน **100ms** (P95)
- การทำรายการต้องเสร็จภายใน **500ms**
- รองรับการทำรายการได้อย่างน้อย **100 รายการต่อวินาที**

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.5%**
- ต้องมีการ Backup ข้อมูลบัญชีเครดิตทุกวัน

### 8.3 Security

- ต้องมีการเข้ารหัสข้อมูลทางการเงินที่สำคัญ
- ต้องมีการตรวจสอบและป้องกันการฉ้อโกง
- ต้องมีการบันทึกการทำรายการทั้งหมด

## 9. Risks และ Mitigation

| Risk                       | Impact   | Probability | Mitigation Strategy                                  |
| -------------------------- | -------- | ----------- | ---------------------------------------------------- |
| Payment Processing Failure | High     | Medium      | มีระบบ Retry และ Rollback การทำรายการอัตโนมัติ       |
| Account Balance Mismatch   | Critical | Low         | ใช้ Database Transaction และมีการตรวจสอบความสอดคล้อง |
| Fraudulent Transactions    | High     | Medium      | มีระบบตรวจสอบพฤติกรรมการใช้งานที่ผิดปกติ             |
| Performance Issues         | Medium   | Low         | ใช้ Database Indexing และ Cache ข้อมูลที่ใช้บ่อย     |

## 10. Timeline และ Milestones

| Milestone               | Target Date | Status      |
| ----------------------- | ----------- | ----------- |
| Database Schema Design  | 2025-10-16  | Not Started |
| Backend API Development | 2025-10-18  | Not Started |
| Payment Integration     | 2025-10-20  | Not Started |
| Frontend Integration    | 2025-10-22  | Not Started |
| Testing                 | 2025-10-24  | Not Started |
| Production Deployment   | 2025-10-26  | Not Started |

## 11. Sign-off

| Role          | Name | Date | Signature |
| ------------- | ---- | ---- | --------- |
| Product Owner | -    | -    | Pending   |
| Tech Lead     | -    | -    | Pending   |
| QA Lead       | -    | -    | Pending   |

---

**หมายเหตุ:** เอกสารนี้เป็น Living Document และจะถูกอัปเดตตามความจำเป็น การเปลี่ยนแปลงใดๆ ต้องผ่านการอนุมัติจาก Product Owner และ Tech Lead
