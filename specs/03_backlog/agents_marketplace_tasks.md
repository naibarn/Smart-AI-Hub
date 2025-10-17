# Agents Marketplace - Backlog Tasks

## Epic: OpenAI Agents Marketplace & Library

**Status:** 🔴 Not Started  
**Priority:** P1 - High  
**Estimated Duration:** 12 weeks (6 phases × 2 weeks)  
**Spec Reference:** [agents_marketplace.md](../backend/agents_marketplace.md)  
**Related Specs:** PointsSystem, SubscriptionPlans, MCP Server

---

## 📊 Progress Overview

**Total Tasks:** 18  
**Completed:** 0 ✅  
**In Progress:** 0 🟡  
**Not Started:** 18 🔴  

**Overall Progress:** 0%

---

## Phase 1: Core Implementation (Week 1-2)

### Task 1.1: Database Schema Implementation

**Description:** สร้าง database schema สำหรับ Agents Marketplace

**Subtasks:**
- [ ] เพิ่ม `Agent` model ใน Prisma schema
  - id, name, description, category, icon, type (AGENT_FLOW, CUSTOM_GPT, GEMINI_GEM)
  - visibility (PRIVATE, ORGANIZATION, AGENCY, PUBLIC)
  - status (DRAFT, PENDING, APPROVED, REJECTED)
  - flowDefinition, inputSchema, outputSchema
  - executionConfig (method, provider, streaming, timeout)
  - metadata (tags, previewImages, videoUrl, documentation)
  - createdBy, organizationId, agencyId
  - timestamps
- [ ] เพิ่ม `AgentSetting` model
  - id, key, value, description, dataType
  - updatedBy, timestamps
- [ ] เพิ่ม `AgentApprovalLog` model
  - id, agentId, action (SUBMITTED, APPROVED, REJECTED)
  - performedBy, reason, timestamps
- [ ] เพิ่ม `AgentUsageLog` model
  - id, agentId, userId, inputData, outputData
  - tokensUsed, costInCredits, executionTime
  - status, errorMessage, timestamps
- [ ] เพิ่ม Enums: `AgentType`, `AgentVisibility`, `AgentStatus`, `ApprovalAction`
- [ ] สร้าง migration: `npx prisma migrate dev --name add_agents_marketplace`
- [ ] ทดสอบ schema ด้วย Prisma Studio

**Assignee:** Backend Team  
**Status:** 🔴 Not Started  
**Estimated:** 3 days  
**Dependencies:** None

**Acceptance Criteria:**
- ✅ Prisma schema มี models และ enums ครบถ้วน
- ✅ Migration ทำงานสำเร็จโดยไม่มี error
- ✅ สามารถ CRUD ข้อมูลผ่าน Prisma Client ได้

---

### Task 1.2: MCP Server Extension

**Description:** ขยาย MCP Server ให้รองรับการรัน Agent Flows

**Subtasks:**
- [ ] เพิ่ม message type `agent_flow` ใน MCP Server
- [ ] สร้าง `AgentFlowExecutor` service
  - parseFlowDefinition()
  - validateInput()
  - executeFlow()
  - handleStreaming()
- [ ] Integration กับ OpenAI API
  - สร้าง OpenAI client
  - จัดการ API keys
  - Handle rate limiting
- [ ] Implement credit tracking
  - คำนวณ tokens used
  - คำนวณ cost with markup
  - บันทึก usage log
- [ ] Error handling และ retry logic
- [ ] ทดสอบการรัน Agent Flow แบบ simple และ complex

**Assignee:** Backend Team  
**Status:** 🔴 Not Started  
**Estimated:** 4 days  
**Dependencies:** Task 1.1

**Acceptance Criteria:**
- ✅ MCP Server รับ message type `agent_flow` ได้
- ✅ สามารถรัน Agent Flow และได้ผลลัพธ์ถูกต้อง
- ✅ Credit tracking ทำงานถูกต้อง
- ✅ Error handling ครอบคลุมทุก edge case

---

### Task 1.3: Credit Calculation with Markup

**Description:** Implement ระบบคำนวณเครดิตพร้อม markup

**Subtasks:**
- [ ] สร้าง `calculateAgentCost()` function
  - รับ tokens used จาก OpenAI
  - ดึง markup % จาก AgentSetting
  - คำนวณ final cost
- [ ] Integration กับ creditService
  - ตรวจสอบ balance ก่อนรัน
  - หักเครดิตหลังรัน
  - บันทึก transaction
- [ ] สร้าง default AgentSetting
  - `agent_markup_percentage` = 15
  - `agent_default_timeout` = 300
  - `agent_max_tokens` = 4000
- [ ] ทดสอบการคำนวณกับ token amounts ต่างๆ
- [ ] ทดสอบ insufficient balance scenario

**Assignee:** Backend Team  
**Status:** 🔴 Not Started  
**Estimated:** 2 days  
**Dependencies:** Task 1.1, Task 1.2

**Acceptance Criteria:**
- ✅ การคำนวณ cost ถูกต้องตามสูตร
- ✅ Integration กับ creditService ทำงานสมบูรณ์
- ✅ Default settings ถูกสร้างใน database
- ✅ Error handling สำหรับ insufficient balance

---

## Phase 2: Agent Submission & Approval (Week 3-4)

### Task 2.1: Agent Submission API

**Description:** สร้าง API endpoints สำหรับการ submit และจัดการ Agent

**Subtasks:**
- [ ] `POST /api/agents` - สร้าง Agent ใหม่ (Draft)
- [ ] `PUT /api/agents/:id` - แก้ไข Agent
- [ ] `POST /api/agents/:id/submit` - Submit Agent เพื่อขอ approval
- [ ] `DELETE /api/agents/:id` - ลบ Agent (เฉพาะ Draft)
- [ ] `GET /api/agents/my` - ดู Agent ของตัวเอง
- [ ] สร้าง `agentService.ts` ด้วย CRUD functions
- [ ] สร้าง validation middleware
  - validateAgentData()
  - validateFlowDefinition()
  - validateInputSchema()
- [ ] ทดสอบทุก endpoint ด้วย Postman/Thunder Client

**Assignee:** Backend Team  
**Status:** 🔴 Not Started  
**Estimated:** 3 days  
**Dependencies:** Task 1.1

**Acceptance Criteria:**
- ✅ API endpoints ทั้งหมดทำงานถูกต้อง
- ✅ Validation ครอบคลุมทุก field
- ✅ Error messages ชัดเจนและเป็นมิตร
- ✅ มี API documentation (Swagger/OpenAPI)

---

### Task 2.2: Visibility Control Implementation

**Description:** Implement ระบบควบคุมสิทธิ์การมองเห็นและใช้งาน Agent

**Subtasks:**
- [ ] สร้าง `agentAccess.middleware.ts`
  - checkAgentVisibility()
  - canViewAgent()
  - canExecuteAgent()
  - canEditAgent()
- [ ] Implement visibility logic
  - PRIVATE: เฉพาะ creator
  - ORGANIZATION: ทุกคนใน organization
  - AGENCY: ทุกคนใน agency
  - PUBLIC: ทุกคนที่ login
- [ ] เพิ่ม middleware ใน agent routes
- [ ] ทดสอบ access control กับ user roles ต่างๆ
- [ ] ทดสอบ edge cases (user ไม่มี org, ไม่มี agency)

**Assignee:** Backend Team  
**Status:** 🔴 Not Started  
**Estimated:** 2 days  
**Dependencies:** Task 2.1

**Acceptance Criteria:**
- ✅ Visibility control ทำงานถูกต้องทุก level
- ✅ Unauthorized access ถูก block
- ✅ Error messages ชัดเจน
- ✅ Performance ดี (ไม่มี N+1 queries)

---

### Task 2.3: Approval Workflow Implementation

**Description:** สร้างระบบ approval workflow สำหรับ Admin

**Subtasks:**
- [ ] `GET /api/admin/agents/pending` - ดู Agent ที่รอ approval
- [ ] `POST /api/admin/agents/:id/approve` - Approve Agent
- [ ] `POST /api/admin/agents/:id/reject` - Reject Agent (พร้อม reason)
- [ ] สร้าง `agentApprovalService.ts`
  - submitForApproval()
  - approveAgent()
  - rejectAgent()
  - logApprovalAction()
- [ ] Integration กับ notificationService
  - แจ้งเตือนเมื่อ Agent ถูก approve
  - แจ้งเตือนเมื่อ Agent ถูก reject (พร้อม reason)
- [ ] ทดสอบ workflow ทั้งหมด

**Assignee:** Backend Team  
**Status:** 🔴 Not Started  
**Estimated:** 3 days  
**Dependencies:** Task 2.1

**Acceptance Criteria:**
- ✅ Approval workflow ทำงานสมบูรณ์
- ✅ Approval log ถูกบันทึกครบถ้วน
- ✅ Notification ส่งถูกต้อง
- ✅ Status transitions ถูกต้อง (Draft → Pending → Approved/Rejected)

---

## Phase 3: Public Marketplace & UI/UX (Week 5-6)

### Task 3.1: Public Marketplace API

**Description:** สร้าง API สำหรับ Public Marketplace (ไม่ต้อง login)

**Subtasks:**
- [ ] `GET /api/public/agents` - ดู Agent ทั้งหมด (public only, no auth)
  - Query params: category, tags, search, page, limit
  - Response: agents[], pagination, categories[]
- [ ] `GET /api/public/agents/:id` - ดูรายละเอียด Agent (no auth)
- [ ] Implement category filtering
- [ ] Implement search by name/description/tags
- [ ] Implement pagination
- [ ] Cache response ด้วย Redis (optional)
- [ ] ทดสอบ performance กับ large dataset

**Assignee:** Backend Team  
**Status:** 🔴 Not Started  
**Estimated:** 2 days  
**Dependencies:** Task 1.1, Task 2.2

**Acceptance Criteria:**
- ✅ API ทำงานโดยไม่ต้อง authentication
- ✅ แสดงเฉพาะ Agent ที่ visibility=PUBLIC และ status=APPROVED
- ✅ Filtering และ search ทำงานถูกต้อง
- ✅ Pagination ทำงานถูกต้อง
- ✅ Response time < 500ms

---

### Task 3.2: Frontend - Marketplace Page

**Description:** สร้างหน้า Marketplace สำหรับแสดง Agent ทั้งหมด

**Subtasks:**
- [ ] สร้าง `Marketplace.tsx` page
- [ ] สร้าง `AgentCard.tsx` component
  - แสดง icon, name, description, category, tags
  - แสดง badge สำหรับ type (Agent Flow, Custom GPT, Gemini Gem)
- [ ] สร้าง `AgentGrid.tsx` component (responsive grid)
- [ ] สร้าง `SearchBar.tsx` component
- [ ] สร้าง `CategoryTabs.tsx` component
  - All, Agent Flows, Custom GPTs, Gemini Gems
- [ ] Integration กับ `/api/public/agents`
- [ ] Implement infinite scroll หรือ pagination
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states และ empty states

**Assignee:** Frontend Team  
**Status:** 🔴 Not Started  
**Estimated:** 3 days  
**Dependencies:** Task 3.1

**Acceptance Criteria:**
- ✅ หน้า Marketplace แสดง Agent ทั้งหมดถูกต้อง
- ✅ Category filtering ทำงานถูกต้อง
- ✅ Search ทำงานถูกต้อง
- ✅ Responsive design ทำงานดีทุกขนาดหน้าจอ
- ✅ UI/UX สวยงามและใช้งานง่าย

---

### Task 3.3: Frontend - Agent Detail Page

**Description:** สร้างหน้ารายละเอียด Agent พร้อม preview และ documentation

**Subtasks:**
- [ ] สร้าง `AgentDetail.tsx` page
- [ ] สร้าง `AgentHeader.tsx` component (icon, name, category, tags)
- [ ] สร้าง `AgentDescription.tsx` component
  - Render Markdown/HTML ด้วย `react-markdown` หรือ `dangerouslySetInnerHTML` (XSS protected)
- [ ] สร้าง `ImageGallery.tsx` component
  - แสดง preview images
  - Lightbox สำหรับดูรูปขนาดใหญ่
- [ ] สร้าง `VideoEmbed.tsx` component
  - Embed YouTube video
- [ ] สร้าง `AgentInputForm.tsx` component
  - Dynamic form จาก inputSchema
  - Validation
- [ ] สร้างปุ่ม "Run Agent" (ต้อง login)
- [ ] สร้างปุ่ม "Sign Up" และ "Login" สำหรับ guest
- [ ] แสดงราคาโดยประมาณ (estimated cost)

**Assignee:** Frontend Team  
**Status:** 🔴 Not Started  
**Estimated:** 3 days  
**Dependencies:** Task 3.1

**Acceptance Criteria:**
- ✅ หน้ารายละเอียดแสดงข้อมูลครบถ้วน
- ✅ Markdown/HTML rendering ทำงานถูกต้อง (XSS protected)
- ✅ Image gallery และ video embed ทำงานถูกต้อง
- ✅ Dynamic form จาก inputSchema ทำงานถูกต้อง
- ✅ Guest user เห็นปุ่ม "Sign Up/Login" แทน "Run Agent"

---

## Phase 4: Custom GPT & Gemini Gem Support (Week 7-8)

### Task 4.1: Custom GPT Support

**Description:** รองรับการ submit และใช้งาน Custom GPT

**Subtasks:**
- [ ] เพิ่ม validation สำหรับ Custom GPT URL
  - Format: `https://chat.openai.com/g/g-XXXXX-agent-name`
- [ ] สร้าง redirect logic
  - เมื่อคลิก "Run Agent" จะ redirect ไปยัง ChatGPT
  - ไม่มีการหักเครดิตใน Smart AI Hub
- [ ] แก้ไข `AgentForm.tsx` เพื่อรองรับ Custom GPT
  - แสดง URL input field
  - ซ่อน Flow Definition field
- [ ] แก้ไข `AgentDetail.tsx` เพื่อแสดงปุ่ม "Open in ChatGPT"
- [ ] ทดสอบกับ Custom GPT จริง

**Assignee:** Full Stack Team  
**Status:** 🔴 Not Started  
**Estimated:** 2 days  
**Dependencies:** Task 3.2, Task 3.3

**Acceptance Criteria:**
- ✅ URL validation ทำงานถูกต้อง
- ✅ Redirect ไปยัง ChatGPT ถูกต้อง
- ✅ ไม่มีการหักเครดิต
- ✅ UI แสดงข้อความชัดเจนว่าต้องมี ChatGPT Plus

---

### Task 4.2: Gemini Gem Support

**Description:** รองรับการ submit และใช้งาน Gemini Gem

**Subtasks:**
- [ ] เพิ่ม validation สำหรับ Gemini Gem URL
  - Format: `https://gemini.google.com/gem/XXXXX`
- [ ] สร้าง redirect logic
  - เมื่อคลิก "Run Agent" จะ redirect ไปยัง Gemini
  - ไม่มีการหักเครดิตใน Smart AI Hub
- [ ] แก้ไข `AgentForm.tsx` เพื่อรองรับ Gemini Gem
- [ ] แก้ไข `AgentDetail.tsx` เพื่อแสดงปุ่ม "Open in Gemini"
- [ ] ทดสอบกับ Gemini Gem จริง

**Assignee:** Full Stack Team  
**Status:** 🔴 Not Started  
**Estimated:** 2 days  
**Dependencies:** Task 3.2, Task 3.3

**Acceptance Criteria:**
- ✅ URL validation ทำงานถูกต้อง
- ✅ Redirect ไปยัง Gemini ถูกต้อง
- ✅ ไม่มีการหักเครดิต
- ✅ UI แสดงข้อความชัดเจนว่าต้องมี Gemini account

---

### Task 4.3: Agent Submission Guidelines

**Description:** สร้างเอกสารแนวทางการสร้างและ submit Agent

**Subtasks:**
- [ ] เขียนเอกสาร "Agent Submission Guidelines"
  - ข้อกำหนดทั่วไป (ชื่อ, คำอธิบาย, category)
  - Flow Definition format (JSON schema)
  - Input/Output schema requirements
  - Best practices สำหรับการเขียน prompt
  - ตัวอย่าง Agent ที่ดี
  - ข้อห้ามและข้อควรระวัง
- [ ] สร้างหน้า `/docs/agent-guidelines` ใน Frontend
- [ ] Render เอกสารด้วย Markdown
- [ ] เพิ่มลิงก์ไปยังหน้านี้ใน "Create Agent" form
- [ ] ทดสอบว่าเอกสารอ่านง่ายและเข้าใจได้

**Assignee:** Documentation Team + Frontend Team  
**Status:** 🔴 Not Started  
**Estimated:** 2 days  
**Dependencies:** None

**Acceptance Criteria:**
- ✅ เอกสารครบถ้วนและเข้าใจง่าย
- ✅ มีตัวอย่าง Agent ที่ดี
- ✅ หน้า documentation แสดงผลสวยงาม
- ✅ ลิงก์จาก Create Agent form ทำงานถูกต้อง

---

## Phase 5: Advanced Features (Week 9-10)

### Task 5.1: Streaming Responses Support

**Description:** รองรับการ stream response แบบ real-time

**Subtasks:**
- [ ] เพิ่ม WebSocket support ใน MCP Server
- [ ] แก้ไข `AgentFlowExecutor` เพื่อรองรับ streaming
- [ ] สร้าง `useAgentStream` hook ใน Frontend
- [ ] แก้ไข `AgentDetail.tsx` เพื่อแสดง streaming response
- [ ] เพิ่ม progress indicator
- [ ] ทดสอบกับ Agent ที่ใช้เวลานาน

**Assignee:** Full Stack Team  
**Status:** 🔴 Not Started  
**Estimated:** 3 days  
**Dependencies:** Task 1.2, Task 3.3

**Acceptance Criteria:**
- ✅ Streaming ทำงานถูกต้อง
- ✅ Progress indicator แสดงผลสวยงาม
- ✅ Error handling สำหรับ connection loss
- ✅ Performance ดี (ไม่ lag)

---

### Task 5.2: Multi-step Flows Support

**Description:** รองรับ Agent Flow ที่มีหลายขั้นตอน

**Subtasks:**
- [ ] ขยาย Flow Definition schema เพื่อรองรับ multi-step
- [ ] แก้ไข `AgentFlowExecutor` เพื่อรัน multi-step flows
- [ ] รองรับ conditional branching
- [ ] รองรับ loops
- [ ] สร้าง visual flow editor (optional)
- [ ] ทดสอบกับ complex flows

**Assignee:** Backend Team  
**Status:** 🔴 Not Started  
**Estimated:** 4 days  
**Dependencies:** Task 1.2

**Acceptance Criteria:**
- ✅ Multi-step flows ทำงานถูกต้อง
- ✅ Conditional branching ทำงานถูกต้อง
- ✅ Error handling ครอบคลุม
- ✅ มีตัวอย่าง complex flow

---

## Phase 6: Testing & Optimization (Week 11-12)

### Task 6.1: Comprehensive Testing

**Description:** ทดสอบระบบทั้งหมดอย่างครอบคลุม

**Subtasks:**
- [ ] **Unit Tests**
  - agentService.ts (100% coverage)
  - agentExecutionService.ts (100% coverage)
  - agentApprovalService.ts (100% coverage)
  - calculateAgentCost() (100% coverage)
- [ ] **Integration Tests**
  - API endpoints ทั้งหมด
  - Agent submission workflow
  - Approval workflow
  - Credit calculation
- [ ] **E2E Tests** (Playwright/Cypress)
  - User journey: Browse → View Detail → Run Agent
  - User journey: Create Agent → Submit → Approve
  - Guest journey: Browse Marketplace → Sign Up
- [ ] **Performance Tests**
  - Load testing (100 concurrent users)
  - Stress testing (1000 agents in marketplace)
- [ ] **Security Tests**
  - XSS protection
  - SQL injection protection
  - Access control bypass attempts

**Assignee:** QA Team + Dev Team  
**Status:** 🔴 Not Started  
**Estimated:** 4 days  
**Dependencies:** All previous tasks

**Acceptance Criteria:**
- ✅ Unit test coverage >= 80%
- ✅ Integration tests ผ่านทั้งหมด
- ✅ E2E tests ผ่านทั้งหมด
- ✅ Performance tests ผ่าน (response time < 500ms)
- ✅ Security tests ไม่พบช่องโหว่

---

### Task 6.2: Optimization & Production Deployment

**Description:** Optimize ระบบและ deploy ขึ้น production

**Subtasks:**
- [ ] **Performance Optimization**
  - Database indexing (agentId, userId, status, visibility)
  - Query optimization (ลด N+1 queries)
  - Caching (Redis) สำหรับ public agents list
  - Image optimization (CDN, lazy loading)
- [ ] **Security Audit**
  - Review access control logic
  - Review input validation
  - Review XSS protection
  - Review rate limiting
- [ ] **Production Deployment**
  - Deploy database migrations
  - Deploy backend services
  - Deploy frontend
  - Configure monitoring (Sentry, DataDog)
  - Configure logging
- [ ] **Documentation**
  - API documentation (Swagger)
  - User guide
  - Admin guide
  - Developer guide
- [ ] **Monitoring & Alerts**
  - Setup error alerts
  - Setup performance alerts
  - Setup usage dashboards

**Assignee:** DevOps Team + Dev Team  
**Status:** 🔴 Not Started  
**Estimated:** 4 days  
**Dependencies:** Task 6.1

**Acceptance Criteria:**
- ✅ Performance optimization ทำให้ response time ลดลง >= 30%
- ✅ Security audit ไม่พบช่องโหว่ critical
- ✅ Production deployment สำเร็จโดยไม่มี downtime
- ✅ Documentation ครบถ้วนและเข้าใจง่าย
- ✅ Monitoring และ alerts ทำงานถูกต้อง

---

## 📈 Milestones

| Milestone | Date | Status |
|-----------|------|--------|
| Phase 1 Complete | Week 2 | 🔴 Not Started |
| Phase 2 Complete | Week 4 | 🔴 Not Started |
| Phase 3 Complete | Week 6 | 🔴 Not Started |
| Phase 4 Complete | Week 8 | 🔴 Not Started |
| Phase 5 Complete | Week 10 | 🔴 Not Started |
| Phase 6 Complete | Week 12 | 🔴 Not Started |
| **Production Launch** | **Week 12** | **🔴 Not Started** |

---

## 🔗 Dependencies

### Internal Dependencies
- **creditService** (existing) - สำหรับการหักเครดิต
- **authService** (existing) - สำหรับ authentication
- **notificationService** (existing) - สำหรับการแจ้งเตือน
- **MCP Server** (existing) - สำหรับการรัน Agent Flow

### External Dependencies
- **OpenAI API** - สำหรับการรัน Agent Flow
- **Redis** (optional) - สำหรับ caching
- **CDN** (optional) - สำหรับ image hosting

---

## 🚨 Risks & Mitigation

### Risk 1: OpenAI API Rate Limiting
**Mitigation:** Implement queue system และ retry logic

### Risk 2: Credit Calculation Errors
**Mitigation:** Extensive testing และ manual verification

### Risk 3: Security Vulnerabilities
**Mitigation:** Security audit และ penetration testing

### Risk 4: Performance Issues
**Mitigation:** Load testing และ optimization

---

## 📚 Related Documents

- [Agents Marketplace Spec](../backend/agents_marketplace.md)
- [API Gateway Spec](../backend/api_gateway.md)
- [MCP Server Spec](../backend/mcp_server.md)
- [Credit System Spec](../backend/credit_account.md)
- [Agent Submission Guidelines](../../docs/agent-guidelines.md)

---

## 📞 Team Contacts

- **Backend Team Lead:** TBD
- **Frontend Team Lead:** TBD
- **QA Team Lead:** TBD
- **DevOps Team Lead:** TBD
- **Product Owner:** TBD

---

**Last Updated:** 2025-10-17  
**Next Review:** Weekly during implementation

