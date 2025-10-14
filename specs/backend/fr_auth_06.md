---
title: 'OAuth with Verification Codes System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Draft'
priority: 'P1'
related_specs: ['FR-1', 'FR-2', 'FR-AUTH-05', 'auth_service.md', 'api_gateway.md', 'user.md']
---

# OAuth with Verification Codes System

## 1. ภาพรวม (Overview)

ระบบ OAuth with Verification Codes เป็นส่วนขยายของระบบตรวจสอบสิทธิ์ OAuth ที่ออกแบบมาเพื่อรองรับการเชื่อมต่อกับ Custom GPT Integration โดยเฉพาะ ระบบนี้ทำงานโดยใช้ Verification Codes แทนการใช้ Authorization Code แบบดั้งเดิม ทำให้ผู้ใช้สามารถคัดลอกรหัสยืนยันและนำไปใช้ในบริการของบุคคลที่สามได้อย่างง่าย

ระบบนี้ออกแบบมาเพื่อแก้ไขปัญหาในการเชื่อมต่อกับ Custom GPT ที่ต้องการวิธีการตรวจสอบสิทธิ์ที่ง่ายและตรงไปตรงมา โดยยังคงรักษาความปลอดภัยและรองรับการทำงานร่วมกับระบบ OAuth แบบดั้งเดิมไว้เพื่อความเข้ากันได้แบบย้อนหลัง

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้สามารถตรวจสอบสิทธิ์สำหรับ Custom GPT Integration ได้อย่างง่าย
- รองรับการใช้ Verification Codes แทน Authorization Codes
- อำนวยความสะดวกในการคัดลอกและวางรหัสยืนยัน
- รักษาความเข้ากันได้แบบย้อนหลังกับระบบ OAuth แบบดั้งเดิม
- รองรับการส่งคืนไปยังบริการต่างๆ หลังการตรวจสอบสิทธิ์
- ให้มีประสบการณ์ผู้ใช้ที่ดีในภาษาไทย
- ลดความซับซ้อนในการบูรณาการกับ Custom GPT

## 3. User Stories

### Story 1: ผู้ใช้เชื่อมต่อกับ Custom GPT ผ่าน Verification Code

**ในฐานะ** ผู้ใช้แพลตฟอร์ม  
**ฉันต้องการ** เชื่อมต่อบัญชีของฉันกับ Custom GPT  
**เพื่อที่จะ** ใช้บริการ AI ของ Smart AI Hub ผ่าน Custom GPT

**Acceptance Criteria:**

- [ ] ต้องมีหน้าจอเริ่มต้นการเชื่อมต่อที่ชัดเจน
- [ ] ต้องมีการตรวจสอบสิทธิ์ผ่าน Google OAuth
- [ ] ต้องมีหน้าจอแสดง Verification Code ที่เข้าใจง่าย
- [ ] ต้องมีปุ่มคัดลอกรหัสยืนยัน
- [ ] ต้องมีคำแนะนำในภาษาไทยที่ชัดเจน
- [ ] ต้องมีการนำทางกลับไปยังบริการต้นทาง
- [ ] ต้องมีการแจ้งเตือนเมื่อเชื่อมต่อสำเร็จ

### Story 2: นักพัฒนาบูรณาการกับ Custom GPT

**ในฐานะ** นักพัฒนา Custom GPT  
**ฉันต้องการ** ใช้ Verification Codes เพื่อตรวจสอบสิทธิ์ผู้ใช้  
**เพื่อที่จะ** ให้ผู้ใช้สามารถเชื่อมต่อกับบริการของฉันได้

**Acceptance Criteria:**

- [ ] ต้องมีวิธีการสร้าง Session ID ที่ไม่ซ้ำกัน
- [ ] ต้องมีการส่งผู้ใช้ไปยังหน้าตรวจสอบสิทธิ์พร้อม Session ID
- [ ] ต้องมีวิธีการตรวจสอบ Verification Code
- [ ] ต้องมีการแสดงข้อมูลผู้ใช้สำหรับ Verification Code ที่ถูกต้อง
- [ ] ต้องมีเอกสาร API ที่ชัดเจน
- [ ] ต้องมีตัวอย่างโค้ดสำหรับการบูรณาการ
- [ ] ต้องรองรับการส่งคืนไปยัง URL ต่างๆ

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การเริ่มต้น OAuth ด้วย Session Parameter (OAuth Initiation)
- การสร้าง Verification Codes (Verification Code Generation)
- การแสดง Verification Codes บนหน้าเว็บ (Code Display)
- การจับคู่ Verification Codes กับ Session (Code-Session Mapping)
- การสนับสนุนพารามิเตอร์ Return To (Return To Support)
- การรักษาความเข้ากันได้แบบย้อนหลัง (Backward Compatibility)
- การตรวจสอบ Verification Codes (Code Verification)

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การจัดการ OAuth Scopes แบบซับซ้อน
- การจัดการ Refresh Tokens สำหรับ Verification Codes
- การจัดการ Webhook สำหรับการแจ้งเตือน
- การจัดการ Multi-tenant Authentication
- การจัดการ Device Authorization Flow

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint                    | Description                     | Request Body                      | Response                   |
| ------ | --------------------------- | ------------------------------- | --------------------------------- | -------------------------- |
| GET    | `/auth/oauth/initiate`      | เริ่มต้น OAuth Flow             | Query: `{ session, return_to }`   | `{ redirectUrl }`          |
| GET    | `/auth/oauth/callback`      | รับ Callback จาก OAuth Provider | Query: `{ code, state, session }` | `{ redirectUrl }`          |
| GET    | `/auth/verify/:code`        | ตรวจสอบ Verification Code       | -                                 | `{ user, session, valid }` |
| POST   | `/auth/verify`              | ตรวจสอบ Verification Code       | `{ code }`                        | `{ user, session, valid }` |
| GET    | `/auth/success`             | หน้าแสดง Verification Code      | Query: `{ code }`                 | HTML Page                  |
| GET    | `/auth/sessions/:sessionId` | ดึงข้อมูล Session               | -                                 | `{ session, code }`        |
| DELETE | `/auth/sessions/:sessionId` | ลบ Session                      | -                                 | `{ success }`              |

### 5.2 OAuth Flow with Verification Codes

#### Step 1: Initiation

1. Third-party service สร้าง Session ID ที่ไม่ซ้ำกัน
2. Third-party service ส่งผู้ใช้ไปยัง:
   ```
   https://api.smartaihub.com/auth/google?session={sessionId}&return_to=chatgpt
   ```

#### Step 2: Authentication

1. ผู้ใช้ตรวจสอบสิทธิ์กับ Google OAuth
2. System ตรวจสอบข้อมูลผู้ใช้จาก Google
3. System สร้างหรืออัปเดตข้อมูลผู้ใช้ในระบบ

#### Step 3: Verification Code Generation

1. System สร้าง Verification Code ในรูปแบบ: `VERIFIED-{random_string}`
2. System จับคู่ Verification Code กับ Session ID
3. System จัดเก็บข้อมูลใน Redis พร้อม TTL 7 วัน

#### Step 4: Code Display

1. System ส่งผู้ใช้ไปยังหน้าแสดง Verification Code
2. หน้าเว็บแสดง Verification Code พร้อมปุ่มคัดลอก
3. มีคำแนะนำในภาษาไทยเกี่ยวกับการใช้รหัส

#### Step 5: Code Verification

1. ผู้ใช้คัดลอก Verification Code
2. ผู้ใช้วางรหัสใน Custom GPT
3. Third-party service ส่งรหัยับไปตรวจสอบกับ API
4. System ตรวจสอบและส่งคืนข้อมูลผู้ใช้

### 5.3 Verification Code Format

Verification Codes จะมีรูปแบบดังนี้:

```
VERIFIED-{random_string}
```

โดยที่:

- `VERIFIED` เป็น prefix ที่ระบุว่าเป็น Verification Code
- `random_string` เป็นสตริงสุ่มความยาว 16 ตัวอักษร (A-Z, 0-9)

ตัวอย่าง Verification Code:

```
VERIFIED-A1B2C3D4E5F6G7H8
```

### 5.4 Session Data Structure

ข้อมูล Session ที่จัดเก็บใน Redis:

```json
{
  "sessionId": "session_12345",
  "verificationCode": "VERIFIED-A1B2C3D4E5F6G7H8",
  "userId": "user_67890",
  "clientId": "custom_gpt",
  "returnTo": "chatgpt",
  "createdAt": "2025-10-15T10:00:00Z",
  "expiresAt": "2025-10-22T10:00:00Z",
  "verifiedAt": "2025-10-15T10:05:00Z",
  "metadata": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "integrationType": "custom_gpt"
  }
}
```

### 5.5 Security Requirements

- Verification Codes ต้องถูกสร้างจาก Cryptographically Secure Random Generator
- ต้องมีการจำกัดอายุการใช้งานของ Verification Codes (default: 7 วัน)
- ต้องมีการจำกัดจำนวนครั้งในการตรวจสอบ Verification Code
- ต้องมีการบันทึกการสร้างและการตรวจสอบ Verification Codes
- ต้องมีการป้องกันการเดา Verification Codes
- ต้องมีการตรวจสอบ IP Address สำหรับ Session
- ต้องมีการรักษาความเข้ากันได้กับ OAuth Flow แบบดั้งเดิม

### 5.6 Frontend Requirements

- มีหน้าแสดง Verification Code ที่ใช้งานง่าย
- มีปุ่มคัดลอกรหัสที่ทำงานบนทุกเบราว์เซอร์
- มีคำแนะนำในภาษาไทยที่ชัดเจน
- มีการแสดงความคืบหน้าในการตรวจสอบสิทธิ์
- มีการจัดการข้อผิดพลาดอย่างเหมาะสม
- รองรับการแสดงผลบนอุปกรณ์พกพา

### 5.7 Success Page Design

หน้าแสดง Verification Code ต้องมี:

- หัวข้อ "การเชื่อมต่อสำเร็จ" (ภาษาไทย)
- กล่องแสดง Verification Code ที่ใหญ่ชัด
- ปุ่ม "คัดลอกรหัส" พร้อมไอคอน
- คำแนะนำ: "คัดลอกรหัสนี้และวางใน Custom GPT เพื่อเริ่มใช้งาน"
- ปุ่ม "กลับไปยังแอปพลิเคชัน" ถ้ามี return_to parameter
- ข้อมูลเพิ่มเติม: รหัสนี้จะหมดอายุใน 7 วัน

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการสร้าง Verification Codes
- [ ] ทดสอบการจับคู่ Verification Codes กับ Session
- [ ] ทดสอบการตรวจสอบ Verification Codes
- [ ] ทดสอบการจัดการอายุ Verification Codes
- [ ] ทดสอบการสร้าง Session IDs

### 6.2 Integration Tests

- [ ] ทดสอบ OAuth Flow ทั้งหมด
- [ ] ทดสอบการทำงานร่วมกับ Google OAuth
- [ ] ทดสอบการทำงานร่วมกับ Redis
- [ ] ทดสอบการทำงานร่วมกับระบบจัดการผู้ใช้
- [ ] ทดสอบการบันทึก Audit Log

### 6.3 E2E Tests

- [ ] ทดสอบการเชื่อมต่อกับ Custom GPT ผ่าน UI
- [ ] ทดสอบการคัดลอก Verification Code
- [ ] ทดสอบการตรวจสอบ Verification Code ผ่าน API
- [ ] ทดสอบการนำทางกลับไปยังบริการต้นทาง
- [ ] ทดสอบความเข้ากันได้กับ OAuth Flow แบบดั้งเดิม

### 6.4 Browser Compatibility Tests

- [ ] ทดสอบปุ่มคัดลอกบน Google Chrome
- [ ] ทดสอบปุ่มคัดลอกบน Mozilla Firefox
- [ ] ทดสอบปุ่มคัดลอกบน Safari
- [ ] ทดสอบปุ่มคัดลอกบน Microsoft Edge
- [ ] ทดสอบการแสดงผลบนมือถือ

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ต้องมี Google OAuth 2.0 Credentials
- ต้องมี Redis Server สำหรับจัดเก็บ Session
- ต้องมีระบบจัดการผู้ใช้
- ต้องมีระบบตรวจสอบสิทธิ์หลัก

### 7.2 Assumptions

- ผู้ใช้มีบัญชี Google ที่ถูกต้อง
- บริการของบุคคลที่สามสามารถจัดการ Session IDs ได้
- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production
- ผู้ใช้สามารถคัดลอกและวางข้อความได้

## 8. Non-Functional Requirements

### 8.1 Performance

- การสร้าง Verification Code ต้องทำงานได้ภายใน **100ms**
- การตรวจสอบ Verification Code ต้องทำงานได้ภายใน **100ms**
- ต้องรองรับการตรวจสอบ Verification Code ได้อย่างน้อย **500 ครั้งต่อวินาที**

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.9%**
- ต้องมีระบบสำรองสำหรับ Redis

### 8.3 Security

- ต้องมีการเข้ารหัสข้อมูลที่ละเอียดอ่อน
- ต้องมีการป้องกันการโจมตีทั่วไป
- ต้องมีการบันทึกการสร้างและการตรวจสอบ Verification Codes

## 9. Acceptance Criteria

- Verification Codes มีความเป็นเอกลักษณ์และปลอดภัย
- หน้าแสดงผลสำเร็จเป็นมิตรกับผู้ใช้และใช้ภาษาไทย
- ปุ่มคัดลอกทำงานบนเบราว์เซอร์หลักทั้งหมด
- การจับคู่ Session ถูกสร้างอย่างถูกต้อง
- OAuth Flow แบบดั้งเดิมยังคงทำงานได้
- รองรับพารามิเตอร์ session ใน URL การเริ่มต้น OAuth
- สร้าง Verification Code หลังจากตรวจสอบสิทธิ์สำเร็จ

## 10. Risks และ Mitigation

| Risk                  | Impact   | Probability | Mitigation Strategy                        |
| --------------------- | -------- | ----------- | ------------------------------------------ |
| Code Leakage          | High     | Medium      | มีการจำกัดครั้งในการตรวจสอบและการแจ้งเตือน |
| Session Hijacking     | Critical | Low         | มีการตรวจสอบ IP และ User Agent             |
| OAuth Provider Issues | Medium   | Low         | มีทางเลือกอื่นในการตรวจสอบสิทธิ์           |
| Browser Compatibility | Medium   | Low         | มีการทดสอบบนเบราว์เซอร์หลักทั้งหมด         |

## 11. Timeline และ Milestones

| Milestone                | Target Date | Status      |
| ------------------------ | ----------- | ----------- |
| OAuth Initiation API     | 2025-10-16  | Not Started |
| Verification Code System | 2025-10-18  | Not Started |
| Success Page UI          | 2025-10-20  | Not Started |
| Code Verification API    | 2025-10-22  | Not Started |
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
