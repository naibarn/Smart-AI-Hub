---
title: "FR-7: Webhook System"
author: "Development Team"
created_date: "2025-10-15"
version: "1.0"
status: "Draft"
priority: "P1"
type: "functional_requirement"
category: "integration"
dependencies: ["FR-1", "FR-3", "FR-5"]
---

# FR-7: Webhook System

## 1. ภาพรวม (Overview)

Webhook System เป็นคุณสมบัติที่อนุญาตให้ Smart AI Hub ส่งการแจ้งเตือนแบบ real-time ไปยังระบบภายนอกเมื่อเกิดเหตุการณ์ที่สำคัญภายในระบบ ระบบนี้ช่วยให้ลูกค้าและพันธมิตรสามารถ integrate กับ Smart AI Hub ได้อย่างราบรื่น โดยรองรับการส่งข้อมูลไปยัง endpoint ภายนอกเมื่อมีเหตุการณ์ต่างๆ เช่น การสร้างผู้ใช้ใหม่ เครดิตหมด หรือการใช้งาน service เสร็จสิ้น

## 2. วัตถุประสงค์ (Objectives)

- 2.1 จัดเตรียมกลไกการแจ้งเตือนแบบ real-time ให้กับระบบภายนอก
- 2.2 รองรับการเชื่อมต่อกับ third-party services ผ่าน HTTP callbacks
- 2.3 ให้ความยืดหยุ่นในการกำหนดค่าและจัดการ webhook endpoints
- 2.4 รับประกันความน่าเชื่อถือของการส่งข้อมูลด้วย retry policy และ signature verification
- 2.5 ช่วยให้ลูกค้าสามารถสร้าง workflow อัตโนมัติโดยใช้เหตุการณ์จาก Smart AI Hub

## 3. User Stories

### 3.1 ในฐานะผู้ดูแลระบบ ฉันต้องการจัดการ webhook endpoints เพื่อกำหนดว่าจะส่งข้อมูลไปที่ไหนเมื่อเกิดเหตุการณ์

**Acceptance Criteria:**
- AC 3.1.1: ฉันสามารถเพิ่ม/แก้ไข/ลบ webhook endpoints ได้ผ่านหน้า UI
- AC 3.1.2: ฉันสามารถกำหนดว่าแต่ละ endpoint จะรับเหตุการณ์ประเภทใดได้
- AC 3.1.3: ฉันสามารถตั้งค่า secret key สำหรับแต่ละ endpoint เพื่อ verify signature
- AC 3.1.4: ฉันสามารถเปิด/ปิดการใช้งานแต่ละ endpoint ได้
- AC 3.1.5: ฉันสามารถดูประวัติการส่ง webhook และสถานะของแต่ละครั้ง
- AC 3.1.6: ฉันสามารถทดสอบ webhook endpoint ด้วยการส่ง test event ได้
- AC 3.1.7: ระบบต้องแสดง error logs เมื่อการส่ง webhook ล้มเหลว

### 3.2 ในฐานะนักพัฒนา ฉันต้องการรับ webhook events เพื่อ integrate กับระบบของฉัน

**Acceptance Criteria:**
- AC 3.2.1: ฉันสามารถลงทะเบียน endpoint URL ในระบบได้
- AC 3.2.2: ฉันได้รับ HTTP POST request เมื่อเกิดเหตุการณ์ที่สมัครใจ
- AC 3.2.3: request body มีโครงสร้าง JSON ที่มี event type, timestamp และข้อมูลที่เกี่ยวข้อง
- AC 3.2.4: ฉันสามารถ verify ความถูกต้องของ webhook ด้วย HMAC-SHA256 signature
- AC 3.2.5: ฉันสามารถดู documentation ของ event payload format ได้
- AC 3.2.6: ฉันได้รับ retry requests หาก endpoint ของฉันไม่ตอบสนอง
- AC 3.2.7: ฉันสามารถ unsubscribe จาก events ที่ไม่ต้องการได้ง่ายๆ

## 4. ขอบเขตงาน (Scope)

### In Scope:
- 4.1 การสร้างและจัดการ webhook endpoints ผ่าน UI และ API
- 4.2 การส่ง HTTP POST requests ไปยัง external endpoints
- 4.3 การสนับสนุน event types: `user.created`, `credit.depleted`, `service.completed`
- 4.4 Retry policy พร้อม exponential backoff (สูงสุด 3 ครั้ง)
- 4.5 HMAC-SHA256 signature verification
- 4.6 Webhook delivery logs และ status tracking
- 4.7 Test webhook functionality สำหรับ developers

### Out of Scope:
- 4.8 Real-time websockets connection (สำหรับ version ถัดไป)
- 4.9 Custom event transformation ก่อนส่ง (phase 2)
- 4.10 Webhook marketplace หรือ pre-built integrations
- 4.11 Event streaming ไปยัง multiple destinations พร้อมกัน
- 4.12 Webhook analytics และ usage metrics (phase 2)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/webhooks` | GET | List all webhook endpoints | Bearer Token |
| `/api/webhooks` | POST | Create new webhook endpoint | Bearer Token |
| `/api/webhooks/:id` | GET | Get webhook endpoint details | Bearer Token |
| `/api/webhooks/:id` | PUT | Update webhook endpoint | Bearer Token |
| `/api/webhooks/:id` | DELETE | Delete webhook endpoint | Bearer Token |
| `/api/webhooks/:id/test` | POST | Send test event to endpoint | Bearer Token |
| `/api/webhooks/:id/logs` | GET | Get delivery logs for endpoint | Bearer Token |

### 5.2 Security Requirements

- SR 5.2.1: ทุก webhook requests ต้องมี `X-Webhook-Signature` header
- SR 5.2.2: Signature สร้างจาก HMAC-SHA256 ของ payload ด้วย secret key
- SR 5.2.3: Webhook endpoints ต้องผ่าน validation ว่าเป็น HTTPS URL
- SR 5.2.4: Rate limiting สำหรับ webhook delivery (max 1000 requests/hour per endpoint)
- SR 5.2.5: จำกัดขนาด payload สูงสุด 1MB per request
- SR 5.2.6: เก็บ logs การเข้าถึง endpoint ไว้ 30 วัน

### 5.3 Frontend Requirements

- FR 5.3.1: Webhook management page ใน admin dashboard
- FR 5.3.2: Form สำหรับสร้าง/แก้ไข endpoint พร้อม validation
- FR 5.3.3: Table แสดงรายการ endpoints พร้อม status (active/inactive)
- FR 5.3.4: Test webhook modal สำหรับส่ง test events
- FR 5.3.5: Logs viewer แสดงประวัติการส่ง webhook
- FR 5.3.6: Toast notifications สำหรับ success/error feedback
- FR 5.3.7: Responsive design สำหรับ mobile devices

## 6. การทดสอบ (Testing)

### 6.1 Unit Testing
- UT 6.1.1: Test webhook creation และ validation logic
- UT 6.1.2: Test signature generation และ verification
- UT 6.1.3: Test retry mechanism และ exponential backoff
- UT 6.1.4: Test event payload formatting สำหรับแต่ละ event type
- UT 6.1.5: Test webhook service business logic

### 6.2 Integration Testing
- IT 6.2.1: Test end-to-end webhook delivery flow
- IT 6.2.2: Test webhook กับ external HTTP mock servers
- IT 6.2.3: Test webhook queue และ background processing
- IT 6.2.4: Test database integration สำหรับ webhook storage
- IT 6.2.5: Test API authentication สำหรับ webhook endpoints

### 6.3 E2E Testing
- E2E 6.3.1: Test user creates webhook และ receives events ใน UI
- E2E 6.3.2: Test webhook delivery สำหรับ user registration flow
- E2E 6.3.3: Test webhook delivery สำหรับ credit depletion flow
- E2E 6.3.4: Test webhook delivery สำหรับ service completion flow
- E2E 6.3.5: Test retry behavior เมื่อ endpoint ไม่ตอบสนอง

## 7. Dependencies และ Assumptions

### 7.1 Dependencies
- D 7.1.1: Authentication Service (FR-1) สำหรับ API authentication
- D 7.1.2: Credit System (FR-3) สำหรับ credit depletion events
- D 7.1.3: Service Management (FR-5) สำหรับ service completion events
- D 7.1.4: User Management สำหรับ user creation events
- D 7.1.5: Message Queue (Redis/RabbitMQ) สำหรับ webhook delivery

### 7.2 Assumptions
- A 7.2.1: External endpoints สามารถรับ POST requests ได้
- A 7.2.2: External endpoints สามารถ process JSON payloads ได้
- A 7.2.3: Network connectivity ระหว่าง Smart AI Hub และ external endpoints เสถียร
- A 7.2.4: External endpoints มีการ implement signature verification ตาม documentation
- A 7.2.5: System resources เพียงพอสำหรับ background webhook processing

## 8. Non-Functional Requirements

### 8.1 Performance
- NFR 8.1.1: Webhook delivery latency < 5 seconds สำหรับ 95% ของ requests
- NFR 8.1.2: รองรับได้ 10,000 webhook deliveries ต่อชั่วโมง
- NFR 8.1.3: Background processing ไม่กระทบประสิทธิภาพหลักของระบบ

### 8.2 Reliability
- NFR 8.2.1: Webhook delivery success rate > 99.5% (หลังจาก retries)
- NFR 8.2.2: System recovery time < 1 minute หลังจาก failure
- NFR 8.2.3: มี monitoring และ alerts สำหรับ webhook failures

### 8.3 Scalability
- NFR 8.3.1: รองรับการเพิ่ม webhook endpoints ได้ไม่จำกัด
- NFR 8.3.2: สามารถ scale webhook processing workers ได้แบบ horizontal
- NFR 8.3.3: Database queries สำหรับ webhook logs มี performance เพียงพอ

## 9. Timeline และ Milestones

### Phase 1 (Week 1-2): Core Webhook Infrastructure
- 9.1.1: Setup webhook service และ database schema
- 9.1.2: Implement basic webhook creation และ management API
- 9.1.3: Implement signature generation และ verification
- 9.1.4: Setup background queue สำหรับ webhook delivery

### Phase 2 (Week 3): UI Development
- 9.2.1: Create webhook management UI pages
- 9.2.2: Implement webhook testing functionality
- 9.2.3: Add webhook delivery logs viewer
- 9.2.4: Integrate with existing admin dashboard

### Phase 3 (Week 4): Testing & Deployment
- 9.3.1: Complete unit, integration และ E2E testing
- 9.3.2: Performance testing และ optimization
- 9.3.3: Security audit สำหรับ webhook system
- 9.3.4: Deploy to production และ monitor initial usage

### Success Metrics
- SM 9.4.1: Webhook delivery success rate > 99.5%
- SM 9.4.2: Average delivery latency < 5 seconds
- SM 9.4.3: Customer adoption rate > 60% ภายใน 3 เดือน
- SM 9.4.4: Developer satisfaction score > 4.5/5