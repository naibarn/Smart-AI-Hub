---
title: 'Agent Skills Pricing System with Multi-Platform Support'
author: 'Development Team'
created_date: '2025-10-18'
last_updated: '2025-10-18'
version: '1.0'
status: 'Draft'
priority: 'P1 - High'
related_specs: ['FR-RAG-001-RAG-System', 'FR-SKILLS-001-Marketplace', 'FR-004-Financial-System']
---

# Agent Skills Pricing System with Multi-Platform Support

## 1. ภาพรวม (Overview)

ระบบกำหนดราคาและตัดเครดิตสำหรับ Agent Skills ที่รองรับหลาย platforms (Custom GPT, Gemini Gems, OpenAI Assistants, Claude Agent Skills, Vertex AI Agent Builder) พร้อมการคำนวณค่าใช้จ่ายแบบละเอียด (LLM, RAG, Tool Calls, Nested Agents) และระบบตัดเครดิตแบบ real-time ที่ปลอดภัย

**เทคโนโลยีหลัก**:
- **TypeScript**: ภาษาหลักสำหรับพัฒนา (migrate จาก Java)
- **PostgreSQL**: Database สำหรับ pricing rules และ usage logs
- **Redis**: Caching และ distributed locking
- **Prisma**: ORM สำหรับ database operations

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- รองรับการกำหนดราคาที่ยืดหยุ่นสำหรับ agent platforms และ models หลากหลาย
- คำนวณค่าใช้จ่ายได้แม่นยำแยกตาม components (LLM input/output, RAG, Tool calls, Nested agents)
- ตัดเครดิตแบบ real-time พร้อม reservation mechanism เพื่อป้องกันการใช้งานเกิน balance
- รองรับ nested agent calls และคำนวณค่าใช้จ่ายรวมได้ถูกต้อง
- กำหนด profit margin ได้และไม่ขาดทุน
- ให้ UI สำหรับ admin ในการจัดการราคาได้ง่าย
- แสดง cost breakdown ให้ผู้ใช้เห็นอย่างโปร่งใส

## 3. User Stories

### Story 1: ประมาณการค่าใช้จ่ายก่อนเรียกใช้ Agent (Priority: P1)

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** ทราบค่าใช้จ่ายโดยประมาณก่อนเรียกใช้ agent  
**เพื่อที่จะ** ตัดสินใจว่าจะใช้งานหรือไม่ และตรวจสอบว่ามี credits เพียงพอ

**Why this priority**: ป้องกันผู้ใช้ใช้งานโดยไม่รู้ค่าใช้จ่าย และป้องกัน insufficient balance errors

**Independent Test**: สามารถทดสอบได้โดยเรียก estimation API และตรวจสอบว่าได้ cost breakdown ที่ถูกต้อง

**Acceptance Scenarios**:

```gherkin
Scenario: ประมาณการค่าใช้จ่ายสำหรับ simple agent call
  Given ผู้ใช้มี credits 100 หน่วย
  And เลือกใช้ Claude 3.5 Sonnet
  And ประมาณการ input 1000 tokens และ output 500 tokens
  When เรียก cost estimation API
  Then ระบบแสดง estimated cost breakdown:
    | Component    | Units | Cost (USD) | Credits |
    | LLM Input    | 1000  | 0.003      | 0.3     |
    | LLM Output   | 500   | 0.0075     | 0.75    |
    | Total        | -     | 0.0105     | 1.05    |
  And แสดง user balance: 100 credits
  And แสดง has_enough_balance: true

Scenario: ประมาณการค่าใช้จ่ายสำหรับ agent with RAG
  Given ผู้ใช้มี credits 50 หน่วย
  And เลือกใช้ Claude 3.5 Sonnet with RAG
  And ประมาณการ input 2500 tokens, output 800 tokens, RAG ops 2 ครั้ง
  When เรียก cost estimation API
  Then ระบบแสดง estimated cost breakdown รวม RAG cost
  And แสดง has_enough_balance: true

Scenario: Credits ไม่เพียงพอ
  Given ผู้ใช้มี credits 0.5 หน่วย
  And estimated cost คือ 1.05 credits
  When เรียก cost estimation API
  Then ระบบแสดง has_enough_balance: false
  And แสดงข้อความแนะนำให้เติม credits
```

### Story 2: ตัดเครดิตอัตโนมัติเมื่อใช้งาน Agent (Priority: P1)

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** ให้ระบบตัดเครดิตอัตโนมัติเมื่อใช้งาน agent  
**เพื่อที่จะ** ไม่ต้องจัดการเครดิตด้วยตนเอง และมั่นใจว่าจ่ายตามที่ใช้จริง

**Why this priority**: เป็นฟังก์ชันหลักของระบบ billing

**Independent Test**: สามารถทดสอบได้โดยเรียกใช้ agent และตรวจสอบว่า credits ถูกหักถูกต้อง

**Acceptance Scenarios**:

```gherkin
Scenario: ตัดเครดิตสำเร็จหลังใช้งาน agent
  Given ผู้ใช้มี credits 100 หน่วย
  And เรียกใช้ Claude 3.5 Sonnet
  When agent ทำงานเสร็จและใช้ input 1050 tokens, output 520 tokens
  Then ระบบคำนวณ actual cost = 1.14 credits
  And หัก credits จาก 100 เหลือ 98.86
  And บันทึก usage log พร้อม cost breakdown
  And ส่ง response พร้อม balance_after: 98.86

Scenario: Reserve credits ก่อนเรียกใช้
  Given ผู้ใช้มี credits 10 หน่วย
  And estimated cost คือ 5 credits
  When เริ่มเรียกใช้ agent
  Then ระบบ reserve 5 credits ไว้ก่อน
  And user balance ที่เหลือคือ 5 credits (available)
  When agent ทำงานเสร็จและใช้จริง 4.5 credits
  Then หัก 4.5 credits และคืน 0.5 credits ที่ reserve ไว้
  And user balance สุดท้ายคือ 5.5 credits

Scenario: Refund เมื่อ agent call ล้มเหลว
  Given ผู้ใช้มี credits 100 หน่วย
  And reserve 5 credits ไว้แล้ว
  When agent call ล้มเหลว (error)
  Then ระบบคืน reserved credits ทั้งหมด
  And user balance กลับไปเป็น 100 credits
  And บันทึก usage log status: failed
```

### Story 3: คำนวณค่าใช้จ่ายสำหรับ Nested Agent Calls (Priority: P1)

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** ทราบค่าใช้จ่ายรวมเมื่อ agent เรียกใช้ agents อื่นๆ  
**เพื่อที่จะ** เห็น cost breakdown ที่ชัดเจนและโปร่งใส

**Why this priority**: Nested agent calls เป็นฟีเจอร์สำคัญที่ต้องคำนวณค่าใช้จ่ายถูกต้อง

**Independent Test**: สามารถทดสอบได้โดยเรียกใช้ orchestrator agent ที่เรียก child agents และตรวจสอบ cost breakdown

**Acceptance Scenarios**:

```gherkin
Scenario: Parent agent เรียกใช้ child agents
  Given ผู้ใช้เรียกใช้ orchestrator agent
  When orchestrator agent เรียกใช้:
    - research agent (ใช้ 3.5 credits)
    - writer agent (ใช้ 4.2 credits)
    - reviewer agent (ใช้ 1.0 credits)
  And orchestrator agent เองใช้ 0.8 credits
  Then ระบบคำนวณ total cost = 9.5 credits
  And แสดง cost breakdown:
    | Component              | Credits |
    | Orchestrator (self)    | 0.8     |
    | Nested: Research Agent | 3.5     |
    | Nested: Writer Agent   | 4.2     |
    | Nested: Reviewer Agent | 1.0     |
    | Total                  | 9.5     |
  And หัก credits ทั้งหมด 9.5 จาก user balance

Scenario: Track call depth
  Given parent agent (depth 0)
  When parent เรียก child agent (depth 1)
  And child เรียก grandchild agent (depth 2)
  Then ระบบบันทึก call_depth ในแต่ละ usage log
  And aggregate cost ขึ้นไปยัง parent ทุกระดับ
```

### Story 4: จัดการราคาสำหรับหลาย Platforms (Priority: P1)

**ในฐานะ** Admin  
**ฉันต้องการ** กำหนดและปรับราคาสำหรับ agent platforms และ models ต่างๆ  
**เพื่อที่จะ** ควบคุมต้นทุนและกำไรได้

**Why this priority**: จำเป็นสำหรับการดำเนินธุรกิจที่ไม่ขาดทุน

**Independent Test**: สามารถทดสอบได้โดย admin เข้า pricing dashboard และแก้ไขราคา

**Acceptance Scenarios**:

```gherkin
Scenario: กำหนดราคาสำหรับ model ใหม่
  Given Admin เข้า pricing dashboard
  When เลือก platform "Claude Agent Skills"
  And เลือก model "Claude 3.5 Sonnet"
  And กำหนด pricing rules:
    | Component    | Cost/Unit | Markup | Price/Unit | Credits/Unit |
    | LLM Input    | 0.000003  | 20%    | 0.0000036  | 0.00036      |
    | LLM Output   | 0.000015  | 20%    | 0.0000180  | 0.00180      |
    | RAG Embed    | 0.000000  | 0%     | 0.0010000  | 0.10000      |
    | RAG Search   | 0.000000  | 0%     | 0.0005000  | 0.05000      |
  And บันทึก
  Then ระบบสร้าง pricing rules ใหม่
  And effective_from = วันนี้
  And ผู้ใช้สามารถใช้งาน model นี้ได้ทันที

Scenario: อัปเดตราคาแบบ bulk
  Given Admin มีไฟล์ CSV ที่มีราคาใหม่สำหรับหลาย models
  When upload CSV และกำหนด effective_from = 2025-11-01
  Then ระบบสร้าง pricing rules ใหม่สำหรับทุก models
  And pricing rules เก่ายังใช้งานได้จนถึง 2025-10-31
  And pricing rules ใหม่จะมีผลตั้งแต่ 2025-11-01
```

### Story 5: ดู Cost Breakdown และ Usage History (Priority: P2)

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** ดูประวัติการใช้งานและค่าใช้จ่ายที่ผ่านมา  
**เพื่อที่จะ** ติดตามการใช้งานและวางแผน budget

**Why this priority**: ช่วยให้ผู้ใช้เข้าใจการใช้งานและควบคุมค่าใช้จ่าย

**Independent Test**: สามารถทดสอบได้โดยดูหน้า usage history และตรวจสอบข้อมูล

**Acceptance Scenarios**:

```gherkin
Scenario: ดูประวัติการใช้งานรายวัน
  Given ผู้ใช้เข้าหน้า usage history
  When เลือกดูข้อมูลวันนี้
  Then ระบบแสดงรายการ agent calls ทั้งหมดวันนี้
  And แต่ละรายการแสดง:
    - เวลา
    - Platform และ Model
    - Input/Output tokens
    - Cost breakdown
    - Total credits
  And แสดง summary: Total calls, Total credits used

Scenario: ดู cost breakdown ของ session
  Given ผู้ใช้เรียกใช้ agent หลายครั้งใน session เดียวกัน
  When เข้าดู session cost breakdown
  Then ระบบแสดง:
    - รายการ calls ทั้งหมดใน session
    - Cost ของแต่ละ call
    - Nested calls (ถ้ามี)
    - Total session cost
```

## 4. Technical Specification

### 4.1 Database Schema

#### 4.1.1 AgentPlatform

```prisma
model AgentPlatform {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @unique @db.VarChar(50)
  displayName String   @map("display_name") @db.VarChar(100)
  provider    String   @db.VarChar(50)  // openai, anthropic, google, custom
  isActive    Boolean  @default(true) @map("is_active")
  description String?  @db.Text
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  models      AgentModel[]
  
  @@map("agent_platforms")
}
```

#### 4.1.2 AgentModel

```prisma
model AgentModel {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  platformId   String   @map("platform_id") @db.Uuid
  name         String   @db.VarChar(100)
  displayName  String   @map("display_name") @db.VarChar(150)
  modelType    String   @map("model_type") @db.VarChar(50)  // llm, embedding, vision, audio
  isActive     Boolean  @default(true) @map("is_active")
  capabilities Json     @default("{}")  // { "rag": true, "tools": true, "vision": true }
  metadata     Json     @default("{}")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  platform     AgentPlatform @relation(fields: [platformId], references: [id], onDelete: Cascade)
  pricingRules PricingRule[]
  usageLogs    AgentUsageLog[]
  
  @@unique([platformId, name])
  @@map("agent_models")
}
```

#### 4.1.3 PricingRule

```prisma
model PricingRule {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  modelId         String   @map("model_id") @db.Uuid
  componentType   String   @map("component_type") @db.VarChar(50)
  unitType        String   @map("unit_type") @db.VarChar(50)
  costPerUnit     Decimal  @map("cost_per_unit") @db.Decimal(12, 8)
  markupPercent   Decimal  @map("markup_percent") @db.Decimal(5, 2)
  pricePerUnit    Decimal  @map("price_per_unit") @db.Decimal(12, 8)
  creditsPerUnit  Decimal  @map("credits_per_unit") @db.Decimal(12, 4)
  minUnits        Int?     @map("min_units")
  tierMultiplier  Decimal  @default(1.0) @map("tier_multiplier") @db.Decimal(3, 2)
  isActive        Boolean  @default(true) @map("is_active")
  effectiveFrom   DateTime @map("effective_from")
  effectiveTo     DateTime? @map("effective_to")
  metadata        Json     @default("{}")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  model           AgentModel @relation(fields: [modelId], references: [id], onDelete: Cascade)
  
  @@index([modelId, componentType, isActive])
  @@index([effectiveFrom, effectiveTo])
  @@map("pricing_rules")
}
```

**Component Types**:
- `llm_input` - LLM input tokens
- `llm_output` - LLM output tokens
- `rag_embedding` - RAG embedding generation
- `rag_search` - RAG vector search
- `tool_call` - Tool/Function calls
- `storage` - Storage costs

**Unit Types**:
- `token` - Per token
- `request` - Per request
- `gb` - Per gigabyte
- `call` - Per call

#### 4.1.4 AgentUsageLog

```prisma
model AgentUsageLog {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String   @map("user_id") @db.Uuid
  agentId           String?  @map("agent_id") @db.Uuid
  platformId        String   @map("platform_id") @db.Uuid
  modelId           String   @map("model_id") @db.Uuid
  sessionId         String?  @map("session_id") @db.Uuid
  parentCallId      String?  @map("parent_call_id") @db.Uuid
  callDepth         Int      @default(0) @map("call_depth")
  
  // Usage metrics
  inputTokens       Int?     @map("input_tokens")
  outputTokens      Int?     @map("output_tokens")
  totalTokens       Int?     @map("total_tokens")
  ragEmbeddings     Int      @default(0) @map("rag_embeddings")
  ragSearches       Int      @default(0) @map("rag_searches")
  toolCalls         Int      @default(0) @map("tool_calls")
  nestedAgentCalls  Int      @default(0) @map("nested_agent_calls")
  
  // Cost breakdown
  llmInputCost      Decimal  @default(0) @map("llm_input_cost") @db.Decimal(12, 8)
  llmOutputCost     Decimal  @default(0) @map("llm_output_cost") @db.Decimal(12, 8)
  ragCost           Decimal  @default(0) @map("rag_cost") @db.Decimal(12, 8)
  toolCallCost      Decimal  @default(0) @map("tool_call_cost") @db.Decimal(12, 8)
  nestedAgentCost   Decimal  @default(0) @map("nested_agent_cost") @db.Decimal(12, 8)
  totalCostUsd      Decimal  @map("total_cost_usd") @db.Decimal(12, 8)
  
  // Credits/Points charged
  creditsCharged    Decimal  @map("credits_charged") @db.Decimal(12, 4)
  pointsCharged     Decimal  @default(0) @map("points_charged") @db.Decimal(12, 4)
  currency          String   @default("credits") @db.VarChar(20)
  
  // Status
  status            String   @db.VarChar(20)
  errorMessage      String?  @map("error_message") @db.Text
  
  // Timestamps
  startedAt         DateTime @map("started_at")
  completedAt       DateTime? @map("completed_at")
  createdAt         DateTime @default(now()) @map("created_at")
  
  // Metadata
  metadata          Json     @default("{}")
  
  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform          AgentPlatform @relation(fields: [platformId], references: [id])
  model             AgentModel @relation(fields: [modelId], references: [id])
  parentCall        AgentUsageLog? @relation("NestedCalls", fields: [parentCallId], references: [id])
  nestedCalls       AgentUsageLog[] @relation("NestedCalls")
  
  @@index([userId, createdAt])
  @@index([sessionId])
  @@index([parentCallId])
  @@index([platformId, modelId, createdAt])
  @@map("agent_usage_logs")
}
```

#### 4.1.5 CostEstimation

```prisma
model CostEstimation {
  id                     String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId                 String   @map("user_id") @db.Uuid
  platformId             String   @map("platform_id") @db.Uuid
  modelId                String   @map("model_id") @db.Uuid
  
  // Estimated usage
  estimatedInputTokens   Int?     @map("estimated_input_tokens")
  estimatedOutputTokens  Int?     @map("estimated_output_tokens")
  estimatedRagOps        Int      @default(0) @map("estimated_rag_ops")
  estimatedToolCalls     Int      @default(0) @map("estimated_tool_calls")
  
  // Estimated cost
  estimatedCostUsd       Decimal  @map("estimated_cost_usd") @db.Decimal(12, 8)
  estimatedCredits       Decimal  @map("estimated_credits") @db.Decimal(12, 4)
  
  // User balance check
  userBalance            Decimal  @map("user_balance") @db.Decimal(12, 4)
  hasEnoughBalance       Boolean  @map("has_enough_balance")
  
  createdAt              DateTime @default(now()) @map("created_at")
  expiresAt              DateTime @map("expires_at")
  
  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform               AgentPlatform @relation(fields: [platformId], references: [id])
  model                  AgentModel @relation(fields: [modelId], references: [id])
  
  @@index([userId, createdAt])
  @@index([expiresAt])
  @@map("cost_estimations")
}
```

#### 4.1.6 CreditReservation

```prisma
model CreditReservation {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  amount      Decimal  @db.Decimal(12, 4)
  sessionId   String?  @map("session_id") @db.Uuid
  status      String   @db.VarChar(20)  // active, charged, refunded, expired
  chargedAt   DateTime? @map("charged_at")
  refundedAt  DateTime? @map("refunded_at")
  createdAt   DateTime @default(now()) @map("created_at")
  expiresAt   DateTime @map("expires_at")
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, status])
  @@index([expiresAt])
  @@map("credit_reservations")
}
```

### 4.2 API Endpoints

#### 4.2.1 Pricing Endpoints

```typescript
// GET /api/pricing/platforms
// ดึงรายการ platforms ทั้งหมด
GET /api/pricing/platforms
Response: {
  platforms: AgentPlatform[]
}

// GET /api/pricing/platforms/:platformId/models
// ดึงรายการ models ของ platform
GET /api/pricing/platforms/:platformId/models
Response: {
  models: AgentModel[]
}

// GET /api/pricing/rules/:modelId
// ดึง pricing rules ของ model
GET /api/pricing/rules/:modelId
Response: {
  rules: PricingRule[]
}

// POST /api/pricing/estimate
// ประมาณการค่าใช้จ่าย
POST /api/pricing/estimate
Request: {
  platformId: string;
  modelId: string;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  ragOperations?: number;
  toolCalls?: number;
}
Response: {
  estimatedCost: CostBreakdown;
  userBalance: number;
  hasEnoughBalance: boolean;
}
```

#### 4.2.2 Agent Execution Endpoints

```typescript
// POST /api/agents/execute
// เรียกใช้ agent พร้อมตัดเครดิต
POST /api/agents/execute
Request: {
  platformId: string;
  modelId: string;
  agentId?: string;
  sessionId?: string;
  parentCallId?: string;
  input: any;
}
Response: {
  output: any;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    ragEmbeddings?: number;
    ragSearches?: number;
    toolCalls?: number;
  };
  cost: {
    totalCostUsd: number;
    totalCredits: number;
    breakdown: CostBreakdownItem[];
  };
  balanceAfter: number;
}

// GET /api/agents/usage/session/:sessionId
// ดูค่าใช้จ่ายทั้งหมดใน session
GET /api/agents/usage/session/:sessionId
Response: {
  totalCalls: number;
  totalCostUsd: number;
  totalCredits: number;
  breakdown: SessionCostBreakdown[];
}

// GET /api/agents/usage/history
// ดูประวัติการใช้งาน
GET /api/agents/usage/history?from=2025-10-01&to=2025-10-31&limit=50
Response: {
  logs: AgentUsageLog[];
  total: number;
  summary: {
    totalCalls: number;
    totalCredits: number;
    totalCostUsd: number;
  };
}
```

#### 4.2.3 Admin Endpoints

```typescript
// POST /api/admin/pricing/rules
// สร้าง pricing rule ใหม่
POST /api/admin/pricing/rules
Request: PricingRule
Response: { rule: PricingRule }

// PUT /api/admin/pricing/rules/:ruleId
// อัปเดต pricing rule
PUT /api/admin/pricing/rules/:ruleId
Request: Partial<PricingRule>
Response: { rule: PricingRule }

// POST /api/admin/pricing/bulk-update
// อัปเดตราคาหลายรายการพร้อมกัน
POST /api/admin/pricing/bulk-update
Request: {
  rules: Partial<PricingRule>[];
  effectiveFrom: Date;
}
Response: { updated: number }

// GET /api/admin/pricing/analytics
// ดู analytics ของการใช้งานและรายได้
GET /api/admin/pricing/analytics?from=2025-10-01&to=2025-10-31
Response: {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  topModels: ModelUsageStats[];
  topUsers: UserUsageStats[];
}
```

### 4.3 Service Implementation

#### 4.3.1 PricingService

```typescript
interface CostCalculationInput {
  platformId: string;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  ragEmbeddings?: number;
  ragSearches?: number;
  toolCalls?: number;
  nestedAgentCalls?: number;
  userTier?: UserTier;
}

interface CostBreakdown {
  llmInputCost: number;
  llmOutputCost: number;
  ragCost: number;
  toolCallCost: number;
  nestedAgentCost: number;
  totalCostUsd: number;
  totalCredits: number;
  breakdown: CostBreakdownItem[];
}

class PricingService {
  async calculateCost(input: CostCalculationInput): Promise<CostBreakdown>;
  async estimateCost(userId: string, platformId: string, modelId: string, 
                     estimatedTokens: { input?: number; output?: number }): 
                     Promise<{ estimatedCost: CostBreakdown; userBalance: number; hasEnoughBalance: boolean }>;
  async getPricingRules(platformId: string, modelId: string): Promise<PricingRule[]>;
  private getTierMultiplier(tier: UserTier): number;
}
```

#### 4.3.2 CreditService (Enhanced)

```typescript
class CreditService {
  async reserveCredits(userId: string, amount: number, sessionId: string): 
       Promise<{ success: boolean; reservationId: string }>;
  async chargeCredits(userId: string, reservationId: string, actualAmount: number, usageLogId: string): 
       Promise<{ success: boolean; balanceAfter: number }>;
  async refundCredits(userId: string, reservationId: string, reason: string): 
       Promise<{ success: boolean }>;
  async getUserBalance(userId: string): Promise<number>;
  private acquireLock(key: string): Promise<Lock>;
  private releaseLock(lock: Lock): Promise<void>;
}
```

#### 4.3.3 UsageTrackingService

```typescript
class UsageTrackingService {
  async trackAgentUsage(params: {
    userId: string;
    agentId?: string;
    platformId: string;
    modelId: string;
    sessionId?: string;
    parentCallId?: string;
    usage: UsageMetrics;
  }): Promise<AgentUsageLog>;
  
  async getSessionCost(sessionId: string): Promise<SessionCostSummary>;
  async getUserUsageHistory(userId: string, filters: UsageFilters): Promise<UsageHistoryResult>;
  private updateParentCallCost(parentCallId: string, additionalCost: number, additionalCredits: number): Promise<void>;
  private getCallDepth(callId: string): Promise<number>;
}
```

### 4.4 Frontend Components

#### 4.4.1 Cost Estimator Component

```typescript
// components/Pricing/CostEstimator.tsx
interface CostEstimatorProps {
  platformId: string;
  modelId: string;
  onEstimateComplete?: (estimate: CostEstimate) => void;
}

const CostEstimator: React.FC<CostEstimatorProps> = ({ platformId, modelId, onEstimateComplete }) => {
  // Input fields: estimatedInputTokens, estimatedOutputTokens, ragOps, toolCalls
  // Display: Cost breakdown, user balance, has enough balance
  // Button: "Calculate Estimate"
};
```

#### 4.4.2 Cost Breakdown Display

```typescript
// components/Pricing/CostBreakdown.tsx
interface CostBreakdownProps {
  breakdown: CostBreakdown;
  showDetails?: boolean;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({ breakdown, showDetails = true }) => {
  // Display cost breakdown in table format
  // Show: Component, Units, Cost (USD), Credits
  // Total row at bottom
};
```

#### 4.4.3 Admin Pricing Dashboard

```typescript
// components/Admin/PricingDashboard.tsx
const PricingDashboard: React.FC = () => {
  // Platform selector
  // Model selector
  // Pricing rules table (editable)
  // Tier multipliers configuration
  // Bulk update button
  // Save button
};
```

### 4.5 Integration Points

#### 4.5.1 API Gateway Integration

```typescript
// packages/api-gateway/src/routes/index.ts
app.use('/api/pricing', pricingRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/admin/pricing', adminPricingRoutes);
```

#### 4.5.2 MCP Server Integration

```typescript
// packages/mcp-server/src/tools/agent-execution.ts
export const executeAgentTool = {
  name: 'execute_agent',
  description: 'Execute an agent with automatic credit deduction',
  inputSchema: {
    type: 'object',
    properties: {
      platformId: { type: 'string' },
      modelId: { type: 'string' },
      input: { type: 'object' },
    },
    required: ['platformId', 'modelId', 'input'],
  },
  async handler(params: ExecuteAgentParams) {
    // Call agent-service API
    // Return output and cost breakdown
  },
};
```

## 5. Implementation Plan

### Phase 1: Database & Core Services (Week 1-2)

**Tasks**:
- [ ] สร้าง Prisma schema สำหรับ pricing system
- [ ] รัน migrations
- [ ] Seed initial data (platforms, models, pricing rules)
- [ ] Implement PricingService
- [ ] Implement enhanced CreditService
- [ ] Implement UsageTrackingService
- [ ] เขียน unit tests

**Deliverables**:
- Database schema พร้อมใช้งาน
- Services ทั้งหมดพร้อม tests

### Phase 2: API Endpoints (Week 3)

**Tasks**:
- [ ] Implement pricing endpoints
- [ ] Implement agent execution endpoints
- [ ] Implement admin endpoints
- [ ] เขียน integration tests
- [ ] เขียน API documentation

**Deliverables**:
- API endpoints ครบถ้วน
- API documentation

### Phase 3: Frontend (Week 4)

**Tasks**:
- [ ] สร้าง CostEstimator component
- [ ] สร้าง CostBreakdown component
- [ ] สร้าง UsageHistory page
- [ ] สร้าง Admin PricingDashboard
- [ ] Integrate กับ API endpoints
- [ ] เขียน frontend tests

**Deliverables**:
- Frontend components และ pages ครบถ้วน

### Phase 4: Integration & Testing (Week 5)

**Tasks**:
- [ ] Integrate กับ existing agents
- [ ] E2E tests
- [ ] Performance tests
- [ ] Security audit
- [ ] Bug fixes

**Deliverables**:
- ระบบทำงานครบถ้วนและผ่าน tests

### Phase 5: Deployment (Week 6)

**Tasks**:
- [ ] Staging deployment
- [ ] Data migration (ถ้าจำเป็น)
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation

**Deliverables**:
- ระบบ production-ready

## 6. Testing Strategy

### 6.1 Unit Tests

- PricingService: calculateCost, estimateCost, getTierMultiplier
- CreditService: reserveCredits, chargeCredits, refundCredits
- UsageTrackingService: trackAgentUsage, updateParentCallCost

### 6.2 Integration Tests

- API endpoints: pricing, agent execution, admin
- Database operations: CRUD operations
- Service integrations: PricingService + CreditService + UsageTrackingService

### 6.3 E2E Tests

- Complete user flow: estimate → execute → view usage
- Nested agent calls flow
- Admin pricing management flow

### 6.4 Performance Tests

- Concurrent agent executions
- Bulk pricing updates
- Large usage history queries

## 7. Security Considerations

### 7.1 Access Control

- ผู้ใช้ทั่วไป: ดูเฉพาะข้อมูลของตนเอง
- Admin: จัดการ pricing rules ได้ทั้งหมด
- API endpoints ต้องมี authentication และ authorization

### 7.2 Data Protection

- Sensitive pricing data ต้อง encrypt
- Audit logs สำหรับการเปลี่ยนแปลง pricing rules
- Rate limiting สำหรับ API endpoints

### 7.3 Financial Security

- Distributed locking สำหรับ credit operations
- Atomic transactions สำหรับ credit deduction
- Automatic refund mechanism สำหรับ failed calls

## 8. Monitoring & Alerting

### 8.1 Metrics

- Total revenue (daily, weekly, monthly)
- Total cost (daily, weekly, monthly)
- Profit margin
- Top models by usage
- Top users by spending
- Failed agent calls rate
- Average cost per call

### 8.2 Alerts

- Profit margin < 10% (warning)
- Failed calls rate > 5% (critical)
- Unusual pricing changes (warning)
- High-value transactions (info)

## 9. Success Metrics

- ✅ ระบบคำนวณค่าใช้จ่ายถูกต้อง 100%
- ✅ ไม่มี credit deduction errors
- ✅ Profit margin >= 15%
- ✅ API response time < 200ms (p95)
- ✅ User satisfaction score >= 4.5/5

## 10. Dependencies

- FR-RAG-001: RAG System Integration (สำหรับ RAG cost calculation)
- FR-SKILLS-001: Agent Skills Marketplace (สำหรับ agent execution)
- FR-004: Financial System (สำหรับ credit management)

## 11. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ราคาคำนวณผิด | High | Low | Extensive testing, code review |
| Credit deduction errors | High | Medium | Distributed locking, atomic transactions |
| Performance issues | Medium | Medium | Caching, database indexing |
| Pricing data leak | High | Low | Encryption, access control |

## 12. Future Enhancements

- Volume-based pricing (ลดราคาเมื่อใช้มาก)
- Subscription plans (unlimited usage)
- Custom pricing per organization
- Real-time pricing adjustments based on demand
- Cost optimization recommendations

