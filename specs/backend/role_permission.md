---
title: 'Role Permission Mapping and Management System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P0'
related_specs: ['FR-AUTH-05', 'FR-AUTH-06', 'role.md', 'permission.md', 'user_role.md']
---

# Role Permission Mapping and Management System

## 1. ภาพรวม (Overview)

ระบบการจัดการการเชื่อมโยงบทบาทและสิทธิ์ (Role Permission Mapping System) เป็นส่วนสำคัญของแพลตฟอร์ม Smart AI Hub ที่ใช้สำหรับเชื่อมโยงบทบาท (Roles) กับสิทธิ์ (Permissions) ต่างๆ ภายในระบบ ระบบนี้เป็นส่วนกลางของโมเดล Role-Based Access Control (RBAC) ที่ช่วยให้การจัดการสิทธิ์การเข้าถึงมีความยืดหยุ่นและปลอดภัย

ระบบนี้ทำงานโดยเชื่อมโยงบทบาทกับสิทธิ์ต่างๆ ทำให้บทบาทแต่ละบทบาทสามารถมีได้หลายสิทธิ์ และสิทธิ์แต่ละอย่างสามารถถูกกำหนดให้กับหลายบทบาทได้ การจัดการความสัมพันธ์ระหว่างบทบาทและสิทธิ์เป็นส่วนสำคัญในการควบคุมการเข้าถึงทรัพยากรต่างๆ ภายในระบบ

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้สามารถกำหนดสิทธิ์ให้กับบทบาทได้อย่างยืดหยุ่น
- รองรับการกำหนดหลายสิทธิ์ให้กับบทบาทเดียว
- รองรับการกำหนดสิทธิ์เดียวให้กับหลายบทบาท
- ป้องกันการกำหนดสิทธิ์โดยไม่ได้รับอนุญาต
- อำนวยความสะดวกในการตรวจสอบสิทธิ์ของบทบาท
- รองรับการติดตามประวัติการกำหนดสิทธิ์
- ทำงานร่วมกับระบบผู้ใช้และบทบาทอย่างมีประสิทธิภาพ

## 3. User Stories

### Story 1: ผู้ดูแลระบบกำหนดสิทธิ์ให้บทบาท

**ในฐานะ** ผู้ดูแลระบบ  
**ฉันต้องการ** กำหนดสิทธิ์ต่างๆ ให้กับบทบาทในระบบ  
**เพื่อที่จะ** ควบคุมสิทธิ์การเข้าถึงทรัพยากรของผู้ใช้ที่มีบทบาทต่างๆ

**Acceptance Criteria:**

- [ ] หน้าจอการจัดการบทบาทต้องมีส่วนสำหรับจัดการสิทธิ์
- [ ] ต้องสามารถเพิ่มสิทธิ์ให้กับบทบาทได้
- [ ] ต้องสามารถลบสิทธิ์จากบทบาทได้
- [ ] ต้องสามารถกำหนดหลายสิทธิ์ให้บทบาทเดียวได้
- [ ] ต้องมีการแสดงรายการสิทธิ์ทั้งหมดที่บทบาทนั้นมี
- [ ] ต้องมีการค้นหาและกรองสิทธิ์ตามทรัพยากรหรือการกระทำ
- [ ] ต้องมีการบันทึกการเปลี่ยนแปลงสิทธิ์ในระบบ Audit Log

### Story 2: ระบบตรวจสอบสิทธิ์ของบทบาท

**ในฐานะ** ระบบแอปพลิเคชัน  
**ฉันต้องการ** ตรวจสอบสิทธิ์ที่บทบาทมีก่อนทำการกระทำใดๆ  
**เพื่อที่จะ** ตรวจสอบสิทธิ์การเข้าถึงทรัพยากรของผู้ใช้ที่มีบทบาทต่างๆ

**Acceptance Criteria:**

- [ ] ต้องสามารถดึงรายการสิทธิ์ทั้งหมดของบทบาทได้
- [ ] ต้องสามารถตรวจสอบว่าบทบาทมีสิทธิ์ที่ต้องการได้
- [ ] ต้องรองรับการตรวจสอบหลายสิทธิ์พร้อมกัน
- [ ] ต้องมีการ Cache ข้อมูลสิทธิ์เพื่อเพิ่มประสิทธิภาพ
- [ ] ต้องมีการบันทึกการตรวจสอบสิทธิ์
- [ ] ต้องส่งคืนข้อมูลสิทธิ์พร้อมรายละเอียดทรัพยากร
- [ ] ต้องรองรับการตรวจสอบสิทธิ์แบบมีเงื่อนไข

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การกำหนดสิทธิ์ให้บทบาท (Role Permission Assignment)
- การถอดสิทธิ์จากบทบาท (Role Permission Removal)
- การดึงรายการสิทธิ์ของบทบาท (Role Permission Retrieval)
- การตรวจสอบสิทธิ์ของบทบาท (Role Permission Verification)
- การจัดการความสัมพันธ์ระหว่างบทบาทและสิทธิ์ (Role-Permission Mapping)
- การบันทึกประวัติการกำหนดสิทธิ์ (Permission Assignment History)
- การ Cache ข้อมูลสิทธิ์ของบทบาท

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การจัดการสิทธิ์แบบไดนามิกขณะทำงาน (Dynamic Permission Assignment)
- การกำหนดสิทธิ์ชั่วคราว (Temporary Permission Assignment)
- การจัดการสิทธิ์ตามเวลา (Time-based Permission Assignment)
- การจัดการสิทธิ์แบบมีเงื่อนไข (Conditional Permission Assignment)
- การจัดการสิทธิ์ผ่านการลงนามดิจิทัล (Digital Signatures)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint                                          | Description                                   | Request Body                | Response                     |
| ------ | ------------------------------------------------- | --------------------------------------------- | --------------------------- | ---------------------------- |
| POST   | `/api/roles/:roleId/permissions`                  | กำหนดสิทธิ์ให้บทบาท                           | `{ permissionId }`          | `{ rolePermission }`         |
| DELETE | `/api/roles/:roleId/permissions/:permissionId`    | ถอดสิทธิ์จากบทบาท                             | -                           | `{ success: true }`          |
| GET    | `/api/roles/:roleId/permissions`                  | ดึงรายการสิทธิ์ของบทบาท                       | -                           | `{ permissions }`            |
| GET    | `/api/permissions/:permissionId/roles`            | ดึงรายการบทบาทที่มีสิทธิ์นี้                  | -                           | `{ roles }`                  |
| GET    | `/api/roles/:roleId/has-permission/:permissionId` | ตรวจสอบว่าบทบาทมีสิทธิ์นี้หรือไม่             | -                           | `{ hasPermission: boolean }` |
| GET    | `/api/roles/:roleId/all-permissions`              | ดึงรายการสิทธิ์ทั้งหมดของบทบาทพร้อมรายละเอียด | -                           | `{ permissions }`            |
| POST   | `/api/roles/batch-permission-assignment`          | กำหนดสิทธิ์ให้บทบาทหลายบทบาทพร้อมกัน          | `{ roleIds, permissionId }` | `{ results }`                |

### 5.2 Database Schema

```prisma
model RolePermission {
  id           String   @id @default(uuid())
  roleId       String
  permissionId String
  assignedAt   DateTime @default(now())
  assignedBy   String?  // ผู้ที่กำหนดสิทธิ์

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  assignedByUser User?    @relation("PermissionAssignment", fields: [assignedBy], references: [id])

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}
```

### 5.3 Security Requirements

- ต้องมีการตรวจสอบสิทธิ์ก่อนกำหนดสิทธิ์ให้บทบาท
- ต้องมีการตรวจสอบว่าผู้ทำการกำหนดมีสิทธิ์เพียงพอ
- ต้องมีการบันทึกการเปลี่ยนแปลงสิทธิ์ในระบบ Audit Log
- ต้องป้องกันการกำหนดสิทธิ์ที่สำคัญโดยไม่ได้รับอนุญาต
- ต้องมีการ Cache ข้อมูลสิทธิ์เพื่อประสิทธิภาพ (Response Time ไม่เกิน 50ms)
- ต้องมีการตรวจสอบข้อมูลก่อนกำหนดสิทธิ์

### 5.4 Frontend Requirements

- มีหน้าจอสำหรับจัดการสิทธิ์ของบทบาท
- มีคอมโพเนนต์สำหรับเลือกและกำหนดสิทธิ์
- มีการแสดงรายการสิทธิ์ปัจจุบันของบทบาท
- มีการตรวจสอบสิทธิ์ก่อนแสดง UI สำหรับจัดการสิทธิ์
- มีการแจ้งเตือนเมื่อกำหนดหรือถอดสิทธิ์สำเร็จ

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการกำหนดสิทธิ์ให้บทบาท
- [ ] ทดสอบการถอดสิทธิ์จากบทบาท
- [ ] ทดสอบการดึงรายการสิทธิ์ของบทบาท
- [ ] ทดสอบการตรวจสอบสิทธิ์ของบทบาท
- [ ] ทดสอบกลไกการ Cache ข้อมูลสิทธิ์

### 6.2 Integration Tests

- [ ] ทดสอบ API Endpoints ทั้งหมด
- [ ] ทดสอบการทำงานร่วมกับระบบบทบาท (Role System)
- [ ] ทดสอบการทำงานร่วมกับระบบสิทธิ์ (Permission System)
- [ ] ทดสอบการตรวจสอบสิทธิ์ก่อนกำหนดสิทธิ์
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 E2E Tests

- [ ] ทดสอบการกำหนดสิทธิ์ผ่าน Admin UI
- [ ] ทดสอบการตรวจสอบสิทธิ์ในหน้า UI ต่างๆ
- [ ] ทดสอบการแสดงผล UI ตามสิทธิ์ของบทบาท

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ระบบต้องการ PostgreSQL Database สำหรับจัดเก็บข้อมูลบทบาทและสิทธิ์
- ต้องมีระบบ Role Management ที่ทำงานได้เต็มรูปแบบ
- ต้องมีระบบ Permission Management ที่เชื่อมโยงกับระบบบทบาท
- ต้องมี Redis สำหรับจัดเก็บข้อมูลสิทธิ์ที่ใช้บ่อย (Cache)

### 7.2 Assumptions

- ผู้ใช้ต้องล็อกอินเข้าสู่ระบบก่อนทำการกระทำใดๆ
- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- มีการจัดการ Session และ Token อย่างปลอดภัย
- ข้อมูลสิทธิ์จะถูกโหลดเมื่อผู้ใช้ล็อกอินและ Cache ไว้

## 8. Non-Functional Requirements

### 8.1 Performance

- การตรวจสอบสิทธิ์ต้องทำงานได้ภายใน **50ms** (P95)
- การโหลดข้อมูลสิทธิ์ต้องเสร็จภายใน **100ms**
- รองรับการตรวจสอบสิทธิ์ได้อย่างน้อย **1,000 ครั้งต่อวินาที**

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.5%**
- ต้องมีการ Backup ข้อมูลการกำหนดสิทธิ์ทุกวัน

### 8.3 Security

- ต้องมีการเข้ารหัสข้อมูลที่สำคัญ
- ต้องมีการตรวจสอบและป้องกันการโจมตีแบบ Privilege Escalation
- ต้องมีการบันทึกการเปลี่ยนแปลงสิทธิ์ทั้งหมด

## 9. Risks และ Mitigation

| Risk                               | Impact   | Probability | Mitigation Strategy                                             |
| ---------------------------------- | -------- | ----------- | --------------------------------------------------------------- |
| Permission Cache Stale             | High     | Medium      | ใช้ TTL สำหรับ Cache และมีกลไก Invalidate เมื่อมีการเปลี่ยนแปลง |
| Unauthorized Permission Assignment | Critical | Low         | ตรวจสอบสิทธิ์ผู้ทำการกำหนดทุกครั้งและมี Audit Log               |
| Complex Permission Hierarchy       | Medium   | High        | ใช้ Unit Tests ครอบคลุมและมีเอกสารอธิบายการทำงานอย่างละเอียด    |
| Performance Issues                 | High     | Low         | ใช้ Redis Cache และ Database Indexing อย่างเหมาะสม              |

## 10. Timeline และ Milestones

| Milestone                   | Target Date | Status      |
| --------------------------- | ----------- | ----------- |
| Database Schema Design      | 2025-10-16  | Not Started |
| Backend API Development     | 2025-10-18  | Not Started |
| Permission Assignment Logic | 2025-10-20  | Not Started |
| Frontend Integration        | 2025-10-22  | Not Started |
| Testing                     | 2025-10-24  | Not Started |
| Production Deployment       | 2025-10-26  | Not Started |

## 11. Sign-off

| Role          | Name | Date | Signature |
| ------------- | ---- | ---- | --------- |
| Product Owner | -    | -    | Pending   |
| Tech Lead     | -    | -    | Pending   |
| QA Lead       | -    | -    | Pending   |

---

**หมายเหตุ:** เอกสารนี้เป็น Living Document และจะถูกอัปเดตตามความจำเป็น การเปลี่ยนแปลงใดๆ ต้องผ่านการอนุมัติจาก Product Owner และ Tech Lead
