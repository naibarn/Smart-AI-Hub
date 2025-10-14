---
title: 'User Role Assignment and Management System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P0'
related_specs: ['FR-AUTH-05', 'FR-AUTH-06', 'user.md', 'role.md', 'permission.md']
---

# User Role Assignment and Management System

## 1. ภาพรวม (Overview)

ระบบการจัดการบทบาทผู้ใช้ (User Role Management System) เป็นส่วนสำคัญของแพลตฟอร์ม Smart AI Hub ที่ใช้สำหรับเชื่อมโยงผู้ใช้กับบทบาทต่างๆ ภายในระบบ ระบบนี้เป็นส่วนหนึ่งของโมเดล Role-Based Access Control (RBAC) ที่ช่วยให้การจัดการสิทธิ์การเข้าถึงของผู้ใช้ในระบบมีความยืดหยุ่นและปลอดภัย

ระบบนี้ทำงานโดยเชื่อมโยงผู้ใช้ (Users) กับบทบาท (Roles) ทำให้ผู้ใช้สามารถมีได้หลายบทบาทพร้อมกัน และสืบทอดสิทธิ์จากบทบาททั้งหมดที่ได้รับมอบหมาย การจัดการบทบาทผู้ใช้เป็นส่วนสำคัญในการควบคุมการเข้าถึงทรัพยากรต่างๆ ภายในระบบ

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้สามารถกำหนดบทบาทให้กับผู้ใช้ได้อย่างยืดหยุ่น
- รองรับการมอบหมายหลายบทบาทให้กับผู้ใช้คนเดียว
- ป้องกันการมอบหมายบทบาทโดยไม่ได้รับอนุญาต
- อำนวยความสะดวกในการตรวจสอบบทบาทของผู้ใช้
- รองรับการติดตามประวัติการมอบหมายบทบาท
- ทำงานร่วมกับระบบสิทธิ์ (Permission System) อย่างมีประสิทธิภาพ
- ลดความซับซ้อนในการจัดการสิทธิ์ผ่านบทบาท

## 3. User Stories

### Story 1: ผู้ดูแลระบบมอบหมายบทบาทให้ผู้ใช้

**ในฐานะ** ผู้ดูแลระบบ  
**ฉันต้องการ** มอบหมายบทบาทต่างๆ ให้กับผู้ใช้ในระบบ  
**เพื่อที่จะ** ควบคุมสิทธิ์การเข้าถึงทรัพยากรของผู้ใช้แต่ละคน

**Acceptance Criteria:**

- [ ] หน้าจอการจัดการผู้ใช้ต้องมีส่วนสำหรับจัดการบทบาท
- [ ] ต้องสามารถมอบหมายบทบาทให้กับผู้ใช้ได้
- [ ] ต้องสามารถถอดบทบาทจากผู้ใช้ได้
- [ ] ต้องสามารถมอบหมายหลายบทบาทให้ผู้ใช้คนเดียวได้
- [ ] ต้องมีการแสดงรายการบทบาททั้งหมดที่ผู้ใช้มี
- [ ] ต้องมีการค้นหาและกรองผู้ใช้ตามบทบาท
- [ ] ต้องมีการบันทึกการเปลี่ยนแปลงบทบาทในระบบ Audit Log

### Story 2: ระบบตรวจสอบบทบาทของผู้ใช้

**ในฐานะ** ระบบแอปพลิเคชัน  
**ฉันต้องการ** ตรวจสอบบทบาทของผู้ใช้ก่อนทำการกระทำใดๆ  
**เพื่อที่จะ** ตรวจสอบสิทธิ์การเข้าถึงทรัพยากรของผู้ใช้

**Acceptance Criteria:**

- [ ] ต้องสามารถดึงรายการบทบาททั้งหมดของผู้ใช้ได้
- [ ] ต้องสามารถตรวจสอบว่าผู้ใช้มีบทบาทที่ต้องการได้
- [ ] ต้องรองรับการตรวจสอบหลายบทบาทพร้อมกัน
- [ ] ต้องมีการ Cache ข้อมูลบทบาทเพื่อเพิ่มประสิทธิภาพ
- [ ] ต้องมีการบันทึกการตรวจสอบบทบาท
- [ ] ต้องส่งคืนข้อมูลบทบาทพร้อมสิทธิ์ที่เกี่ยวข้อง
- [ ] ต้องรองรับการตรวจสอบบทบาทแบบมีเงื่อนไข

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การมอบหมายบทบาทให้ผู้ใช้ (User Role Assignment)
- การถอดบทบาทจากผู้ใช้ (User Role Removal)
- การดึงรายการบทบาทของผู้ใช้ (User Role Retrieval)
- การตรวจสอบบทบาทของผู้ใช้ (User Role Verification)
- การจัดการความสัมพันธ์ระหว่างผู้ใช้และบทบาท (User-Role Mapping)
- การบันทึกประวัติการมอบหมายบทบาท (Role Assignment History)
- การ Cache ข้อมูลบทบาทของผู้ใช้

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การจัดการบทบาทแบบไดนามิกขณะทำงาน (Dynamic Role Assignment)
- การมอบหมายบทบาชั่วคราว (Temporary Role Assignment)
- การจัดการบทบาทตามเวลา (Time-based Role Assignment)
- การจัดการบทบาทแบบมีเงื่อนไข (Conditional Role Assignment)
- การจัดการบทบาทผ่านการลงนามดิจิทัล (Digital Signatures)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint                              | Description                               | Request Body          | Response                             |
| ------ | ------------------------------------- | ----------------------------------------- | --------------------- | ------------------------------------ |
| POST   | `/api/users/:userId/roles`            | มอบหมายบทบาทให้ผู้ใช้                     | `{ roleId }`          | `{ userRole }`                       |
| DELETE | `/api/users/:userId/roles/:roleId`    | ถอดบทบาทจากผู้ใช้                         | -                     | `{ success: true }`                  |
| GET    | `/api/users/:userId/roles`            | ดึงรายการบทบาทของผู้ใช้                   | -                     | `{ roles }`                          |
| GET    | `/api/roles/:roleId/users`            | ดึงรายการผู้ใช้ที่มีบทบาทนี้              | -                     | `{ users }`                          |
| GET    | `/api/users/:userId/has-role/:roleId` | ตรวจสอบว่าผู้ใช้มีบทบาทนี้หรือไม่         | -                     | `{ hasRole: boolean }`               |
| GET    | `/api/users/:userId/all-roles`        | ดึงรายการบทบาททั้งหมดของผู้ใช้พร้อมสิทธิ์ | -                     | `{ roles: [{ role, permissions }] }` |
| POST   | `/api/users/batch-role-assignment`    | มอบหมายบทบาทให้ผู้ใช้หลายคนพร้อมกัน       | `{ userIds, roleId }` | `{ results }`                        |

### 5.2 Database Schema

```prisma
model UserRole {
  userId      String   @default(uuid())
  roleId      String   @default(uuid())
  assignedAt  DateTime @default(now())
  assignedBy  String?  // ผู้ที่มอบหมายบทบาท

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  assignedByUser User? @relation("RoleAssignment", fields: [assignedBy], references: [id])

  @@id([userId, roleId])
  @@map("user_roles")
}
```

### 5.3 Security Requirements

- ต้องมีการตรวจสอบสิทธิ์ก่อนมอบหมายบทบาทให้ผู้ใช้
- ต้องมีการตรวจสอบว่าผู้ทำการมอบหมายมีสิทธิ์เพียงพอ
- ต้องมีการบันทึกการเปลี่ยนแปลงบทบาทในระบบ Audit Log
- ต้องป้องกันการมอบหมายบทบาทที่สำคัญโดยไม่ได้รับอนุญาต
- ต้องมีการ Cache ข้อมูลบทบาทเพื่อประสิทธิภาพ (Response Time ไม่เกิน 50ms)
- ต้องมีการตรวจสอบข้อมูลก่อนมอบหมายบทบาท

### 5.4 Frontend Requirements

- มีหน้าจอสำหรับจัดการบทบาทของผู้ใช้
- มีคอมโพเนนต์สำหรับเลือกและมอบหมายบทบาท
- มีการแสดงรายการบทบาทปัจจุบันของผู้ใช้
- มีการตรวจสอบสิทธิ์ก่อนแสดง UI สำหรับจัดการบทบาท
- มีการแจ้งเตือนเมื่อมอบหมายหรือถอดบทบาทสำเร็จ

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการมอบหมายบทบาทให้ผู้ใช้
- [ ] ทดสอบการถอดบทบาทจากผู้ใช้
- [ ] ทดสอบการดึงรายการบทบาทของผู้ใช้
- [ ] ทดสอบการตรวจสอบบทบาทของผู้ใช้
- [ ] ทดสอบกลไกการ Cache ข้อมูลบทบาท

### 6.2 Integration Tests

- [ ] ทดสอบ API Endpoints ทั้งหมด
- [ ] ทดสอบการทำงานร่วมกับระบบสิทธิ์ (Permission System)
- [ ] ทดสอบการจัดการความสัมพันธ์ระหว่างผู้ใช้และบทบาท
- [ ] ทดสอบการตรวจสอบสิทธิ์ก่อนมอบหมายบทบาท
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 E2E Tests

- [ ] ทดสอบการมอบหมายบทบาทผ่าน Admin UI
- [ ] ทดสอบการตรวจสอบบทบาทในหน้า UI ต่างๆ
- [ ] ทดสอบการแสดงผล UI ตามบทบาทของผู้ใช้

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ระบบต้องการ PostgreSQL Database สำหรับจัดเก็บข้อมูลผู้ใช้และบทบาท
- ต้องมีระบบ User Management ที่ทำงานได้เต็มรูปแบบ
- ต้องมีระบบ Role Management ที่เชื่อมโยงกับระบบผู้ใช้
- ต้องมี Redis สำหรับจัดเก็บข้อมูลบทบาทที่ใช้บ่อย (Cache)

### 7.2 Assumptions

- ผู้ใช้ต้องล็อกอินเข้าสู่ระบบก่อนทำการกระทำใดๆ
- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- มีการจัดการ Session และ Token อย่างปลอดภัย
- ข้อมูลบทบาทจะถูกโหลดเมื่อผู้ใช้ล็อกอินและ Cache ไว้

## 8. Non-Functional Requirements

### 8.1 Performance

- การตรวจสอบบทบาทต้องทำงานได้ภายใน **50ms** (P95)
- การโหลดข้อมูลบทบาทต้องเสร็จภายใน **100ms**
- รองรับการตรวจสอบบทบาทได้อย่างน้อย **1,000 ครั้งต่อวินาที**

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.5%**
- ต้องมีการ Backup ข้อมูลการมอบหมายบทบาททุกวัน

### 8.3 Security

- ต้องมีการเข้ารหัสข้อมูลที่สำคัญ
- ต้องมีการตรวจสอบและป้องกันการโจมตีแบบ Privilege Escalation
- ต้องมีการบันทึกการเปลี่ยนแปลงบทบาททั้งหมด

## 9. Risks และ Mitigation

| Risk                         | Impact   | Probability | Mitigation Strategy                                             |
| ---------------------------- | -------- | ----------- | --------------------------------------------------------------- |
| Role Assignment Cache Stale  | High     | Medium      | ใช้ TTL สำหรับ Cache และมีกลไก Invalidate เมื่อมีการเปลี่ยนแปลง |
| Unauthorized Role Assignment | Critical | Low         | ตรวจสอบสิทธิ์ผู้ทำการมอบหมายทุกครั้งและมี Audit Log             |
| Complex Role Hierarchy       | Medium   | High        | ใช้ Unit Tests ครอบคลุมและมีเอกสารอธิบายการทำงานอย่างละเอียด    |
| Performance Issues           | High     | Low         | ใช้ Redis Cache และ Database Indexing อย่างเหมาะสม              |

## 10. Timeline และ Milestones

| Milestone               | Target Date | Status      |
| ----------------------- | ----------- | ----------- |
| Database Schema Design  | 2025-10-16  | Not Started |
| Backend API Development | 2025-10-18  | Not Started |
| Role Assignment Logic   | 2025-10-20  | Not Started |
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
