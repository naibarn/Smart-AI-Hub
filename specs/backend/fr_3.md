---
title: 'Credit Management System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P0'
related_specs:
  [
    'FR-1',
    'FR-4',
    'FR-5',
    'credit_account.md',
    'credit_transaction.md',
    'promo_code.md',
    'promo_redemption.md',
    'usage_log.md',
  ]
---

# Credit Management System

## 1. ภาพรวม (Overview)

ระบบ Credit Management เป็นส่วนสำคัญของแพลตฟอร์ม Smart AI Hub ที่ทำหน้าที่ในการจัดการหน่วยความจุ (Credits) ของผู้ใช้ ซึ่งเป็นหน่วยวัดที่ใช้ในการเรียกใช้ AI Services ต่างๆ ระบบนี้ทำหน้าที่ในการติดตามยอดคงเหลือ บันทึกธุรกรรม และคำนวณค่าใช้จ่ายตามการใช้งานจริง

ระบบนี้ทำงานโดยใช้หลักการของ Immutable Ledger ซึ่งทุกธุรกรรมจะถูกบันทึกและไม่สามารถแก้ไขได้ ทำให้มั่นใจได้ในความถูกต้องและโปร่งใสของข้อมูลการเงิน นอกจากนี้ระบบยังรองรับการแจ้งเตือนเมื่อยอดคงเหลือต่ำ การหมดอายุของเครดิต และการดำเนินการคืนเงิน

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้สามารถติดตามยอดคงเหลือของเครดิตแบบ Real-time
- บันทึกประวัติธุรกรรมทั้งหมดอย่างถูกต้อง
- คำนวณค่าใช้จ่ายตามการใช้งาน AI Services อย่างเป็นธรรม
- แจ้งเตือนผู้ใช้เมื่อยอดคงเหลือต่ำ
- รองรับการหมดอายุของเครดิต
- อำนวยความสะดวกในการเติมเครดิตและการคืนเงิน
- ให้ข้อมูลการเงินที่โปร่งใสและน่าเชื่อถือ

## 3. User Stories

### Story 1: ผู้ใช้ตรวจสอบและเติมเครดิต

**ในฐานะ** ผู้ใช้แพลตฟอร์ม  
**ฉันต้องการ** ดูยอดคงเหลือของเครดิตและเติมเครดิตเพิ่ม  
**เพื่อที่จะ** ใช้งาน AI Services ต่อไปได้อย่างไม่ขาดตอน

**Acceptance Criteria:**

- [ ] ต้องมีหน้าจอแสดงยอดคงเหลือของเครดิตแบบ Real-time
- [ ] ต้องแสดงประวัติการใช้เครดิตและการเติมเครดิต
- [ ] ต้องมีวิธีการเติมเครดิตที่หลากหลาย (Credit Card, Bank Transfer)
- [ ] ต้องมีการแจ้งเตือนเมื่อยอดคงเหลือต่ำกว่าที่กำหนด
- [ ] ต้องแสดงวันหมดอายุของเครดิต (ถ้ามี)
- [ ] ต้องมีการแสดงราคาต่อหน่วยของแต่ละ AI Service
- [ ] ต้องมีการตรวจสอบสิทธิ์ก่อนทำธุรกรรมการเงิน

### Story 2: ผู้ดูแลระบบจัดการเครดิตและการคืนเงิน

**ในฐานะ** ผู้ดูแลระบบ  
**ฉันต้องการ** จัดการเครดิตของผู้ใช้และดำเนินการคืนเงิน  
**เพื่อที่จะ** แก้ไขปัญหาและให้บริการผู้ใช้ได้อย่างเป็นธรรม

**Acceptance Criteria:**

- [ ] ต้องมีหน้าจอสำหรับจัดการเครดิตของผู้ใช้ทั้งหมด
- [ ] ต้องสามารถปรับยอดเครดิตของผู้ใช้ได้ (เพิ่ม/ลด)
- [ ] ต้องสามารถดำเนินการคืนเงินได้
- [ ] ต้องมีการบันทึกเหตุผลในการปรับเครดิต
- [ ] ต้องมีการอนุมัติก่อนดำเนินการคืนเงิน
- [ ] ต้องแสดงรายงานการเคลื่อนไหวของเครดิตทั้งระบบ
- [ ] ต้องมีการตรวจสอบสิทธิ์ระดับ Admin ก่อนเข้าถึง

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การติดตามยอดคงเหลือเครดิต (Balance Tracking)
- การบันทึกธุรกรรม (Transaction Logging)
- การคำนวณค่าใช้จ่าย (Cost Calculation)
- การแจ้งเตือนยอดต่ำ (Low Balance Alerts)
- การเติมเครดิต (Credit Top-up)
- การคืนเงิน (Refund Processing)
- การหมดอายุเครดิต (Credit Expiration)

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การจัดการส่วนลดและโปรโมชั่น (Discount & Promotion Management)
- การวางบิลและใบเสร็จ (Invoicing)
- การรายงานภาษี (Tax Reporting)
- การจัดการสกุลเงินหลายสกุล (Multi-currency)
- การจัดการบัญชีธนาคาร (Bank Account Management)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint                    | Description         | Request Body                              | Response           |
| ------ | --------------------------- | ------------------- | ----------------------------------------- | ------------------ |
| GET    | `/api/credits/balance`      | ดึงยอดเครดิตคงเหลือ | Query: `{ userId }`                       | `{ balance }`      |
| GET    | `/api/credits/transactions` | ดึงประวัติธุรกรรม   | Query: `{ userId, page, limit }`          | `{ transactions }` |
| POST   | `/api/credits/topup`        | เติมเครดิต          | `{ amount, paymentMethod }`               | `{ transaction }`  |
| POST   | `/api/credits/deduct`       | หักเครดิต           | `{ userId, amount, reason }`              | `{ success }`      |
| GET    | `/api/credits/pricing`      | ดึงอัตราค่าบริการ   | Query: `{ service }`                      | `{ pricing }`      |
| POST   | `/api/credits/refund`       | คืนเครดิต           | `{ userId, amount, reason }`              | `{ transaction }`  |
| GET    | `/api/credits/summary`      | ดึงสรุปการใช้เครดิต | Query: `{ userId, period }`               | `{ summary }`      |
| PUT    | `/api/credits/settings`     | ตั้งค่าเครดิต       | `{ lowBalanceThreshold, expirationDays }` | `{ settings }`     |

### 5.2 Credit Deduction Rules

```yaml
# Text Generation Models
GPT-4: 10 credits per 1000 tokens
GPT-4-Turbo: 8 credits per 1000 tokens
GPT-3.5-Turbo: 1 credit per 1000 tokens
Claude-3-Opus: 12 credits per 1000 tokens
Claude-3-Sonnet: 8 credits per 1000 tokens
Claude-3-Haiku: 2 credits per 1000 tokens
Gemini-Pro: 5 credits per 1000 tokens

# Image Generation
DALL-E-3: 50 credits per image
Midjourney: 40 credits per image
Stable Diffusion: 20 credits per image

# Video Generation
Standard Video: 200 credits per minute
HD Video: 400 credits per minute
Sora2 Video Generation: 30 credits per video

# Special Services
Code Analysis: 5 credits per analysis
Translation: 3 credits per 1000 characters
Audio Transcription: 10 credits per minute
```

### 5.3 Database Schema

```prisma
model CreditAccount {
  id          String   @id @default(cuid())
  userId      String   @unique
  balance     Float    @default(0)
  totalEarned Float    @default(0)
  totalSpent  Float    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user         User                @relation(fields: [userId], references: [id])
  transactions CreditTransaction[]

  @@map("credit_accounts")
}

model CreditTransaction {
  id          String      @id @default(cuid())
  accountId   String
  amount      Float
  balance     Float
  type        TransactionType
  description String
  metadata    Json?
  createdAt   DateTime    @default(now())

  account CreditAccount @relation(fields: [accountId], references: [id])

  @@map("credit_transactions")
}

enum TransactionType {
  TOPUP
  USAGE
  REFUND
  EXPIRATION
  ADJUSTMENT
  PROMOTION
}
```

### 5.4 Security Requirements

- ต้องมีการตรวจสอบสิทธิ์ก่อนทำธุรกรรมทุกครั้ง
- ต้องมีการเข้ารหัสข้อมูลการเงินที่ละเอียดอ่อน
- ต้องมีการบันทึกธุรกรรมทั้งหมดในระบบ Audit Log
- ต้องมีการตรวจสอบความถูกต้องของคำขอ
- ต้องมีการป้องกันการฉ้อโกงและการใช้งานผิดปกติ
- ต้องมีการจำกัดจำนวนธุรกรรมต่อผู้ใช้

### 5.5 Frontend Requirements

- มีหน้าจอแสดงยอดเครดิตคงเหลือแบบ Real-time
- มีหน้าจอประวัติธุรกรรมที่สามารถกรองและค้นหาได้
- มีหน้าจอเติมเครดิตที่รองรับการชำระเงินหลายช่องทาง
- มีการแจ้งเตือนเมื่อยอดคงเหลือต่ำ
- มีการตรวจสอบสิทธิ์ก่อนแสดงข้อมูล
- รองรับการแสดงข้อมูลบนอุปกรณ์พกพา

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการคำนวณค่าใช้จ่ายตามการใช้งาน
- [ ] ทดสอบการหักเครดิต
- [ ] ทดสอบการเติมเครดิต
- [ ] ทดสอบการคืนเครดิต
- [ ] ทดสอบการตรวจสอบยอดคงเหลือ

### 6.2 Integration Tests

- [ ] ทดสอบ API Endpoints ทั้งหมด
- [ ] ทดสอบการทำงานร่วมกับระบบชำระเงิน
- [ ] ทดสอบการทำงานร่วมกับระบบจัดการผู้ใช้
- [ ] ทดสอบการทำงานร่วมกับระบบบันทึกการใช้งาน
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 E2E Tests

- [ ] ทดสอบการเติมเครดิตผ่าน UI
- [ ] ทดสอบการใช้เครดิตเพื่อเรียกใช้ AI Services
- [ ] ทดสอบการแสดงประวัติธุรกรรมผ่าน UI
- [ ] ทดสอบการแจ้งเตือนยอดต่ำ
- [ ] ทดสอบการคืนเครดิตผ่าน UI ของ Admin

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ต้องมีระบบจัดการผู้ใช้และการตรวจสอบสิทธิ์
- ต้องมีระบบชำระเงิน (Payment Gateway)
- ต้องมีระบบฐานข้อมูลที่เชื่อถือได้
- ต้องมีระบบส่งการแจ้งเตือน (Notification System)

### 7.2 Assumptions

- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- มีการจัดการ Session และ Token อย่างปลอดภัย
- ผู้ใช้มีวิธีการชำระเงินที่ถูกต้อง
- การเรียกใช้ AI Services จะถูกคำนวณค่าใช้จ่ายทันที

## 8. Non-Functional Requirements

### 8.1 Performance

- การตรวจสอบยอดเครดิตต้องทำงานได้ภายใน **100ms**
- ต้องรองรับธุรกรรมได้อย่างน้อย **100 ครั้งต่อวินาที**
- การประมวลผลธุรกรรมต้องมีความถูกต้อง 100%

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.9%**
- ต้องมีระบบสำรองข้อมูลธุรกรรม

### 8.3 Security

- ต้องมีการเข้ารหัสข้อมูลการเงินที่ละเอียดอ่อน
- ต้องมีการตรวจสอบและป้องกันการฉ้อโกง
- ต้องมีการบันทึกธุรกรรมทั้งหมด

## 9. Risks และ Mitigation

| Risk               | Impact   | Probability | Mitigation Strategy                      |
| ------------------ | -------- | ----------- | ---------------------------------------- |
| Calculation Errors | Critical | Low         | มีการทดสอบและตรวจสอบการคำนวณอย่างละเอียด |
| Payment Failures   | High     | Medium      | มีระบบจัดการความล้มเหลวของการชำระเงิน    |
| Credit Fraud       | Critical | Low         | มีระบบตรวจสอบและป้องกันการฉ้อโกง         |
| System Downtime    | High     | Low         | มีระบบสำรองและ Recovery Plan             |

## 10. Timeline และ Milestones

| Milestone               | Target Date | Status      |
| ----------------------- | ----------- | ----------- |
| Credit Balance System   | 2025-10-16  | Not Started |
| Transaction Logging     | 2025-10-18  | Not Started |
| Cost Calculation Engine | 2025-10-20  | Not Started |
| Payment Integration     | 2025-10-22  | Not Started |
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
