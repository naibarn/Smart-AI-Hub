---
title: 'User-Specific Credit Check API'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P1'
related_specs:
  [
    'FR-3',
    'FR-4',
    'FR-5',
    'credit_account.md',
    'credit_transaction.md',
    'usage_log.md',
    'mcp_server.md',
  ]
---

# User-Specific Credit Check API

## 1. ภาพรวม (Overview)

User-Specific Credit Check API เป็นส่วนสำคัญของระบบจัดการเครดิตของแพลตฟอร์ม Smart AI Hub ที่ออกแบบมาเพื่อให้บริการแก่บุคคลที่สามในการตรวจสอบยอดเครดิตคงเหลือของผู้ใช้ ระบบนี้ทำหน้าที่ในการตรวจสอบว่าผู้ใช้มีเครดิตเพียงพอสำหรับการใช้งานบริการต่างๆ หรือไม่ ก่อนที่จะดำเนินการประมวลผลจริง

ระบบนี้ทำงานโดยรับข้อมูลผู้ใช้ผ่าน HTTP Header และข้อมูลบริการผ่าน Request Body จากนั้นตรวจสอบยอดเครดิตคงเหลือในระบบและส่งคืนผลลัพธ์พร้อมข้อมูลยอดเครดิตปัจจุบัน ระบบนี้ถูกออกแบบมาให้ทำงานได้รวดเร็วเพื่อไม่ให้กระทบต่อประสิทธิภาพของบริการหลัก

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้บุคคลที่สามสามารถตรวจสอบยอดเครดิตของผู้ใช้ได้
- ป้องกันการเรียกใช้บริการเมื่อเครดิตไม่เพียงพอ
- รับประกันความถูกต้องของการตรวจสอบยอดเครดิต
- อำนวยความสะดวกในการจัดการเครดิตสำหรับบริการต่างๆ
- รองรับการตรวจสอบพร้อมกันหลายคำขอ (Concurrent Requests)
- ให้บริการที่รวดเร็วและมีประสิทธิภาพ
- ลดความซับซ้อนในการบูรณาการระบบเครดิต

## 3. User Stories

### Story 1: บริการของบุคคลที่สามตรวจสอบเครดิตผู้ใช้

**ในฐานะ** ผู้ให้บริการบุคคลที่สาม  
**ฉันต้องการ** ตรวจสอบยอดเครดิตของผู้ใช้ก่อนให้บริการ  
**เพื่อที่จะ** มั่นใจว่าผู้ใช้มีเครดิตเพียงพอสำหรับการใช้งาน

**Acceptance Criteria:**

- [ ] ต้องมี API Endpoint สำหรับตรวจสอบเครดิต
- [ ] ต้องรับ User ID ผ่าน X-User-ID Header
- [ ] ต้องรับข้อมูลบริการและต้นทุนผ่าน Request Body
- [ ] ต้องส่งคืนผลว่ามีเครดิตเพียงพอหรือไม่
- [ ] ต้องส่งคืนยอดเครดิตปัจจุบัน
- [ ] ต้องตอบกลับภายใน 200ms
- [ ] ต้องรองรับการตรวจสอบพร้อมกันหลายคำขอ

### Story 2: ผู้ดูแลระบบตรวจสอบประสิทธิภาพ API

**ในฐานะ** ผู้ดูแลระบบ  
**ฉันต้องการ** ตรวจสอบประสิทธิภาพและการใช้งาน Credit Check API  
**เพื่อที่จะ** มั่นใจในความเสถียรและประสิทธิภาพของระบบ

**Acceptance Criteria:**

- [ ] ต้องมีการติดตามประสิทธิภาพของ API
- [ ] ต้องมีการบันทึกการเรียกใช้ API ทั้งหมด
- [ ] ต้องมีการแจ้งเตือนเมื่อ API ทำงานช้า
- [ ] ต้องมีรายงานสถิติการใช้งาน API
- [ ] ต้องมีการตรวจสอบข้อผิดพลาดและการจัดการ
- [ ] ต้องมีการตรวจสอบความปลอดภัยของ API
- [ ] ต้องมีการตรวจสอบการใช้งานพร้อมกัน (Concurrency)

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การตรวจสอบยอดเครดิต (Credit Balance Checking)
- การตรวจสอบความเพียงพอของเครดิต (Credit Sufficiency)
- การจัดการคำขอพร้อมกัน (Concurrent Request Handling)
- การจัดการข้อผิดพลาด (Error Handling)
- การบันทึกการเรียกใช้ API (API Logging)
- การรับประกันความถูกต้องของข้อมูล (Data Integrity)
- การปรับปรุงประสิทธิภาพ (Performance Optimization)

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การหักเครดิตจริง (Credit Deduction)
- การจัดการการโอนเครดิต (Credit Transfer)
- การจัดการส่วนลดและโปรโมชั่น (Discount & Promotion)
- การจัดการประวัติการใช้เครดิต (Credit History)
- การจัดการรายงานการเงิน (Financial Reporting)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 API Endpoint

```
POST /api/mcp/v1/credits/check
```

### 5.2 Request Specification

#### Headers:

```
Content-Type: application/json
X-User-ID: {user_id}
X-API-Key: {api_key} (optional, for additional security)
```

#### Request Body:

```json
{
  "service": "string",
  "cost": "number",
  "metadata": {
    "request_id": "string",
    "client_id": "string",
    "additional_info": "object"
  }
}
```

#### Example Request:

```json
{
  "service": "gpt-4-turbo",
  "cost": 10.5,
  "metadata": {
    "request_id": "req_1234567890",
    "client_id": "custom_gpt",
    "model": "gpt-4-turbo",
    "estimated_tokens": 1000
  }
}
```

### 5.3 Response Specification

#### Successful Response (200 OK):

```json
{
  "sufficient": true,
  "balance": 150.75,
  "requested_cost": 10.5,
  "remaining_after_cost": 140.25,
  "currency": "credits",
  "user_id": "user_12345",
  "timestamp": "2025-10-15T10:30:00Z",
  "request_id": "req_1234567890"
}
```

#### Insufficient Credits Response (402 Payment Required):

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "User does not have sufficient credits for this service",
    "details": {
      "current_balance": 5.25,
      "required": 10.5,
      "shortfall": 5.25
    },
    "timestamp": "2025-10-15T10:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

#### User Not Found Response (404 Not Found):

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with the provided ID does not exist",
    "details": {
      "user_id": "invalid_user_id"
    },
    "timestamp": "2025-10-15T10:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

### 5.4 Supported Service Types

ระบบรองรับประเภทบริการต่อไปนี้:

| Service Type     | Description            | Cost Range              |
| ---------------- | ---------------------- | ----------------------- |
| gpt-4-turbo      | GPT-4 Turbo Model      | 8-12 credits/1K tokens  |
| gpt-3.5-turbo    | GPT-3.5 Turbo Model    | 1-2 credits/1K tokens   |
| claude-3-opus    | Claude 3 Opus Model    | 12-15 credits/1K tokens |
| claude-3-sonnet  | Claude 3 Sonnet Model  | 8-10 credits/1K tokens  |
| claude-3-haiku   | Claude 3 Haiku Model   | 2-3 credits/1K tokens   |
| image-generation | Image Generation       | 20-50 credits/image     |
| video-generation | Video Generation       | 100-200 credits/minute  |
| custom-gpt       | Custom GPT Integration | Variable                |

### 5.5 Security Requirements

- ต้องมีการตรวจสอบ API Key สำหรับบุคคลที่สาม
- ต้องมีการจำกัดอัตราการเรียกใช้ API (Rate Limiting)
- ต้องมีการตรวจสอบความถูกต้องของ User ID
- ต้องมีการบันทึกการเรียกใช้ API ทั้งหมด
- ต้องมีการป้องกันการโจมตีแบบ Brute Force
- ต้องมีการเข้ารหัสข้อมูลที่ละเอียดอ่อน
- ต้องใช้ HTTPS สำหรับทุกการเรียกใช้

### 5.6 Performance Requirements

- API ต้องตอบกลับภายใน **200ms** สำหรับ 95% ของคำขอ
- ต้องรองรับการเรียกใช้พร้อมกันได้อย่างน้อย **1,000 ครั้งต่อวินาที**
- ต้องมีการ Cache ข้อมูลยอดเครดิตที่ถูกเรียกใช้บ่อย
- ต้องมีการจัดการ Database Connection Pool อย่างมีประสิทธิภาพ

### 5.7 Concurrency Handling

ระบบต้องรองรับการตรวจสอบเครดิตพร้อมกันหลายคำขอสำหรับผู้ใช้เดียวกัน:

- ใช้ Database Transactions ที่มีความเป็น Isolation สูง
- ใช้ Row-level Locks สำหรับการอ่านข้อมูลเครดิต
- ใช้ Optimistic Concurrency Control เพื่อลด Lock Contention
- มีการ Retry Logic สำหรับการแข่งขันข้อมูล

### 5.8 Error Handling

ระบบต้องจัดการข้อผิดพลาดต่อไปนี้:

- 400 Bad Request: ข้อมูลใน Request Body ไม่ถูกต้อง
- 401 Unauthorized: API Key ไม่ถูกต้องหรือหมดอายุ
- 404 Not Found: ไม่พบผู้ใช้ที่ระบุ
- 402 Payment Required: เครดิตไม่เพียงพอ
- 429 Too Many Requests: เกินอัตราการเรียกใช้ที่กำหนด
- 500 Internal Server Error: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
- 503 Service Unavailable: บริการไม่พร้อมใช้งานชั่วคราว

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการตรวจสอบยอดเครดิต
- [ ] ทดสอบการตรวจสอบความเพียงพอของเครดิต
- [ ] ทดสอบการจัดการข้อผิดพลาดต่างๆ
- [ ] ทดสอบการตรวจสอบความถูกต้องของข้อมูลนำเข้า
- [ ] ทดสอบการจัดรูปแบบข้อมูลส่งออก

### 6.2 Integration Tests

- [ ] ทดสอบการทำงานร่วมกับระบบจัดการเครดิต
- [ ] ทดสอบการทำงานร่วมกับระบบจัดการผู้ใช้
- [ ] ทดสอบการทำงานร่วมกับระบบฐานข้อมูล
- [ ] ทดสอบการทำงานร่วมกับระบบ Cache
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 Performance Tests

- [ ] ทดสอบประสิทธิภาพภายใต้ภาระงานปกติ
- [ ] ทดสอบประสิทธิภาพภายใต้ภาระงานสูง
- [ ] ทดสอบการทำงานพร้อมกัน (Concurrency)
- [ ] ทดสอบการใช้งาน Cache
- [ ] ทดสอบ Response Time ภายใต้สถานการณ์ต่างๆ

### 6.4 Security Tests

- [ ] ทดสอบการตรวจสอบ API Key
- [ ] ทดสอบการจำกัดอัตราการเรียกใช้
- [ ] ทดสอบการป้องกันการโจมตีแบบ Injection
- [ ] ทดสอบการป้องกันการโจมตีแบบ Brute Force
- [ ] ทดสอบการเข้ารหัสข้อมูล

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ต้องมีระบบจัดการเครดิต (Credit Management System)
- ต้องมีระบบจัดการผู้ใช้ (User Management System)
- ต้องมีระบบฐานข้อมูลที่เชื่อถือได้
- ต้องมีระบบ Cache สำหรับประสิทธิภาพ

### 7.2 Assumptions

- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- บุคคลที่สามมี API Key ที่ถูกต้อง
- ข้อมูลเครดิตมีความถูกต้องและเป็นปัจจุบันเสมอ
- ระบบสามารถรองรับภาระงานที่คาดการณ์ไว้ได้

## 8. Non-Functional Requirements

### 8.1 Performance

- API ต้องตอบกลับภายใน **200ms** สำหรับ 95% ของคำขอ
- ต้องรองรับการเรียกใช้พร้อมกันได้อย่างน้อย **1,000 ครั้งต่อวินาที**
- ต้องมีการ Cache ข้อมูลยอดเครดิตที่ถูกเรียกใช้บ่อย

### 8.2 Availability

- API ต้องมี Uptime อย่างน้อย **99.9%**
- ต้องมีระบบ Load Balancing และ Failover

### 8.3 Security

- ต้องมีการตรวจสอบสิทธิ์ทุกครั้ง
- ต้องมีการป้องกันการโจมตีทั่วไป
- ต้องมีการบันทึกการเรียกใช้ API ทั้งหมด

## 9. Acceptance Criteria

- ตรวจสอบยอดเครดิตของผู้ใช้อย่างถูกต้อง
- ส่งคืน 402 เมื่อเครดิตไม่เพียงพอ
- ส่งคืน 404 เมื่อไม่พบผู้ใช้
- จัดการคำขอพร้อมกันอย่างถูกต้อง
- ตอบกลับภายใน 200ms
- รองรับประเภทบริการและต้นทุนที่แตกต่างกัน
- ส่งคืนยอดเครดิตปัจจุบันพร้อมข้อมูลอื่นๆ

## 10. Risks และ Mitigation

| Risk               | Impact   | Probability | Mitigation Strategy                    |
| ------------------ | -------- | ----------- | -------------------------------------- |
| Performance Issues | High     | Medium      | มีระบบ Cache และ Database Optimization |
| Race Conditions    | High     | Medium      | มีการจัดการ Concurrency อย่างเหมาะสม   |
| Data Inconsistency | Critical | Low         | มีการตรวจสอบความถูกต้องของข้อมูล       |
| API Abuse          | High     | Medium      | มีระบบ Rate Limiting และ Monitoring    |

## 11. Timeline และ Milestones

| Milestone                | Target Date | Status      |
| ------------------------ | ----------- | ----------- |
| API Development          | 2025-10-16  | Not Started |
| Database Integration     | 2025-10-18  | Not Started |
| Security Implementation  | 2025-10-20  | Not Started |
| Performance Optimization | 2025-10-22  | Not Started |
| Testing                  | 2025-10-24  | Not Started |
| Production Deployment    | 2025-10-26  | Not Started |

## 12. Sign-off

| Role          | Name | Date | Signature |
| ------------- | ---- | ---- | --------- |
| Product Owner | -    | -    | Pending   |
| Tech Lead     | -    | -    | Pending   |
| QA Lead       | -    | -    | Pending   |

---

**หมายเหตุ:** เอกสารนี้เป็น Living Document และจะถูกอัปเดตตามความจำเป็น การเปลี่ยนแปลงใดๆ ต้องผ่านการอนุมัติจาก Product Owner และ Tech Lead
