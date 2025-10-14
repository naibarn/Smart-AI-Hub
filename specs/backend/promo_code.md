---
title: 'Promo Code Management System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P1'
related_specs: ['FR-CREDIT-03', 'FR-CREDIT-04', 'credit_account.md', 'promo_redemption.md']
---

# Promo Code Management System

## 1. ภาพรวม (Overview)

ระบบจัดการโปรโมชั่นโค้ด (Promo Code Management System) เป็นส่วนสำคัญของแพลตฟอร์ม Smart AI Hub ที่ใช้สำหรับสร้าง จัดการ และติดตามโปรโมชั่นโค้ดต่างๆ ที่ให้สิทธิประโยชน์แก่ผู้ใช้ ระบบนี้ทำงานร่วมกับระบบบัญชีเครดิตและระบบการใช้งานบริการต่างๆ ภายในแพลตฟอร์ม

ระบบนี้ทำงานโดยสร้างโปรโมชั่นโค้ดที่มีเงื่อนไขต่างๆ เช่น มูลค่าเครดิต จำนวนครั้งที่ใช้ได้ วันหมดอายุ และเงื่อนไขอื่นๆ ผู้ใช้สามารถใช้โปรโมชั่นโค้ดเหล่านี้เพื่อรับเครดิตเพิ่มหรือส่วนลดในการใช้บริการต่างๆ ภายใน Smart AI Hub

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้สามารถสร้างและจัดการโปรโมชั่นโค้ดได้อย่างง่ายดาย
- รองรับเงื่อนไขที่หลากหลายสำหรับโปรโมชั่น
- ป้องกันการใช้โปรโมชั่นโค้ดโดยไม่ได้รับอนุญาต
- อำนวยความสะดวกในการติดตามการใช้งานโปรโมชั่น
- รองรับการสร้างโปรโมชั่นสำหรับกลุ่มผู้ใช้เฉพาะ
- ทำงานร่วมกับระบบบัญชีเครดิตอย่างมีประสิทธิภาพ
- ลดความซับซ้อนในการจัดการโปรโมชั่น

## 3. User Stories

### Story 1: ผู้ดูแลระบบสร้างโปรโมชั่นโค้ด

**ในฐานะ** ผู้ดูแลระบบ  
**ฉันต้องการ** สร้างโปรโมชั่นโค้ดสำหรับแจกเครดิตให้ผู้ใช้  
**เพื่อที่จะ** ส่งเสริมการใช้งานบริการต่างๆ ภายในแพลตฟอร์ม

**Acceptance Criteria:**

- [ ] หน้าจอสร้างโปรโมชั่นต้องมีช่องกรอกโค้ด
- [ ] ต้องมีช่องกำหนดมูลค่าเครดิต
- [ ] ต้องมีตัวเลือกกำหนดจำนวนครั้งที่ใช้ได้
- [ ] ต้องมีตัวเลือกกำหนดวันหมดอายุ
- [ ] ต้องมีช่องกรอกรายละเอียดเพิ่มเติม
- [ ] ต้องมีการแสดงตัวอย่างโปรโมชั่นก่อนบันทึก
- [ ] ต้องมีการบันทึกการสร้างโปรโมชั่นในระบบ

### Story 2: ผู้ใช้ใช้โปรโมชั่นโค้ด

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** ใช้โปรโมชั่นโค้ดเพื่อรับเครดิตเพิ่ม  
**เพื่อที่จะ** ใช้บริการต่างๆ ภายในแพลตฟอร์มได้มากขึ้น

**Acceptance Criteria:**

- [ ] หน้าจอเติมเงินต้องมีช่องใส่โปรโมชั่นโค้ด
- [ ] ต้องมีการตรวจสอบความถูกต้องของโค้ด
- [ ] ต้องแสดงมูลค่าเครดิตที่จะได้รับ
- [ ] ต้องมีการตรวจสอบวันหมดอายุของโค้ด
- [ ] ต้องมีการตรวจสอบจำนวนครั้งที่ใช้ได้
- [ ] ต้องมีการแจ้งเตือนเมื่อใช้โค้ดสำเร็จ
- [ ] ต้องมีการบันทึกการใช้โค้ดในระบบ

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การสร้างโปรโมชั่นโค้ด (Promo Code Creation)
- การจัดการโปรโมชั่นโค้ด (Promo Code Management)
- การตรวจสอบความถูกต้องของโค้ด (Promo Code Validation)
- การใช้โปรโมชั่นโค้ด (Promo Code Redemption)
- การติดตามการใช้งานโปรโมชั่น (Usage Tracking)
- การจัดการเงื่อนไขโปรโมชั่น (Promo Conditions)
- การบันทึกประวัติการใช้โปรโมชั่น (Redemption History)

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การสร้างโปรโมชั่นแบบไดนามิกขณะทำงาน (Dynamic Promo Generation)
- การจัดการโปรโมชั่นแบบมีเงื่อนไขซับซ้อน (Complex Conditional Promos)
- การจัดการโปรโมชั่นแบบกลุ่ม (Group-based Promotions)
- การจัดการโปรโมชั่นแบบแบ่งปัน (Referral Promotions)
- การจัดการโปรโมชั่นแบบลำดับชั้น (Tiered Promotions)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint                           | Description                   | Request Body                                         | Response                         |
| ------ | ---------------------------------- | ----------------------------- | ---------------------------------------------------- | -------------------------------- |
| POST   | `/api/promo-codes`                 | สร้างโปรโมชั่นโค้ดใหม่        | `{ code, credits, maxUses, expiresAt, description }` | `{ promoCode }`                  |
| GET    | `/api/promo-codes`                 | ดึงรายการโปรโมชั่นโค้ดทั้งหมด | Query: `{ page, limit, active }`                     | `{ promoCodes, total }`          |
| GET    | `/api/promo-codes/:id`             | ดึงข้อมูลโปรโมชั่นโค้ดตาม ID  | -                                                    | `{ promoCode }`                  |
| PUT    | `/api/promo-codes/:id`             | อัปเดตข้อมูลโปรโมชั่นโค้ด     | `{ credits, maxUses, expiresAt, active }`            | `{ promoCode }`                  |
| DELETE | `/api/promo-codes/:id`             | ลบโปรโมชั่นโค้ด               | -                                                    | `{ success: true }`              |
| POST   | `/api/promo-codes/validate`        | ตรวจสอบความถูกต้องของโค้ด     | `{ code, userId }`                                   | `{ valid, promoCode, message }`  |
| POST   | `/api/promo-codes/redeem`          | ใช้โปรโมชั่นโค้ด              | `{ code, userId }`                                   | `{ redemption, updatedBalance }` |
| GET    | `/api/promo-codes/:id/redemptions` | ดึงประวัติการใช้โค้ด          | Query: `{ page, limit }`                             | `{ redemptions, total }`         |

### 5.2 Database Schema

```prisma
model PromoCode {
  id          String   @id @default(uuid())
  code        String   @unique
  credits     Int      // จำนวนเครดิตที่ได้รับ
  maxUses     Int?     // จำนวนครั้งที่ใช้ได้ (null = ไม่จำกัด)
  usedCount   Int      @default(0) // จำนวนครั้งที่ถูกใช้ไปแล้ว
  expiresAt   DateTime? // วันหมดอายุ (null = ไม่หมดอายุ)
  active      Boolean  @default(true)
  description String?  // รายละเอียดโปรโมชั่น
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  redemptions PromoRedemption[]

  @@index([code])
  @@index([active])
  @@index([expiresAt])
  @@map("promo_codes")
}
```

### 5.3 Security Requirements

- ต้องมีการตรวจสอบสิทธิ์ก่อนสร้างหรือแก้ไขโปรโมชั่น
- ต้องมีการตรวจสอบสิทธิ์ก่อนใช้โปรโมชั่น
- ต้องมีการบันทึกการใช้โปรโมชั่นทั้งหมดในระบบ Audit Log
- ต้องป้องกันการใช้โปรโมชั่นโดยไม่ได้รับอนุญาต
- ต้องมีการตรวจสอบข้อมูลก่อนสร้างโปรโมชั่น
- ต้องมีการจำกัดจำนวนครั้งในการใช้โปรโมชั่น

### 5.4 Frontend Requirements

- มีหน้าจอสำหรับจัดการโปรโมชั่นโค้ด
- มีหน้าจอสำหรับสร้างโปรโมชั่นโค้ด
- มีช่องใส่โปรโมชั่นโค้ดในหน้าเติมเงิน
- มีการแสดงข้อมูลโปรโมชั่นที่ใช้ได้
- มีการตรวจสอบสิทธิ์ก่อนแสดงหน้าจอจัดการโปรโมชั่น
- มีการแจ้งเตือนเมื่อใช้โปรโมชั่นสำเร็จ

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการสร้างโปรโมชั่นโค้ด
- [ ] ทดสอบการตรวจสอบความถูกต้องของโค้ด
- [ ] ทดสอบการใช้โปรโมชั่นโค้ด
- [ ] ทดสอบการตรวจสอบวันหมดอายุ
- [ ] ทดสอบการตรวจสอบจำนวนครั้งที่ใช้ได้

### 6.2 Integration Tests

- [ ] ทดสอบ API Endpoints ทั้งหมด
- [ ] ทดสอบการทำงานร่วมกับระบบบัญชีเครดิต
- [ ] ทดสอบการทำงานร่วมกับระบบผู้ใช้
- [ ] ทดสอบการทำงานร่วมกับระบบการใช้โปรโมชั่น
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 E2E Tests

- [ ] ทดสอบการสร้างโปรโมชั่นผ่าน Admin UI
- [ ] ทดสอบการใช้โปรโมชั่นผ่าน UI
- [ ] ทดสอบการตรวจสอบโปรโมชั่นที่หมดอายุ
- [ ] ทดสอบการตรวจสอบโปรโมชั่นที่ใช้ครบแล้ว
- [ ] ทดสอบการแสดงรายการโปรโมชั่น

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ระบบต้องการ PostgreSQL Database สำหรับจัดเก็บข้อมูลโปรโมชั่น
- ต้องมีระบบ User Management ที่ทำงานได้เต็มรูปแบบ
- ต้องมีระบบ Credit Account Management
- ต้องมีระบบ Promo Redemption Management
- ต้องมีระบบติดตามการทำรายการ

### 7.2 Assumptions

- ผู้ใช้ต้องล็อกอินเข้าสู่ระบบก่อนใช้โปรโมชั่น
- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- มีการจัดการ Session และ Token อย่างปลอดภัย
- การใช้โปรโมชั่นจะถูกบันทึกทั้งหมด

## 8. Non-Functional Requirements

### 8.1 Performance

- การตรวจสอบโปรโมชั่นต้องทำงานได้ภายใน **100ms** (P95)
- การใช้โปรโมชั่นต้องเสร็จภายใน **200ms**
- รองรับการใช้โปรโมชั่นได้อย่างน้อย **50 ครั้งต่อวินาที**

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.5%**
- ต้องมีการ Backup ข้อมูลโปรโมชั่นทุกวัน

### 8.3 Security

- ต้องมีการเข้ารหัสข้อมูลที่สำคัญ
- ต้องมีการตรวจสอบและป้องกันการใช้โปรโมชั่นผิดกฎหมาย
- ต้องมีการบันทึกการใช้โปรโมชั่นทั้งหมด

## 9. Risks และ Mitigation

| Risk                  | Impact | Probability | Mitigation Strategy                                       |
| --------------------- | ------ | ----------- | --------------------------------------------------------- |
| Promo Code Abuse      | High   | Medium      | จำกัดจำนวนครั้งต่อผู้ใช้และมีระบบตรวจสอบพฤติกรรม          |
| Duplicate Promo Codes | Medium | Low         | ใช้ Database Unique Constraint และตรวจสอบก่อนสร้าง        |
| Performance Issues    | Medium | Low         | ใช้ Database Indexing และ Cache ข้อมูลโปรโมชั่นที่ใช้บ่อย |
| Invalid Redemptions   | High   | Medium      | ตรวจสอบเงื่อนไขทุกครั้งก่อนอนุมัติการใช้โปรโมชั่น         |

## 10. Timeline และ Milestones

| Milestone               | Target Date | Status      |
| ----------------------- | ----------- | ----------- |
| Database Schema Design  | 2025-10-16  | Not Started |
| Backend API Development | 2025-10-18  | Not Started |
| Promo Validation Logic  | 2025-10-20  | Not Started |
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
