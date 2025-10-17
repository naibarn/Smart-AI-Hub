---
title: "OpenAI Agents Marketplace & Library"
author: "Manus AI"
created_date: "2025-10-17"
last_updated: "2025-10-17"
version: "1.0"
status: "Draft"
priority: "P1 - High"
related_specs: ["PointsSystem", "SubscriptionPlans"]
---

# OpenAI Agents Marketplace & Library Specification

## 1. ภาพรวม (Overview)

เอกสารนี้ระบุข้อกำหนดสำหรับฟีเจอร์ใหม่ "OpenAI Agents Marketplace & Library" ภายในระบบ Smart AI Hub ซึ่งเป็นระบบที่ให้ผู้ใช้สามารถเข้าถึงและใช้งานชุดของ Agent Flows ที่สร้างไว้ล่วงหน้า (pre-built) ผ่าน OpenAI API ได้ โดยระบบจะทำงานแบบ Read-only คือผู้ใช้สามารถเลือกใช้ Agent ที่มีในคลังได้เท่านั้น แต่ไม่สามารถสร้างหรือแก้ไขได้เอง

ฟีเจอร์หลักคือการผนวกรวมกับระบบเครดิต (Credits/Points) ที่มีอยู่ของ Smart AI Hub โดยจะมีการคิดค่าบริการจากการใช้งาน Token ของ OpenAI พร้อมบวกส่วนเพิ่ม (Markup) ที่ผู้ดูแลระบบสามารถปรับเปลี่ยนได้ (เริ่มต้นที่ 15-20%) เพื่อสร้างรายได้ให้กับแพลตฟอร์ม

## 2. วัตถุประสงค์ (Objectives)

- **สร้างคลังเครื่องมือ AI:** จัดหาชุด Agent Flows ที่มีประโยชน์และพร้อมใช้งานให้แก่ผู้ใช้ Smart AI Hub
- **สร้างรายได้:** Implement ระบบการคิดค่าบริการแบบ Pay-per-use โดยใช้เครดิตของผู้ใช้ พร้อม Markup ที่สามารถปรับได้
- **ควบคุมการเข้าถึง:** จำกัดการเข้าถึงและการใช้งานเฉพาะผู้ใช้ที่ลงทะเบียนและมีเครดิตเพียงพอในระบบ Smart AI Hub เท่านั้น
- **การบริหารจัดการ:** สร้างเครื่องมือสำหรับผู้ดูแลระบบ (Admin) เพื่อใช้ในการปรับแต่งเปอร์เซ็นต์ Markup ได้

## 3. User Stories

### Story 1: การเรียกดูและใช้งาน Agent

**ในฐานะ** ผู้ใช้งาน Smart AI Hub ที่มีเครดิต  
**ฉันต้องการ** เรียกดูรายการ Agent ที่มีใน Marketplace, อ่านคำอธิบาย, และสั่งรัน Agent ที่ต้องการพร้อมใส่ Input ที่จำเป็น  
**เพื่อที่จะ** ได้ผลลัพธ์จาก Agent มาใช้ในงานของฉัน และยอมรับการหักเครดิตตามการใช้งานจริง

**Acceptance Criteria:**
- [ ] มีหน้า UI สำหรับแสดงรายการ Agent ทั้งหมดในรูปแบบ Card/List View
- [ ] แต่ละ Agent ต้องแสดงชื่อ, คำอธิบายสั้นๆ, และอาจมีไอคอนหรือหมวดหมู่
- [ ] เมื่อคลิกที่ Agent จะสามารถดูรายละเอียดเพิ่มเติม, ตัวอย่าง Input/Output, และอัตราการใช้เครดิตโดยประมาณได้
- [ ] มีฟอร์มสำหรับกรอกข้อมูล Input สำหรับ Agent นั้นๆ
- [ ] มีปุ่ม "Run Agent" เพื่อเริ่มการทำงาน
- [ ] ก่อนการรัน ระบบควรแสดงการยืนยันการหักเครดิต (หรือแจ้งเตือนหากเครดิตไม่พอ)
- [ ] หลังจาก Agent ทำงานเสร็จสิ้น ผลลัพธ์จะถูกแสดงบนหน้าจอ
- [ ] ประวัติการใช้งานและค่าใช้จ่ายต้องถูกบันทึกไว้ในหน้าประวัติการใช้เครดิตของผู้ใช้

### Story 2: การ Submit Agent ใหม่โดย Organization/Agency

**ในฐานะ** ผู้ใช้ที่เป็นสมาชิกของ Organization หรือ Agency  
**ฉันต้องการ** สร้างและ submit Agent Flow ใหม่เข้าสู่ระบบ พร้อมกำหนดสิทธิ์การมองเห็นและการใช้งาน  
**เพื่อที่จะ** แชร์เครื่องมือ AI ที่มีประโยชน์ให้กับทีมหรือลูกค้าของฉัน และสร้างรายได้จากการใช้งาน

**Acceptance Criteria:**
- [ ] มีหน้า UI "Create Agent" สำหรับกรอกข้อมูล Agent (ชื่อ, คำอธิบาย, category, icon)
- [ ] มีส่วนสำหรับอัปโหลดหรือกรอก Flow Definition (JSON/YAML)
- [ ] มีส่วนกำหนด Input Schema และตัวอย่าง Input/Output
- [ ] สามารถเลือก Visibility Level: `private` (เฉพาะตัวเอง), `organization` (ทั้ง org), `agency` (ทั้ง agency), `public` (ทุกคน)
- [ ] สามารถเลือก Execution Config (method, provider, streaming, timeout)
- [ ] หลังจาก submit ระบบต้องแสดงสถานะ "Pending Approval"
- [ ] ผู้สร้างสามารถทดสอบ Agent ในโหมด "Test Mode" ได้ทันทีโดยไม่ต้องรอ approve
- [ ] มีหน้าแสดง "My Agents" เพื่อดูสถานะ Agent ที่ submit ไว้ (Draft, Pending, Approved, Rejected)

### Story 3: การทดสอบ Agent ก่อน Approve

**ในฐานะ** ผู้สร้าง Agent  
**ฉันต้องการ** ทดสอบ Agent ที่ฉันสร้างขึ้นในโหมด Test Mode  
**เพื่อที่จะ** ตรวจสอบว่า Agent ทำงานถูกต้องก่อนที่จะถูก approve และเปิดให้ผู้อื่นใช้งาน

**Acceptance Criteria:**
- [ ] Agent ที่ยัง Pending Approval จะมีปุ่ม "Test Agent" ให้ผู้สร้างคลิกได้
- [ ] โหมด Test จะใช้เครดิตของผู้สร้างเอง
- [ ] ผลลัพธ์การทดสอบจะแสดงข้อมูล usage, cost, และ response time
- [ ] มี log การทดสอบให้ดูย้อนหลังได้
- [ ] สามารถแก้ไข Agent และทดสอบใหม่ได้หลายครั้งก่อน submit อีกครั้ง

### Story 4: การ Approve/Reject Agent โดย Admin

**ในฐานะ** ผู้ดูแลระบบ (Admin)  
**ฉันต้องการ** ตรวจสอบและ approve/reject Agent ที่ถูก submit เข้ามา  
**เพื่อที่จะ** ควบคุมคุณภาพและความปลอดภัยของ Agent ที่แสดงใน Marketplace

**Acceptance Criteria:**
- [ ] มีหน้า "Agent Approval Queue" แสดงรายการ Agent ที่รอการ approve
- [ ] สามารถดูรายละเอียดของ Agent, Flow Definition, และผลการทดสอบได้
- [ ] สามารถทดสอบ Agent ในโหมด Admin Test ได้
- [ ] มีปุ่ม "Approve" และ "Reject" พร้อมช่องกรอกเหตุผล (สำหรับ Reject)
- [ ] เมื่อ Approve แล้ว Agent จะปรากฏใน Marketplace ตาม Visibility Level ที่กำหนด
- [ ] เมื่อ Reject ผู้สร้างจะได้รับ notification พร้อมเหตุผล
- [ ] มี log การ approve/reject ทั้งหมด

### Story 5: การเข้าดู Public Marketplace โดยไม่ต้อง Login

**ในฐานะ** ผู้เยี่ยมชมเว็บไซต์ (Guest)  
**ฉันต้องการ** เรียกดูรายการ Agent ที่มีใน Public Marketplace และอ่านรายละเอียด  
**เพื่อที่จะ** ทำความเข้าใจว่า Smart AI Hub มี Agent อะไรบ้างก่อนตัดสินใจสมัครสมาชิก

**Acceptance Criteria:**
- [ ] หน้า Marketplace สามารถเข้าถึงได้โดยไม่ต้อง login (URL: `/marketplace` หรือ `/agents`)
- [ ] แสดงเฉพาะ Agent ที่มี visibility = `public` และ status = `approved`
- [ ] สามารถดูรายละเอียด Agent, ตัวอย่าง Input/Output, ราคาโดยประมาณได้
- [ ] มีปุ่ม "Try Agent" แต่เมื่อคลิกจะแสดง popup "Please login to use this agent"
- [ ] มีปุ่ม "Sign Up" และ "Login" ที่เด่นชัด
- [ ] UI ต้องสวยงาม, ทันสมัย, responsive (mobile-friendly)
- [ ] มี search และ filter ตาม category

### Story 6: การจัดการ Markup โดย Admin

**ในฐานะ** ผู้ดูแลระบบ (Admin)  
**ฉันต้องการ** ตั้งค่าและปรับเปลี่ยนเปอร์เซ็นต์ Markup ที่จะบวกเพิ่มเข้าไปในค่าใช้จ่าย Token ของ OpenAI  
**เพื่อที่จะ** ควบคุมนโยบายราคาและสร้างผลกำไรให้กับแพลตฟอร์ม

**Acceptance Criteria:**
- [ ] ใน Admin Dashboard ต้องมีเมนูสำหรับจัดการ "Agents Marketplace Settings"
- [ ] ต้องมีช่องสำหรับกรอกค่า Markup เป็นเปอร์เซ็นต์ (เช่น 15, 20, 25)
- [ ] ระบบต้อง Validate Input ให้เป็นตัวเลขในช่วงที่เหมาะสม (เช่น 0-200%)
- [ ] หลังจากกดบันทึก ค่า Markup ใหม่จะมีผลกับการใช้งาน Agent ครั้งถัดไปทันที
- [ ] ต้องมีการบันทึก Log การเปลี่ยนแปลงค่า Markup ว่าใครเป็นผู้เปลี่ยน, เปลี่ยนเมื่อไหร่, จากค่าเก่าเป็นค่าใหม่

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)
- การสร้างหน้า UI สำหรับแสดงและใช้งาน Agent
- **ระบบ Submit Agent** โดย User/Organization/Agency พร้อม UI สำหรับสร้าง Agent
- **ระบบ Approval Workflow** สำหรับ Admin ตรวจสอบและ approve/reject Agent
- **ระบบสิทธิ์การมองเห็น** (Visibility): Private, Organization, Agency, Public
- **Test Mode** สำหรับผู้สร้าง Agent ทดสอบก่อน approve
- **Public Marketplace** ที่เข้าดูได้โดยไม่ต้อง login (แต่ใช้งานต้อง login)
- **เอกสารแนวทางการสร้าง Agent** (Guidelines, Requirements, Best Practices)
- การเชื่อมต่อกับ OpenAI API เพื่อรัน Agent Flows
- การคำนวณค่าใช้จ่าย Token จาก OpenAI
- การนำค่า Markup ที่ Admin กำหนดมาคำนวณเพิ่มในค่าใช้จ่าย
- การหักเครดิตจากบัญชีผู้ใช้ผ่าน `credit.service` ที่มีอยู่
- การสร้าง API Endpoints สำหรับการจัดการ Agent และการตั้งค่า Markup
- การเพิ่มตารางในฐานข้อมูลเพื่อจัดเก็บข้อมูล Agent และการตั้งค่า
- การป้องกันการใช้งานจากผู้ใช้ที่ไม่มีสิทธิ์
- **Modern & Friendly UI/UX** ที่ใช้งานง่าย เข้าใจไม่ยาก responsive design

### 4.2 นอกขอบเขตงาน (Out of Scope)
- ระบบ Rating, Review, หรือ Comments สำหรับ Agent (พิจารณาใน Phase 3)
- ระบบ Revenue Sharing สำหรับผู้สร้าง Agent (พิจารณาใน Phase 3)
- การเชื่อมต่อกับ AI Provider อื่นๆ นอกจาก OpenAI (พิจารณาใน Phase 2)
- การ Export หรือแชร์ผลลัพธ์จาก Agent ไปยังระบบภายนอก
- Agent Versioning และ Rollback (พิจารณาใน Phase 3)
- Advanced Analytics Dashboard สำหรับผู้สร้าง Agent

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Agent Execution Methods

ระบบรองรับการเรียกใช้ Agent Flow หลายวิธีเพื่อความยืดหยุ่นและรองรับการพัฒนาในอนาคต:

#### แนวทางที่แนะนำ: Hybrid Approach (MCP + Direct API)

ใช้ **MCP Server** เป็น orchestration layer หลัก ร่วมกับ **Direct OpenAI API** สำหรับ execution และมี **REST API** เป็น fallback option

**สถาปัตยกรรม:**
```
Frontend/App
    ↓
MCP Server (WebSocket)
  - Authentication & Authorization
  - Credit Validation & Deduction
  - Agent Flow Orchestration
  - Usage Logging & Analytics
    ↓
OpenAI API (Direct) / Claude API / Custom APIs
```

**วิธีการที่รองรับ:**

| Method | Protocol | Use Case | Priority |
|--------|----------|----------|----------|
| **MCP (WebSocket)** | WebSocket | Real-time agents, streaming, interactive flows | Primary |
| **REST API** | HTTP/REST | Simple agents, batch processing, external integrations | Secondary |
| **Direct OpenAI** | OpenAI SDK | OpenAI-specific features (Assistants API, Vision, Tools) | Backend |
| **Serverless** | Cloud Run/Functions | Background jobs, scheduled tasks, resource-intensive agents | Future |

**Execution Configuration:**

แต่ละ Agent สามารถกำหนด execution config ได้:

```typescript
interface AgentExecutionConfig {
  method: 'mcp' | 'rest' | 'direct' | 'serverless';
  provider: 'openai' | 'claude' | 'auto';
  streaming: boolean;
  timeout: number; // milliseconds
  retryPolicy?: {
    maxRetries: number;
    backoff: 'exponential' | 'linear';
  };
  webhookUrl?: string; // for async execution
}
```

**ข้อดีของแนวทาง Hybrid:**
- ใช้ประโยชน์จาก MCP Server ที่มีอยู่แล้ว (authentication, credits, logging)
- รองรับ real-time streaming และ WebSocket
- ยืดหยุ่นรองรับ OpenAI features ใหม่ๆ
- รองรับ multi-provider (OpenAI, Claude, custom)
- มี REST API fallback สำหรับความเข้ากันได้

### 5.2 Database Schema

**ตารางใหม่: `Agent`**
- `id`: `String` (Primary Key, e.g., `cuid()`)
- `name`: `String`
- `description`: `String` (คำอธิบายสั้นๆ)
- `longDescription`: `String?` (คำอธิบายแบบยาว รองรับ Markdown)
- `flowDefinition`: `Json` (เก็บโครงสร้างของ Agent Flow ในรูปแบบ YAML/JSON)
- `inputSchema`: `Json` (ระบุ Schema ของ Input ที่ Agent ต้องการ)
- `exampleInput`: `Json?` (ตัวอย่าง Input)
- `exampleOutput`: `String?` (ตัวอย่าง Output)
- `executionConfig`: `Json` (กำหนดวิธีการ execute Agent - method, provider, streaming, timeout)
- `category`: `String` (หมวดหมู่ของ Agent เช่น "Finance", "Marketing", "Development")
- `iconUrl`: `String?` (URL ของไอคอน Agent)
- **`previewImages`: `String[]`** (Array ของ URL รูปภาพ preview)
- **`videoUrl`: `String?`** (YouTube video URL สำหรับ demo/tutorial)
- `tags`: `String[]` (Array ของ tags สำหรับการค้นหา)
- **`type`: `Enum` (`AGENT_FLOW`, `CUSTOM_GPT`, `GEMINI_GEM`)** - ประเภทของ Agent
- **`externalUrl`: `String?`** - URL สำหรับ Custom GPT หรือ Gemini Gem
- **`visibility`: `Enum` (`PRIVATE`, `ORGANIZATION`, `AGENCY`, `PUBLIC`)** - กำหนดสิทธิ์การมองเห็น
- **`status`: `Enum` (`DRAFT`, `PENDING`, `APPROVED`, `REJECTED`)** - สถานะการ approve
- **`createdBy`: `String` (Foreign Key to `User`)** - ผู้สร้าง Agent
- **`organizationId`: `String?` (Foreign Key to `Organization`)** - หากเป็น Agent ของ Organization
- **`agencyId`: `String?` (Foreign Key to `Agency`)** - หากเป็น Agent ของ Agency
- **`approvedBy`: `String?` (Foreign Key to `User`)** - Admin ที่ approve
- **`approvedAt`: `DateTime?`** - วันที่ approve
- **`rejectionReason`: `String?`** - เหตุผลการ reject
- `isActive`: `Boolean` (Default: `true`) - สามารถ disable Agent ได้โดยไร้ได้ delete
- `createdAt`: `DateTime`
- `updatedAt`: `DateTime`

**ตารางใหม่: `AgentSetting`**
- `id`: `String` (Primary Key)
- `key`: `String` (Unique, e.g., `"openai_markup_percentage"`)
- `value`: `String`
- `updatedAt`: `DateTime`

**ตารางใหม่: `AgentApprovalLog`**
- `id`: `String` (Primary Key)
- `agentId`: `String` (Foreign Key to `Agent`)
- `adminId`: `String` (Foreign Key to `User` - Admin ที่ทำการ approve/reject)
- `action`: `Enum` (`APPROVED`, `REJECTED`)
- `reason`: `String?` (เหตุผล สำหรับ reject)
- `createdAt`: `DateTime`

**ตารางใหม่: `AgentUsageLog`**
- `id`: `String` (Primary Key)
- `userId`: `String` (Foreign Key to `User`)
- `agentId`: `String` (Foreign Key to `Agent`)
- `promptTokens`: `Int`
- `completionTokens`: `Int`
- `totalTokens`: `Int`
- `baseCostUsd`: `Decimal` (ค่าใช้จ่ายจริงจาก OpenAI)
- `markupPercentage`: `Decimal`
- `finalCostUsd`: `Decimal` (ค่าใช้จ่ายหลังบวก Markup)
- `creditsDeducted`: `Decimal`
- `isTestMode`: `Boolean` (Default: `false`) - บันทึกว่าเป็นการทดสอบหรือไม่
- `createdAt`: `DateTime`

**หมายเหตุ:**
- ตาราง `Organization` และ `Agency` สมมุติว่ามีอยู่แล้วในระบบ Smart AI Hub
- หากยังไม่มี อาจเพิ่มตารางเหล่านี้ใน Phase 1 และใช้ `organizationId` และ `agencyId` เป็น `null` ไปก่อน

### 5.3 Billing & Markup Logic

1.  **Get Base Cost:** หลังจากรัน Agent และได้รับ Response จาก OpenAI, ดึงค่า `usage.total_tokens` มาคำนวณค่าใช้จ่ายพื้นฐาน (Base Cost) ตามเรตของโมเดลที่ใช้
    `baseCostUsd = (prompt_tokens * INPUT_RATE_USD) + (completion_tokens * OUTPUT_RATE_USD)`

2.  **Get Markup:** ดึงค่า `openai_markup_percentage` จากตาราง `AgentSetting`
    `markup = Decimal(setting.value) / 100`

3.  **Calculate Final Cost:**
    `finalCostUsd = baseCostUsd * (1 + markup)`

4.  **Convert to Credits:** แปลง `finalCostUsd` เป็นจำนวนเครดิตที่จะหัก โดยใช้เรตการแปลงจากระบบ Subscription/Credit ที่มีอยู่
    `creditsToDeduct = finalCostUsd * getCreditConversionRate()`

5.  **Deduct Credits:** เรียกใช้ฟังก์ชัน `creditService.deduct()` เพื่อหักเครดิตจากบัญชีผู้ใช้

### 5.4 Backend API Endpoints

#### REST API Endpoints

สำหรับ client ที่ไม่รองรับ WebSocket:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **Public Marketplace** |
| GET    | `/api/public/agents` | ดึงรายการ Agent ที่ public (visibility=PUBLIC, status=APPROVED) | `None` |
| GET    | `/api/public/agents/{agentId}` | ดูรายละเอียด Agent ที่ public | `None` |
| **User Endpoints** |
| GET    | `/api/agents` | ดึงรายการ Agent ที่ผู้ใช้สามารถเข้าถึงได้ (ตาม visibility) | `User` |
| GET    | `/api/agents/{agentId}` | ดึงรายละเอียดของ Agent หนึ่งตัว | `User` |
| POST   | `/api/agents/{agentId}/run` | สั่งรัน Agent | `User` |
| POST   | `/api/agents/{agentId}/test` | ทดสอบ Agent ในโหมด Test Mode | `User` (creator only) |
| GET    | `/api/agents/my` | ดึงรายการ Agent ที่ผู้ใช้สร้าง | `User` |
| **Agent Submission** |
| POST   | `/api/agents` | สร้าง Agent ใหม่ (status=DRAFT) | `User` |
| PUT    | `/api/agents/{agentId}` | แก้ไข Agent | `User` (creator only) |
| POST   | `/api/agents/{agentId}/submit` | Submit Agent เพื่อขอ approve (status=PENDING) | `User` (creator only) |
| DELETE | `/api/agents/{agentId}` | ลบ Agent (เฉพาะ DRAFT/REJECTED) | `User` (creator only) |
| **Admin Endpoints** |
| GET    | `/api/admin/agents/pending` | ดึงรายการ Agent ที่รอ approve (status=PENDING) | `Admin` |
| POST   | `/api/admin/agents/{agentId}/approve` | Approve Agent | `Admin` |
| POST   | `/api/admin/agents/{agentId}/reject` | Reject Agent พร้อมเหตุผล | `Admin` |
| GET    | `/api/admin/agent-settings` | ดึงค่า Settings ของ Agent Marketplace | `Admin` |
| PUT    | `/api/admin/agent-settings` | อัปเดตค่า Settings (markup percentage) | `Admin` |

#### MCP WebSocket Protocol

สำหรับ real-time execution และ streaming:

**Connection:**
```
ws://localhost:3003?token=<JWT_TOKEN>
```

**Request Message:**
```json
{
  "id": "req-123",
  "type": "agent_flow",
  "agentId": "finance-advisor",
  "input": {
    "question": "What is the current stock price of AAPL?"
  },
  "stream": true
}
```

**Response Messages:**
```json
// Progress update
{
  "id": "req-123",
  "type": "progress",
  "step": "Fetching stock data...",
  "timestamp": "2025-10-17T10:30:00.000Z"
}

// Final result
{
  "id": "req-123",
  "type": "done",
  "data": "The current stock price of AAPL is $175.23",
  "usage": {
    "promptTokens": 45,
    "completionTokens": 28,
    "totalTokens": 73
  },
  "cost": {
    "baseCostUsd": 0.00146,
    "markupPercentage": 15,
    "finalCostUsd": 0.00168,
    "creditsDeducted": 1.68
  },
  "timestamp": "2025-10-17T10:30:05.000Z"
}
```

### 5.5 Agent Flow Definition Example

```json
{
  "id": "finance-advisor",
  "name": "Financial Advisor Agent",
  "description": "AI-powered financial advisor for stock analysis and investment advice",
  "category": "Finance",
  "executionConfig": {
    "method": "mcp",
    "provider": "openai",
    "streaming": true,
    "timeout": 30000,
    "retryPolicy": {
      "maxRetries": 3,
      "backoff": "exponential"
    }
  },
  "flowDefinition": {
    "model": "gpt-4o",
    "systemPrompt": "You are a professional financial advisor. Provide accurate, data-driven investment advice.",
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_stock_price",
          "description": "Get current stock price and basic information",
          "parameters": {
            "type": "object",
            "properties": {
              "symbol": {
                "type": "string",
                "description": "Stock ticker symbol (e.g., AAPL, GOOGL)"
              }
            },
            "required": ["symbol"]
          }
        }
      }
    ]
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "question": {
        "type": "string",
        "description": "Your financial question or request"
      }
    },
    "required": ["question"]
  },
  "isActive": true
}
```

## 6. การทดสอบ (Testing Criteria)

- **Unit Tests:**
  - [ ] ทดสอบฟังก์ชันการคำนวณ `finalCostUsd` ให้ถูกต้องตาม Markup
  - [ ] ทดสอบการแปลง USD เป็น Credits
- **Integration Tests:**
  - [ ] ทดสอบการเรียกใช้ `creditService.deduct()` หลังรัน Agent สำเร็จ
  - [ ] ทดสอบ API Endpoint `/api/agents/{agentId}/run` ต้องล้มเหลวหากเครดิตไม่พอ
  - [ ] ทดสอบ MCP WebSocket connection และ agent execution
  - [ ] ทดสอบ streaming responses ผ่าน WebSocket
  - [ ] ทดสอบ API ของ Admin ต้องปฏิเสธการเข้าถึงจากผู้ใช้ที่ไม่ใช่ Admin
- **E2E Tests:**
  - [ ] ทดสอบ Flow ทั้งหมดตั้งแต่ผู้ใช้เลือก Agent, กรอก Input, รัน, จนเห็นผลลัพธ์ และเครดิตถูกหักอย่างถูกต้อง

## 7. Dependencies และ Assumptions

- **Dependencies:**
  - ต้องมีระบบ User Authentication (JWT) ของ Smart AI Hub อยู่แล้ว
  - ต้องมี `credit.service` สำหรับการจัดการเครดิต
  - ต้องมี MCP Server (WebSocket) สำหรับ real-time execution
  - ต้องมี OpenAI API Key ที่ถูกต้องและจัดเก็บอย่างปลอดภัย
  - ต้องมี Redis สำหรับ connection management และ rate limiting
- **Assumptions:**
  - อัตราแลกเปลี่ยนระหว่าง USD และ Credits ถูกกำหนดไว้ในระบบแล้ว
  - Admin มีหน้า Dashboard สำหรับจัดการระบบอยู่แล้ว

## 8. Non-Functional Requirements

- **Performance:** API `/run` ต้องตอบสนอง (ไม่รวมเวลาที่รอ OpenAI) ภายใน 500ms
- **Security:** ต้องมีการตรวจสอบสิทธิ์ (Authentication) และสิทธิ์การเข้าถึง (Authorization) ในทุก Endpoint
- **Scalability:** สถาปัตยกรรมต้องรองรับการเพิ่ม Agent ใหม่ๆ ในอนาคตได้ง่าย
- **Flexibility:** รองรับ execution methods หลายแบบ (MCP, REST, Direct API, Serverless)
- **Future-proof:** สามารถรองรับ OpenAI features ใหม่ๆ (Assistants API v2+, GPT-5, multi-modal) โดยไม่ต้องเปลี่ยน architecture
- **User Experience:** UI ต้องทันสมัย, ใช้งานง่าย, เข้าใจไม่ยาก, responsive design

## 9. UI/UX Guidelines

### 9.1 หน้า Public Marketplace

**เป้าหมาย:** แสดง Agent ทั้งหมดให้ Guest และ User เลือกใช้

**Layout:**
- **Header:** Logo, Search bar, Category filter, Login/Sign Up buttons
- **Hero Section:** Banner แนะนำ Agent ยอดนิยม หรือ Featured Agents
- **Category Tabs:** 
  - **All Agents** - แสดงทั้งหมด
  - **Agent Flows** - เฉพาะ type=AGENT_FLOW
  - **Custom GPTs** - เฉพาะ type=CUSTOM_GPT
  - **Gemini Gems** - เฉพาะ type=GEMINI_GEM
- **Agent Grid:** Card layout (3-4 columns บน desktop, 1-2 บน mobile)

**Agent Card ต้องแสดง:**
- Icon/Thumbnail image (200x200px)
- Agent name (ตัวหนาใหญ่, bold)
- Category badge (Finance, Marketing, etc.)
- Type badge (Agent Flow / Custom GPT / Gemini Gem)
- คำอธิบายสั้นๆ (2-3 บรรทัด)
- Tags (สูงสุด 3-4 tags)
- ราคาโดยประมาณ (e.g., "~0.05 credits/use")
- "View Details" button

**Design Principles:**
- ใช้ Modern design system (Tailwind CSS, shadcn/ui, หรือ Material UI)
- Color scheme: Professional, clean, high contrast
- Typography: อ่านง่าย, font size เหมาะสม
- Hover effects: Card ยกขึ้นเล็กน้อยเมื่อ hover
- Loading states: Skeleton screens
- Empty states: แสดงข้อความเมื่อไม่มี Agent

### 9.2 หน้ารายละเอียด Agent (Agent Detail Page)

**Layout:**

```
+----------------------------------------------------------+
|  [< Back to Marketplace]              [Try Agent] [Share]|
+----------------------------------------------------------+
|                                                          |
|  [Icon]  Agent Name                    Type Badge       |
|          Category: Finance             Status: Active   |
|          Tags: #stock #finance #ai                      |
|                                                          |
+----------------------------------------------------------+
|  Description (Markdown/HTML rendered)                    |
|  - รองรับการแสดงผล Markdown: **bold**, *italic*, lists    |
|  - รองรับ HTML อย่างปลอดภัย (sanitized)              |
+----------------------------------------------------------+
|  Preview Images (Carousel/Gallery)                       |
|  [Image 1] [Image 2] [Image 3]                          |
+----------------------------------------------------------+
|  Video Demo (YouTube Embed)                              |
|  [YouTube Video Player]                                  |
+----------------------------------------------------------+
|  Example Input/Output                                    |
|  Input:  { "question": "What is AAPL stock price?" }    |
|  Output: "The current stock price of AAPL is $175.23"   |
+----------------------------------------------------------+
|  Pricing Information                                     |
|  Estimated cost: ~0.05 credits per use                   |
|  Model: GPT-4o                                           |
+----------------------------------------------------------+
|  [Try Agent Button] (Guest: แสดง login prompt)         |
+----------------------------------------------------------+
```

**ความสามารถ:**
- **Markdown Rendering:** ใช้ library เช่น `react-markdown` หรือ `marked.js`
- **HTML Sanitization:** ใช้ `DOMPurify` เพื่อป้องกัน XSS attacks
- **Image Gallery:** Lightbox effect เมื่อคลิกรูปภาพ
- **YouTube Embed:** ใช้ `react-youtube` หรือ iframe embed
- **Responsive:** แสดงผลดีบน mobile และ tablet

### 9.3 หน้าสร้าง Agent (Create/Edit Agent)

**Form Sections:**

1. **Basic Information**
   - Agent Name (required)
   - Short Description (required, max 200 chars)
   - Long Description (Markdown editor with preview)
   - Category (dropdown)
   - Tags (multi-select or comma-separated)

2. **Agent Type Selection**
   - Radio buttons: Agent Flow / Custom GPT / Gemini Gem
   - ถ้าเลือก Custom GPT หรือ Gemini Gem: แสดงช่องกรอก URL

3. **Agent Flow Configuration** (ถ้าเลือก Agent Flow)
   - Flow Definition (JSON/YAML editor with syntax highlighting)
   - Input Schema (JSON editor)
   - Example Input/Output
   - Execution Config (method, provider, streaming, timeout)

4. **External URL** (ถ้าเลือก Custom GPT/Gemini Gem)
   - URL input field
   - Validation: ตรวจสอบว่าเป็น URL ที่ถูกต้อง

5. **Media Assets**
   - Icon Upload (drag & drop, max 2MB)
   - Preview Images Upload (multiple files, max 5 images)
   - YouTube Video URL (optional)

6. **Visibility & Access**
   - Visibility Level: Private / Organization / Agency / Public
   - ถ้าเลือก Organization/Agency: แสดง dropdown เลือก

7. **Actions**
   - "Save as Draft" button
   - "Submit for Approval" button
   - "Test Agent" button (สำหรับ Agent Flow เท่านั้น)

**UX Features:**
- Real-time validation
- Auto-save drafts
- Preview mode
- Help tooltips และ documentation links
- Progress indicator (Step 1/6)

### 9.4 หน้า Admin Approval Queue

**Layout:**
- Table view แสดงรายการ Agent ที่รอ approve
- Columns: Icon, Name, Type, Category, Submitted By, Date, Actions
- Filter: Type, Category, Date range
- Sort: Date (newest first)

**Agent Review Modal:**
- แสดงรายละเอียดครบถ้วน
- "Test Agent" button (สำหรับ Agent Flow)
- แสดง Flow Definition และ Configuration
- "Approve" button (green)
- "Reject" button (red) + text area สำหรับเหตุผล

### 9.5 Component Library

**แนะนำให้ใช้:**
- **shadcn/ui** - Modern React components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Beautiful icons
- **react-markdown** - Markdown rendering
- **DOMPurify** - HTML sanitization
- **react-youtube** - YouTube embed
- **react-dropzone** - File upload
- **Monaco Editor** - Code editor for JSON/YAML

## 10. Agent Submission Guidelines

### 10.1 เอกสารแนวทางสำหรับผโ้้สร้าง Agent

เอกสารนี้จะถูกแสดงบนหน้า UI ในส่วน "Create Agent" และในหน้า Documentation

#### ข้อกำหนดสำหรับ Agent Flow

**1. Flow Definition ต้องถูกต้อง:**
- ระบุ `model` ที่รองรับ (e.g., `gpt-4o`, `gpt-4o-mini`)
- ระบุ `systemPrompt` ที่ชัดเจน
- ถ้าใช้ `tools` ต้องระบุ function schema ที่ถูกต้อง

**2. Input Schema ต้องถูกต้อง:**
- ใช้ JSON Schema format
- ระบุ `type`, `properties`, `required` fields
- ให้ `description` ที่ชัดเจนสำหรับแต่ละ field

**3. การคำนวณต้นทุน:**
- Agent จะถูกคิดค่าใช้จ่ายตาม token usage
- ต้นทุน = (prompt_tokens × input_rate + completion_tokens × output_rate) × (1 + markup%)
- ต้องทดสอบให้แน่ใจว่าต้นทุนไม่สูงเกินไป

**4. การทดสอบ:**
- ทดสอบในโหมด Test Mode ก่อน submit
- ตรวจสอบว่า Agent ตอบสนอง Input ได้ถูกต้อง
- ตรวจสอบว่าไม่มี error และการหักเครดิตถูกต้อง

#### ข้อกำหนดสำหรับ Custom GPT

**1. URL Format:**
- ต้องเป็น URL ที่ share ได้จาก ChatGPT
- Format: `https://chat.openai.com/g/g-XXXXX-agent-name`
- ระบบจะ validate URL อัตโนมัติ

**2. ข้อมูลที่ต้องกรอก:**
- ชื่อและคำอธิบายของ Custom GPT
- Category ที่เหมาะสม
- Preview images (สกรีนช็อตของ Custom GPT)
- Video demo (ถ้ามี)

**3. การคิดค่าใช้จ่าย:**
- Custom GPT ไม่มีการหักเครดิตใน Smart AI Hub
- ผู้ใช้จะถูก redirect ไปยัง ChatGPT
- ต้องมี ChatGPT Plus subscription

#### ข้อกำหนดสำหรับ Gemini Gem

**1. URL Format:**
- ต้องเป็น URL ที่ share ได้จาก Google Gemini
- Format: `https://gemini.google.com/gem/XXXXX`
- ระบบจะ validate URL อัตโนมัติ

**2. ข้อมูลที่ต้องกรอก:**
- ชื่อและคำอธิบายของ Gem
- Category ที่เหมาะสม
- Preview images
- Video demo (ถ้ามี)

**3. การคิดค่าใช้จ่าย:**
- Gemini Gem ไม่มีการหักเครดิตใน Smart AI Hub
- ผู้ใช้จะถูก redirect ไปยัง Google Gemini
- ต้องมี Google account

### 10.2 เกณฑ์การ Approve/Reject

**Admin จะพิจารณา:**

1. **ความถูกต้องของข้อมูล:**
   - คำอธิบายชัดเจน ไม่มีข้อความที่หลอกลวง
   - Category และ Tags เหมาะสม
   - มี preview images และ/หรือ video

2. **ความถูกต้องทางเทคนิค (Agent Flow):**
   - Flow Definition ถูกต้องตาม format
   - Input Schema valid
   - ทดสอบแล้วทำงานได้
   - ไม่มี error ในการ execute

3. **ความปลอดภัย:**
   - ไม่มีเนื้อหาที่ไม่เหมาะสม (spam, scam, inappropriate)
   - ไม่ละเมิดนโยบายและข้อกำหนดการใช้งาน
   - URL ถูกต้อง (สำหรับ Custom GPT/Gemini Gem)

**เหตุผลที่อาจ Reject:**
- Flow Definition ไม่ถูกต้อง
- ทดสอบแล้วไม่ทำงาน
- คำอธิบายไม่ชัดเจน
- เนื้อหาไม่เหมาะสม
- URL ไม่ valid หรือเข้าไม่ได้
- ละเมิดนโยบายหรือข้อกำหนด

## 11. Implementation Phases

### Phase 1: Core Implementation (Week 1-2)
- ขยาย MCP Server ให้รองรับ `agent_flow` message type
- สร้าง `AgentFlowExecutor` service ที่ map flow definition → OpenAI API
- Implement database schema (Agent, AgentSetting, AgentUsageLog)
- Implement credit calculation with markup
- เพิ่ม usage logging

### Phase 2: Agent Submission & Approval (Week 3-4)
- เพิ่ม REST endpoints สำหรับ submission (`/api/agents`, `/api/agents/{id}/submit`)
- สร้างหน้า "Create Agent" UI พร้อม form validation
- Implement visibility control (Private, Organization, Agency, Public)
- สร้างหน้า "My Agents" แสดงสถานะ (Draft, Pending, Approved, Rejected)
- สร้างหน้า Admin Approval Queue
- Implement approval/rejection workflow
- ระบบ notification สำหรับผู้สร้าง Agent

### Phase 3: Public Marketplace & UI/UX (Week 5-6)
- สร้างหน้า Public Marketplace (accessible without login)
- Implement category tabs (All, Agent Flows, Custom GPTs, Gemini Gems)
- สร้างหน้า Agent Detail พร้อม Markdown/HTML rendering
- Implement preview images gallery (lightbox)
- Implement YouTube video embed
- ระบบ search และ filter (category, tags, type)
- Responsive design (mobile, tablet, desktop)
- Modern UI components (shadcn/ui, Tailwind CSS)

### Phase 4: Custom GPT & Gemini Gem Support (Week 7-8)
- รองรับ Custom GPT submission (URL validation)
- รองรับ Gemini Gem submission (URL validation)
- Implement redirect logic สำหรับ external URLs
- สร้างเอกสาร Agent Submission Guidelines
- เพิ่มหน้า Documentation/Help
- Admin dashboard สำหรับจัดการ markup

### Phase 5: Advanced Features (Week 9-10)
- รองรับ streaming responses ผ่าน WebSocket
- Multi-step agent flows
- Agent composition (chain multiple agents)
- Background execution with webhook callbacks
- Analytics dashboard สำหรับผู้สร้าง Agent

### Phase 6: Testing & Optimization (Week 11-12)
- Unit tests, integration tests, E2E tests
- Performance optimization
- Security audit (XSS, CSRF, SQL injection)
- Load testing
- Documentation (คู่มือผู้ใช้และ API docs)
- Production deployment

## 10. Future Enhancements

### รองรับ OpenAI Features ใหม่
- **Assistants API v2+**: Threads, persistent conversations, Code Interpreter, File Search
- **GPT-5 และ models ใหม่**: เพียงเพิ่ม model name ใน configuration
- **Multi-modal capabilities**: Vision, audio, video input/output

### รองรับ AI Providers อื่น
- **Claude**: ใช้ MCP orchestration เดิม, เปลี่ยนแค่ provider
- **Gemini**: เพิ่ม provider adapter
- **Custom Models**: รองรับ OpenAI-compatible APIs

### Community Features (Phase 2)
- ให้ผู้ใช้สร้าง Agent ของตัวเอง
- Rating และ Review system
- Agent marketplace with revenue sharing
- Agent templates และ examples

---
**หมายเหตุ:** เอกสารนี้เป็นฉบับร่างและสามารถปรับปรุงได้ตามความเหมาะสม
