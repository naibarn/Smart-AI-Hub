---
title: 'User Login and Authentication System'
author: 'Development Team'
created_date: '2025-10-15'
last_updated: '2025-10-15'
version: '1.0'
status: 'Approved'
priority: 'P0 - Critical'
related_specs: ['FR-002-Registration', 'FR-003-PasswordReset']
---

# User Login and Authentication System

## 1. ภาพรวม (Overview)

ระบบการล็อกอินและยืนยันตัวตนของผู้ใช้เป็นส่วนสำคัญของแพลตฟอร์ม Smart AI Hub ที่ช่วยให้ผู้ใช้สามารถเข้าถึงบริการต่างๆ ได้อย่างปลอดภัย ระบบนี้รองรับการล็อกอินด้วยอีเมลและรหัสผ่าน รวมถึงการล็อกอินผ่าน Google OAuth

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้ผู้ใช้สามารถเข้าสู่ระบบได้อย่างปลอดภัยและสะดวก
- ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต
- รองรับการล็อกอินหลายช่องทาง (Email/Password และ Google OAuth)
- จัดการ Session และ Token อย่างปลอดภัย

## 3. User Stories

### Story 1: ล็อกอินด้วยอีเมลและรหัสผ่าน

**ในฐานะ** ผู้ใช้งานที่ลงทะเบียนแล้ว  
**ฉันต้องการ** ล็อกอินเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน  
**เพื่อที่จะ** เข้าถึงหน้า Dashboard และใช้งานบริการต่างๆ ของ Smart AI Hub

**Acceptance Criteria:**

- [ ] หน้าล็อกอินต้องมีช่องกรอกอีเมลและรหัสผ่าน
- [ ] ต้องมีปุ่ม "เข้าสู่ระบบ" (Login)
- [ ] เมื่อกรอกข้อมูลถูกต้องและกดปุ่ม ระบบต้องตรวจสอบข้อมูลกับฐานข้อมูล
- [ ] หากข้อมูลถูกต้อง ระบบต้องสร้าง Session/Token และพาผู้ใช้ไปที่หน้า `/dashboard`
- [ ] หากข้อมูลไม่ถูกต้อง ต้องแสดงข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
- [ ] ต้องมีลิงก์ "ลืมรหัสผ่าน?" ที่พาไปหน้า Password Reset
- [ ] ต้องมีลิงก์ "สมัครสมาชิก" สำหรับผู้ใช้ใหม่

### Story 2: ล็อกอินด้วย Google OAuth

**ในฐานะ** ผู้ใช้งานใหม่หรือผู้ใช้งานที่มีบัญชี Google  
**ฉันต้องการ** ล็อกอินด้วยบัญชี Google  
**เพื่อที่จะ** เข้าถึงระบบได้อย่างรวดเร็วโดยไม่ต้องจำรหัสผ่านเพิ่มเติม

**Acceptance Criteria:**

- [ ] หน้าล็อกอินต้องมีปุ่ม "เข้าสู่ระบบด้วย Google"
- [ ] เมื่อคลิกปุ่ม ต้องเปิดหน้าต่างยืนยันตัวตนของ Google
- [ ] หลังจากยืนยันตัวตนสำเร็จ ระบบต้องรับ Token จาก Google
- [ ] ระบบต้องสร้างหรืออัปเดตบัญชีผู้ใช้ในฐานข้อมูล
- [ ] ระบบต้องพาผู้ใช้ไปที่หน้า `/dashboard`
- [ ] หากเกิดข้อผิดพลาด ต้องแสดงข้อความที่เข้าใจง่าย

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การล็อกอินด้วยอีเมลและรหัสผ่าน
- การล็อกอินด้วย Google OAuth
- การจัดการ Session และ JWT Token
- การแสดงข้อความแจ้งเตือนเมื่อล็อกอินผิดพลาด
- การป้องกัน CSRF Attack
- การ Rate Limiting เพื่อป้องกัน Brute Force Attack

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การล็อกอินผ่าน Social Media อื่นๆ (Facebook, Twitter)
- ฟังก์ชัน "จดจำฉันไว้ในระบบ (Remember Me)"
- การยืนยันตัวตนสองปัจจัย (2FA) - จะพัฒนาใน Phase 2
- การล็อกอินด้วย Biometric (ลายนิ้วมือ, ใบหน้า)

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

| Method | Endpoint           | Description               | Request Body                            | Response            |
| ------ | ------------------ | ------------------------- | --------------------------------------- | ------------------- |
| POST   | `/api/auth/login`  | ล็อกอินด้วยอีเมล/รหัสผ่าน | `{ email, password }`                   | `{ token, user }`   |
| POST   | `/api/auth/google` | ล็อกอินด้วย Google OAuth  | `{ googleToken }`                       | `{ token, user }`   |
| POST   | `/api/auth/logout` | ออกจากระบบ                | `{ token }`                             | `{ success: true }` |
| GET    | `/api/auth/me`     | ดึงข้อมูลผู้ใช้ปัจจุบัน   | Header: `Authorization: Bearer {token}` | `{ user }`          |

### 5.2 Security Requirements

- รหัสผ่านต้องถูกเข้ารหัสด้วย **bcrypt** (salt rounds: 10)
- JWT Token ต้องมีอายุ **24 ชั่วโมง**
- ต้องมี **Refresh Token** สำหรับการต่ออายุ Session
- ต้องมี **Rate Limiting**: สูงสุด 5 ครั้งต่อ IP ภายใน 15 นาที
- ต้องมี **CSRF Protection** สำหรับ OAuth Flow

### 5.3 Frontend Requirements

- ใช้ **React Hook Form** สำหรับจัดการฟอร์ม
- ใช้ **Zod** สำหรับ Validation
- ใช้ **Material-UI** สำหรับ UI Components
- ต้องมี **Loading State** ระหว่างรอการตอบกลับจาก API
- ต้องมี **Error Handling** ที่ชัดเจนและเป็นมิตรกับผู้ใช้

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบการเข้ารหัสรหัสผ่านด้วย bcrypt
- [ ] ทดสอบการสร้างและตรวจสอบ JWT Token
- [ ] ทดสอบการ Validate ข้อมูล Input

### 6.2 Integration Tests

- [ ] ทดสอบ API `/api/auth/login` กับกรณีต่างๆ (สำเร็จ, ผิดพลาด)
- [ ] ทดสอบ OAuth Flow กับ Google
- [ ] ทดสอบการทำงานของ Rate Limiting

### 6.3 E2E Tests

- [ ] ทดสอบการล็อกอินผ่าน UI จนถึงหน้า Dashboard
- [ ] ทดสอบการแสดงข้อความแจ้งเตือนเมื่อล็อกอินผิดพลาด
- [ ] ทดสอบการล็อกอินด้วย Google OAuth ผ่าน UI

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- ระบบต้องการ **PostgreSQL Database** สำหรับจัดเก็บข้อมูลผู้ใช้
- ต้องมี **Google OAuth Client ID และ Secret** ที่ถูกต้อง
- ต้องมี **Redis** สำหรับจัดเก็บ Session (Optional แต่แนะนำ)

### 7.2 Assumptions

- ผู้ใช้ต้องยืนยันอีเมลก่อนที่จะสามารถล็อกอินได้ (ตาม Spec FR-002)
- ระบบจะทำงานบน HTTPS ในสภาพแวดล้อม Production

## 8. Non-Functional Requirements

### 8.1 Performance

- API Response Time ต้องไม่เกิน **200ms** (P95)
- หน้าล็อกอินต้องโหลดเสร็จภายใน **2 วินาที**

### 8.2 Availability

- ระบบต้องมี Uptime อย่างน้อย **99.5%**

### 8.3 Usability

- หน้าล็อกอินต้องใช้งานได้บนอุปกรณ์มือถือ (Responsive Design)
- ต้องรองรับ Screen Reader สำหรับผู้พิการทางสายตา (WCAG 2.1 Level AA)

## 9. Risks และ Mitigation

| Risk                      | Impact   | Probability | Mitigation Strategy                                 |
| ------------------------- | -------- | ----------- | --------------------------------------------------- |
| Google OAuth Service Down | High     | Low         | ให้ผู้ใช้สามารถล็อกอินด้วยอีเมล/รหัสผ่านได้เสมอ     |
| Brute Force Attack        | High     | Medium      | ใช้ Rate Limiting และ CAPTCHA หลังจากพยายาม 3 ครั้ง |
| Token Leakage             | Critical | Low         | ใช้ HTTPS, HttpOnly Cookies, และ Short-lived Tokens |

## 10. Timeline และ Milestones

| Milestone             | Target Date | Status      |
| --------------------- | ----------- | ----------- |
| API Development       | 2025-10-18  | In Progress |
| Frontend UI           | 2025-10-20  | Not Started |
| Testing               | 2025-10-22  | Not Started |
| Production Deployment | 2025-10-25  | Not Started |

## 11. Sign-off

| Role          | Name | Date | Signature |
| ------------- | ---- | ---- | --------- |
| Product Owner | -    | -    | Pending   |
| Tech Lead     | -    | -    | Pending   |
| QA Lead       | -    | -    | Pending   |

---

**หมายเหตุ:** เอกสารนี้เป็น Living Document และจะถูกอัปเดตตามความจำเป็น การเปลี่ยนแปลงใดๆ ต้องผ่านการอนุมัติจาก Product Owner และ Tech Lead
