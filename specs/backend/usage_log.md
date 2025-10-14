---
title: 'Usage Logging and Analytics System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P1'
related_specs: ['FR-CREDIT-03', 'FR-CREDIT-04', 'credit_account.md', 'mcp_server.md']
---

# Usage Logging and Analytics System

## 1. ภาพรวม (Overview)

ระบบบันทึกการใช้งานและวิเคราะห์ (Usage Logging and Analytics System) เป็นส่วนสำคัญของแพลตฟอร์ม Smart AI Hub ที่ใช้สำหรับบันทึกการใช้งานบริการต่างๆ ของผู้ใช้ ระบบนี้ทำงานร่วมกับระบบบัญชีเครดิตและระบบ MCP Server เพื่อติดตามการใช้งาน AI Services และคำนวณค่าใช้จ่าย

ระบบนี้ทำงานโดยบันทึกการใช้งานทุกครั้งของผู้ใช้ รวมถึงข้อมูลเกี่ยวกับบริการที่ใช้ โมเดล AI ที่เรียกใช้ จำนวนโทเค็นที่ใช้ และเครดิตที่ถูกหัก การบันทึกข้อมูลการใช้งานเป็นส่วนสำคัญในการคำนวณค่าใช้จ่าย การวิเคราะห์พฤติกรรมผู้ใช้ และการติดตามประสิทธิภาพของระบบ

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้สามารถบันทึกการใช้งานบริการได้อย่างครบถ้วน
- รองรับการคำนวณค่าใช้จ่ายตามการใช้งานจริง
- ป้องกันการสูญหายของข้อมูลการใช้งาน
- อำนวยความสะดวกในการวิเคราะห์พฤติกรรมผู้ใช้
- รองรับการสร้างรายงานการใช้งานที่หลากหลาย
- ทำงานร่วมกับระบบบัญชีเครดิตอย่างมีประสิทธิภาพ
- ลดความซับซ้อนในการจัดการข้อมูลการใช้งาน

## 3. User Stories

### Story 1: ระบบบันทึกการใช้งาน AI Services

**ในฐานะ** ระบบแอปพลิเคชัน  
**ฉันต้องการ** บันทึกการใช้งาน AI Services ทุกครั้งของผู้ใช้  
**เพื่อที่จะ** คำนวณค่าใช้จ่ายและติดตามการใช้งาน

**Acceptance Criteria:**

- [ ] ต้องบันทึกการเรียกใช้ AI Services ทุกครั้ง
- [ ] ต้องบันทึกข้อมูลผู้ใช้ บริการ และโมเดลที่ใช้
- [ ] ต้องบันทึกจำนวนโทเค็นที่ใช้ (input/output)
- [ ] ต้องคำนวณและบันทึกเครดิตที่ถูกหัก
- [ ] ต้องบันทึกข้อมูลเพิ่มเติม (metadata) ที่เกี่ยวข้อง
- [ ] ต้องมีการจัดเก็บข้อมูลอย่างปลอดภัย
- [ ] ต้องมีการตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก

### Story 2: ผู้ดูแลระบบวิเคราะห์การใช้งาน

**ในฐานะ** ผู้ดูแลระบบ  
**ฉันต้องการ** วิเคราะห์ข้อมูลการใช้งานของผู้ใช้  
**เพื่อที่จะ** ติดตามประสิทธิภาพและวางแผนทรัพยากร

**Acceptance Criteria:**

- [ ] ต้องมีหน้าจอสำหรับดูสถิติการใช้งาน
- [ ] ต้องสามารถกรองข้อมูลตามช่วงเวลาได้
- [ ] ต้องสามารถกรองข้อมูลตามผู้ใช้ได้
- [ ] ต้องสามารถกรองข้อมูลตามบริการได้
- [ ] ต้องแสดงกราฟการใช้งานแบบมองเห็นภาพรวม
- [ ] ต้องสามารถส่งออกข้อมูลเป็นไฟล์ได้
- [ ] ต้องมีการแสดงข้อมูลสรุปการใช้งานที่สำคัญ

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การบันทึกการใช้งาน AI Services (Usage Logging)
- การคำนวณค่าใช้จ่าย (Cost Calculation)
- การจัดเก็บข้อมูลการใช้งาน (Data Storage)
- การดึงข้อมูลการใช้งาน (Data Retrieval)
- การวิเคราะห์การใช้งาน (Usage Analytics)
- การสร้างรายงานการใช้งาน (Reporting)
- การจัดการข้อมูลเพิ่มเติม (Metadata Management)

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การจัดการการเรียกใช้ API โดยตรง (Direct API Management)
- การจัดการสิทธิ์การเข้าถึง API (API Access Control)
- การจัดการคิวการใช้งาน (Usage Queue Management)
- การจัดการการสำรองข้อมูล (Data Archiving)
- การจัดการข้อมูล Real-time Processing

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint                       | Description                  | Request Body                                            | Response               |
| ------ | ------------------------------ | ---------------------------- | ------------------------------------------------------- | ---------------------- |
| POST   | `/api/usage-logs`              | บันทึกการใช้งานใหม่          | `{ userId, service, model, tokens, credits, metadata }` | `{ usageLog }`         |
| GET    | `/api/usage-logs/:id`          | ดึงข้อมูลการใช้งานตาม ID     | -                                                       | `{ usageLog }`         |
| GET    | `/api/usage-logs/user/:userId` | ดึงประวัติการใช้งานของผู้ใช้ | Query: `{ page, limit, startDate, endDate, service }`   | `{ usageLogs, total }` |
| GET    | `/api/usage-logs/stats`        | ดึงสถิติการใช้งาน            | Query: `{ startDate, endDate, userId, service }`        | `{ statistics }`       |
| GET    | `/api/usage-logs/export`       | ส่งออกข้อมูลการใช้งาน        | Query: `{ format, filters }`                            | `{ downloadUrl }`      |
| GET    | `/api/usage-logs/summary`      | ดึงข้อมูลสรุปการใช้งาน       | Query: `{ period, groupBy }`                            | `{ summary }`          |
| POST   | `/api/usage-logs/batch`        | บันทึกการใช้งานหลายรายการ    | `{ usageLogs }`                                         | `{ results }`          |

### 5.2 Database Schema

```prisma
model UsageLog {
  id        String   @id @default(uuid())
  userId    String
  service   String   // openai, claude, custom
  model     String   // gpt-4, claude-3-sonnet, etc.
  tokens    Int      // จำนวนโทเค็นทั้งหมด
  credits   Int      // เครดิตที่ถูกหัก
  metadata  Json?    // ข้อมูลเพิ่มเติม (requestId, responseTime, etc.)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([service, createdAt])
  @@index([model, createdAt])
  @@map("usage_logs")
}
```

### 5.3 Security Requirements

- ต้องมีการตรวจสอบสิทธิ์ก่อนเข้าถึงข้อมูลการใช้งาน
- ต้องมีการตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก
- ต้องมีการบันทึกการเข้าถึงข้อมูลการใช้งานในระบบ Audit Log
- ต้องป้องกันการเข้าถึงข้อมูลการใช้งานโดยไม่ได้รับอนุญาต
- ต้องมีการเข้ารหัสข้อมูลที่สำคัญ
- ต้องมีการจำกัดจำนวนข้อมูลที่ดึงได้ต่อครั้ง

### 5.4 Frontend Requirements

- มีหน้าจอสำหรับดูประวัติการใช้งาน
- มีหน้าจอสำหรับดูสถิติการใช้งาน
- มีการแสดงกราฟการใช้งานแบบมองเห็นภาพรวม
- มีการตรวจสอบสิทธิ์ก่อนแสดงข้อมูล
- มีการกรองข้อมูลตามเงื่อนไขต่างๆ
- มีการส่งออกข้อมูลเป็นไฟล์

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการบันทึกการใช้งาน
- [ ] ทดสอบการคำนวณเครดิต
- [ ] ทดสอบการดึงข้อมูลการใช้งาน
- [ ] ทดสอบการคำนวณสถิติ
- [ ] ทดสอบการจัดการข้อมูลเพิ่มเติม

### 6.2 Integration Tests

- [ ] ทดสอบ API Endpoints ทั้งหมด
- [ ] ทดสอบการทำงานร่วมกับระบบบัญชีเครดิต
- [ ] ทดสอบการทำงานร่วมกับระบบ MCP Server
- [ ] ทดสอบการทำงานร่วมกับระบบผู้ใช้
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 E2E Tests

- [ ] ทดสอบการบันทึกการใช้งานแบบ end-to-end
- [ ] ทดสอบการดูประวัติการใช้งานผ่าน UI
- [ ] ทดสอบการดูสถิติการใช้งานผ่าน UI
- [ ] ทดสอบการส่งออกข้อมูลผ่าน UI
- [ ] ทดสอบการกรองข้อมูลผ่าน UI

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ระบบต้องการ PostgreSQL Database สำหรับจัดเก็บข้อมูลการใช้งาน
- ต้องมีระบบ User Management ที่ทำงานได้เต็มรูปแบบ
- ต้องมีระบบ Credit Account Management
- ต้องมีระบบ MCP Server
- ต้องมีระบบติดตามการทำรายการ

### 7.2 Assumptions

- การใช้งาน AI Services จะถูกบันทึกทุกครั้ง
- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- มีการจัดการ Session และ Token อย่างปลอดภัย
- ข้อมูลการใช้งานจะถูกบันทึกและจัดเก็บอย่างถาวร

## 8. Non-Functional Requirements

### 8.1 Performance

- การบันทึกการใช้งานต้องทำงานได้ภายใน **100ms** (P95)
- การดึงข้อมูลการใช้งานต้องเสร็จภายใน **200ms**
- รองรับการบันทึกการใช้งานได้อย่างน้อย **100 รายการต่อวินาที**

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.5%**
- ต้องมีการ Backup ข้อมูลการใช้งานทุกวัน

### 8.3 Security

- ต้องมีการเข้ารหัสข้อมูลที่สำคัญ
- ต้องมีการตรวจสอบและป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต
- ต้องมีการบันทึกการเข้าถึงข้อมูลทั้งหมด

## 9. Risks และ Mitigation

| Risk                | Impact   | Probability | Mitigation Strategy                           |
| ------------------- | -------- | ----------- | --------------------------------------------- |
| Data Loss           | Critical | Low         | มีระบบ Backup และ Replication ข้อมูลอัตโนมัติ |
| Performance Issues  | High     | Medium      | ใช้ Database Indexing และ Partitioning ข้อมูล |
| Unauthorized Access | High     | Low         | มีระบบตรวจสอบสิทธิ์ที่เข้มงวด                 |
| Inaccurate Billing  | Critical | Medium      | มีระบบตรวจสอบความถูกต้องของข้อมูลหลายชั้น     |

## 10. Timeline และ Milestones

| Milestone                   | Target Date | Status      |
| --------------------------- | ----------- | ----------- |
| Database Schema Design      | 2025-10-16  | Not Started |
| Backend API Development     | 2025-10-18  | Not Started |
| Logging Service Integration | 2025-10-20  | Not Started |
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
