---
title: 'Promo Code Redemption System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P1'
related_specs: ['FR-CREDIT-03', 'FR-CREDIT-04', 'promo_code.md', 'credit_account.md']
---

# Promo Code Redemption System

## 1. ภาพรวม (Overview)

ระบบการใช้โปรโมชั่นโค้ด (Promo Code Redemption System) เป็นส่วนสำคัญของแพลตฟอร์ม Smart AI Hub ที่ใช้สำหรับจัดการการใช้โปรโมชั่นโค้ดของผู้ใช้ ระบบนี้ทำงานร่วมกับระบบจัดการโปรโมชั่นโค้ดและระบบบัญชีเครดิตเพื่อให้ผู้ใช้สามารถใช้โปรโมชั่นโค้ดเพื่อรับเครดิตเพิ่มได้

ระบบนี้ทำงานโดยบันทึกการใช้โปรโมชั่นโค้ดของผู้ใช้แต่ละคน ตรวจสอบความถูกต้องของโค้ด และเพิ่มเครดิตเข้าบัญชีผู้ใช้เมื่อการใช้โค้ดสำเร็จ การจัดการการใช้โปรโมชั่นโค้ดเป็นส่วนสำคัญในการควบคุมสิทธิประโยชน์ที่ผู้ใช้ได้รับและป้องกันการใช้โค้ดซ้ำซ้อน

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้สามารถจัดการการใช้โปรโมชั่นโค้ดได้อย่างปลอดภัย
- รองรับการตรวจสอบความถูกต้องของโค้ดก่อนการใช้
- ป้องกันการใช้โปรโมชั่นโค้ดซ้ำซ้อน
- อำนวยความสะดวกในการติดตามประวัติการใช้โปรโมชั่น
- รองรับการบันทึกข้อมูลการใช้โปรโมชั่นที่สมบูรณ์
- ทำงานร่วมกับระบบบัญชีเครดิตอย่างมีประสิทธิภาพ
- ลดความซับซ้อนในการจัดการสิทธิประโยชน์ของผู้ใช้

## 3. User Stories

### Story 1: ผู้ใช้ใช้โปรโมชั่นโค้ดเพื่อรับเครดิต

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** ใช้โปรโมชั่นโค้ดเพื่อรับเครดิตเพิ่มในบัญชีของฉัน  
**เพื่อที่จะ** ใช้บริการต่างๆ ภายในแพลตฟอร์มได้มากขึ้น

**Acceptance Criteria:**

- [ ] หน้าจอเติมเงินต้องมีช่องใส่โปรโมชั่นโค้ด
- [ ] ต้องมีการตรวจสอบความถูกต้องของโค้ดทันที
- [ ] ต้องแสดงมูลค่าเครดิตที่จะได้รับ
- [ ] ต้องมีการตรวจสอบว่าผู้ใช้เคยใช้โค้ดนี้แล้วหรือไม่
- [ ] ต้องมีการแจ้งเตือนเมื่อใช้โค้ดสำเร็จ
- [ ] ต้องมีการอัปเดตยอดเงินคงเหลือในบัญชีทันที
- [ ] ต้องมีการบันทึกการใช้โค้ดในประวัติการทำรายการ

### Story 2: ผู้ดูแลระบบตรวจสอบประวัติการใช้โปรโมชั่น

**ในฐานะ** ผู้ดูแลระบบ  
**ฉันต้องการ** ตรวจสอบประวัติการใช้โปรโมชั่นโค้ดของผู้ใช้  
**เพื่อที่จะ** ติดตามการใช้งานโปรโมชั่นและวิเคราะห์ประสิทธิภาพ

**Acceptance Criteria:**

- [ ] หน้าจอรายงานต้องมีส่วนสำหรับดูประวัติการใช้โปรโมชั่น
- [ ] ต้องสามารถกรองข้อมูลตามช่วงเวลาได้
- [ ] ต้องสามารถกรองข้อมูลตามโปรโมชั่นโค้ดได้
- [ ] ต้องสามารถกรองข้อมูลตามผู้ใช้ได้
- [ ] ต้องแสดงสถิติการใช้โปรโมชั่นแบบสรุป
- [ ] ต้องสามารถส่งออกข้อมูลเป็นไฟล์ได้
- [ ] ต้องมีการแสดงข้อมูลการใช้โปรโมชั่นที่ละเอียด

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การใช้โปรโมชั่นโค้ด (Promo Code Usage)
- การตรวจสอบความถูกต้องของโค้ด (Code Validation)
- การป้องกันการใช้โค้ดซ้ำ (Duplicate Prevention)
- การบันทึกประวัติการใช้โค้ด (Usage History)
- การเชื่อมโยงกับระบบบัญชีเครดิต (Credit Account Integration)
- การติดตามสถิติการใช้โปรโมชั่น (Usage Analytics)
- การจัดการข้อมูลการใช้โปรโมชั่น (Redemption Data Management)

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การสร้างโปรโมชั่นโค้ด (Promo Code Creation)
- การจัดการเงื่อนไขโปรโมชั่น (Promo Condition Management)
- การจัดการโปรโมชั่นแบบกลุ่ม (Group-based Promotions)
- การจัดการโปรโมชั่นแบบแบ่งปัน (Referral Promotions)
- การคืนค่าโปรโมชั่น (Promo Refunds)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint                              | Description                        | Request Body                                 | Response                         |
| ------ | ------------------------------------- | ---------------------------------- | -------------------------------------------- | -------------------------------- |
| POST   | `/api/promo-redemptions`              | ใช้โปรโมชั่นโค้ด                   | `{ code, userId }`                           | `{ redemption, updatedBalance }` |
| GET    | `/api/promo-redemptions/:id`          | ดึงข้อมูลการใช้โปรโมชั่นตาม ID     | -                                            | `{ redemption }`                 |
| GET    | `/api/promo-redemptions/user/:userId` | ดึงประวัติการใช้โปรโมชั่นของผู้ใช้ | Query: `{ page, limit, startDate, endDate }` | `{ redemptions, total }`         |
| GET    | `/api/promo-redemptions/code/:codeId` | ดึงประวัติการใช้โปรโมชั่นตามโค้ด   | Query: `{ page, limit }`                     | `{ redemptions, total }`         |
| GET    | `/api/promo-redemptions/stats`        | ดึงสถิติการใช้โปรโมชั่น            | Query: `{ startDate, endDate, codeId }`      | `{ statistics }`                 |
| GET    | `/api/promo-redemptions/export`       | ส่งออกข้อมูลการใช้โปรโมชั่น        | Query: `{ format, filters }`                 | `{ downloadUrl }`                |
| POST   | `/api/promo-redemptions/validate`     | ตรวจสอบความถูกต้องของโค้ดก่อนใช้   | `{ code, userId }`                           | `{ valid, promoCode, message }`  |

### 5.2 Database Schema

```prisma
model PromoRedemption {
  id         String   @id @default(uuid())
  userId     String
  codeId     String
  credits    Int      // จำนวนเครดิตที่ได้รับ
  redeemedAt DateTime @default(now())
  ipAddress  String?  // IP Address ที่ใช้
  userAgent  String?  // User Agent ที่ใช้

  user  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  code  PromoCode  @relation(fields: [codeId], references: [id], onDelete: Cascade)

  @@unique([userId, codeId]) // ป้องกันการใช้โค้ดซ้ำ
  @@index([userId])
  @@index([codeId])
  @@index([redeemedAt])
  @@map("promo_redemptions")
}
```

### 5.3 Security Requirements

- ต้องมีการตรวจสอบสิทธิ์ก่อนใช้โปรโมชั่น
- ต้องมีการตรวจสอบความถูกต้องของโค้ดก่อนการใช้
- ต้องมีการบันทึกการใช้โปรโมชั่นทั้งหมดในระบบ Audit Log
- ต้องป้องกันการใช้โปรโมชั่นโดยไม่ได้รับอนุญาต
- ต้องมีการจำกัดจำนวนครั้งในการพยายามใช้โค้ด
- ต้องมีการบันทึก IP Address และ User Agent สำหรับการตรวจสอบ

### 5.4 Frontend Requirements

- มีช่องใส่โปรโมชั่นโค้ดในหน้าเติมเงิน
- มีการแสดงผลการตรวจสอบโค้ดแบบ Real-time
- มีการแสดงประวัติการใช้โปรโมชั่น
- มีหน้าจอรายงานสถิติการใช้โปรโมชั่นสำหรับ Admin
- มีการตรวจสอบสิทธิ์ก่อนแสดงข้อมูล
- มีการแจ้งเตือนเมื่อใช้โปรโมชั่นสำเร็จ

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการใช้โปรโมชั่นโค้ด
- [ ] ทดสอบการตรวจสอบความถูกต้องของโค้ด
- [ ] ทดสอบการป้องกันการใช้โค้ดซ้ำ
- [ ] ทดสอบการเพิ่มเครดิตเข้าบัญชี
- [ ] ทดสอบการดึงประวัติการใช้โปรโมชั่น

### 6.2 Integration Tests

- [ ] ทดสอบ API Endpoints ทั้งหมด
- [ ] ทดสอบการทำงานร่วมกับระบบโปรโมชั่นโค้ด
- [ ] ทดสอบการทำงานร่วมกับระบบบัญชีเครดิต
- [ ] ทดสอบการทำงานร่วมกับระบบผู้ใช้
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 E2E Tests

- [ ] ทดสอบการใช้โปรโมชั่นผ่าน UI
- [ ] ทดสอบการตรวจสอบโค้ดที่ใช้ไปแล้ว
- [ ] ทดสอบการใช้โค้ดที่หมดอายุ
- [ ] ทดสอบการดูประวัติการใช้โปรโมชั่น
- [ ] ทดสอบการดูรายงานสถิติสำหรับ Admin

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ระบบต้องการ PostgreSQL Database สำหรับจัดเก็บข้อมูลการใช้โปรโมชั่น
- ต้องมีระบบ User Management ที่ทำงานได้เต็มรูปแบบ
- ต้องมีระบบ Promo Code Management
- ต้องมีระบบ Credit Account Management
- ต้องมีระบบติดตามการทำรายการ

### 7.2 Assumptions

- ผู้ใช้ต้องล็อกอินเข้าสู่ระบบก่อนใช้โปรโมชั่น
- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- มีการจัดการ Session และ Token อย่างปลอดภัย
- การใช้โปรโมชั่นจะถูกบันทึกทั้งหมด

## 8. Non-Functional Requirements

### 8.1 Performance

- การตรวจสอบและใช้โปรโมชั่นต้องทำงานได้ภายใน **200ms** (P95)
- การดึงประวัติการใช้โปรโมชั่นต้องเสร็จภายใน **300ms**
- รองรับการใช้โปรโมชั่นได้อย่างน้อย **50 ครั้งต่อวินาที**

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.5%**
- ต้องมีการ Backup ข้อมูลการใช้โปรโมชั่นทุกวัน

### 8.3 Security

- ต้องมีการเข้ารหัสข้อมูลที่สำคัญ
- ต้องมีการตรวจสอบและป้องกันการใช้โปรโมชั่นผิดกฎหมาย
- ต้องมีการบันทึกการใช้โปรโมชั่นทั้งหมด

## 9. Risks และ Mitigation

| Risk                    | Impact   | Probability | Mitigation Strategy                                |
| ----------------------- | -------- | ----------- | -------------------------------------------------- |
| Duplicate Promo Usage   | High     | Medium      | ใช้ Database Unique Constraint และตรวจสอบก่อนใช้   |
| Invalid Code Redemption | Medium   | High        | ตรวจสอบความถูกต้องของโค้ดทุกครั้งก่อนอนุมัติ       |
| Performance Issues      | Medium   | Low         | ใช้ Database Indexing และ Cache ข้อมูลที่ใช้บ่อย   |
| Credit Update Failure   | Critical | Low         | ใช้ Database Transaction และมีกลไก Retry อัตโนมัติ |

## 10. Timeline และ Milestones

| Milestone               | Target Date | Status      |
| ----------------------- | ----------- | ----------- |
| Database Schema Design  | 2025-10-16  | Not Started |
| Backend API Development | 2025-10-18  | Not Started |
| Redemption Logic        | 2025-10-20  | Not Started |
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
