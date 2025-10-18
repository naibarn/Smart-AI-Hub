---
title: 'RAG System with Multi-tier Access Control Integration'
author: 'Development Team'
created_date: '2025-10-18'
last_updated: '2025-10-18'
version: '1.0'
status: 'Draft'
priority: 'P1 - High'
related_specs: ['FR-001-Authentication', 'FR-002-Authorization', 'FR-003-Agent-Marketplace']
---

# RAG System with Multi-tier Access Control Integration

## 1. ภาพรวม (Overview)

ระบบ RAG (Retrieval-Augmented Generation) พร้อมการควบคุมสิทธิ์การเข้าถึงข้อมูลแบบหลายระดับ เป็นฟีเจอร์สำคัญที่ช่วยให้ Agents ในระบบ Smart AI Hub สามารถเข้าถึงและใช้งานข้อมูลที่เกี่ยวข้องได้อย่างมีประสิทธิภาพและปลอดภัย ระบบนี้รองรับการแชร์ข้อมูลในระดับต่างๆ ตั้งแต่ส่วนตัว (Private) ไปจนถึงสาธารณะ (Public) พร้อมทั้งประหยัดพื้นที่จัดเก็บด้วยการแชร์ข้อมูลที่จุดเดียว

**เทคโนโลยีหลัก**:
- **Cloudflare Vectorize**: Vector database สำหรับ semantic search
- **Cloudflare R2**: Object storage สำหรับเก็บไฟล์เอกสาร
- **Cloudflare D1**: SQLite database สำหรับ metadata
- **Workers AI**: Embedding generation service
- **TypeScript**: ภาษาหลักสำหรับพัฒนา (migrate จาก Java)

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้ Agents สามารถเข้าถึงข้อมูลที่เกี่ยวข้องได้อย่างรวดเร็วและแม่นยำผ่าน semantic search
- รองรับการแชร์ข้อมูลในระดับต่างๆ (Private, Agent, Agency, Organization, Public)
- ประหยัดพื้นที่จัดเก็บด้วยการแชร์ข้อมูลที่จุดเดียว (single source of truth)
- อัปเดตข้อมูลได้ง่ายโดยไม่ต้อง sync หลายที่
- รักษาความปลอดภัยของข้อมูลด้วย access control ที่เข้มงวด
- รองรับการเข้าถึงผ่าน API Gateway และ MCP Server
- ให้ UI ที่เข้าใจง่ายสำหรับการอัปโหลดและจัดการสิทธิ์

## 3. User Stories

### Story 1: อัปโหลดเอกสารส่วนตัว (Priority: P1)

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** อัปโหลดเอกสารส่วนตัวเข้าสู่ระบบ RAG  
**เพื่อที่จะ** ให้ Agent ของฉันสามารถเข้าถึงและใช้ข้อมูลในเอกสารได้

**Why this priority**: เป็นฟังก์ชันพื้นฐานที่จำเป็นสำหรับการใช้งาน RAG system

**Independent Test**: สามารถทดสอบได้โดยการอัปโหลดไฟล์ PDF และตรวจสอบว่า Agent สามารถค้นหาข้อมูลในไฟล์ได้

**Acceptance Scenarios**:

1. **Given** ผู้ใช้ล็อกอินเข้าระบบแล้ว, **When** ผู้ใช้อัปโหลดไฟล์ PDF ขนาด 2 MB พร้อมตั้งค่า access level เป็น "Private", **Then** ระบบต้องประมวลผลไฟล์ สร้าง embeddings และเก็บลง Vectorize สำเร็จ
2. **Given** เอกสารถูกอัปโหลดแล้ว, **When** Agent ของผู้ใช้ query ข้อมูลที่เกี่ยวข้อง, **Then** ระบบต้องส่งผลลัพธ์ที่ relevant กลับมา
3. **Given** ผู้ใช้คนอื่นพยายามเข้าถึงเอกสาร Private, **When** ผู้ใช้คนอื่น query ข้อมูล, **Then** ระบบต้องไม่แสดงผลลัพธ์จากเอกสาร Private นั้น

### Story 2: แชร์เอกสารกับ Organization (Priority: P1)

**ในฐานะ** Manager หรือ Admin  
**ฉันต้องการ** แชร์เอกสารให้ทุกคนใน Organization เข้าถึงได้  
**เพื่อที่จะ** ให้ทีมทั้งหมดสามารถใช้ข้อมูลร่วมกันได้

**Why this priority**: เป็นฟีเจอร์สำคัญสำหรับการทำงานร่วมกันในองค์กร

**Independent Test**: Manager อัปโหลดเอกสารและตั้งค่าเป็น "Organization" แล้ว user ทั่วไปในองค์กรเดียวกันสามารถค้นหาข้อมูลได้

**Acceptance Scenarios**:

1. **Given** ผู้ใช้มี role เป็น Manager, **When** อัปโหลดเอกสารและเลือก access level เป็น "Organization", **Then** ระบบต้องอนุญาตและบันทึกการตั้งค่าสำเร็จ
2. **Given** เอกสารถูกแชร์ที่ระดับ Organization, **When** ผู้ใช้ทั่วไปในองค์กรเดียวกัน query ข้อมูล, **Then** ระบบต้องแสดงผลลัพธ์จากเอกสารนั้น
3. **Given** ผู้ใช้จากองค์กรอื่น, **When** พยายาม query ข้อมูล, **Then** ระบบต้องไม่แสดงผลลัพธ์จากเอกสารนั้น

### Story 3: แชร์เอกสารกับ Agent เฉพาะ (Priority: P2)

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** แชร์เอกสารให้เฉพาะ Agent ที่เลือกเท่านั้น  
**เพื่อที่จะ** ควบคุมการเข้าถึงข้อมูลได้อย่างละเอียด

**Why this priority**: เพิ่มความยืดหยุ่นในการจัดการสิทธิ์

**Independent Test**: อัปโหลดเอกสารและเลือก Agent A และ B แล้ว Agent C ไม่สามารถเข้าถึงข้อมูลได้

**Acceptance Scenarios**:

1. **Given** ผู้ใช้อัปโหลดเอกสาร, **When** เลือก access level เป็น "Agent" และเลือก Agent A และ B, **Then** ระบบต้องบันทึก shared_with_agent_ids ถูกต้อง
2. **Given** เอกสารถูกแชร์กับ Agent A, **When** Agent A query ข้อมูล, **Then** ระบบต้องแสดงผลลัพธ์
3. **Given** เอกสารไม่ได้แชร์กับ Agent C, **When** Agent C query ข้อมูล, **Then** ระบบต้องไม่แสดงผลลัพธ์

### Story 4: Query ข้อมูลผ่าน MCP Server (Priority: P1)

**ในฐานะ** Agent  
**ฉันต้องการ** query ข้อมูลจาก RAG ผ่าน MCP Server  
**เพื่อที่จะ** ใช้ข้อมูลในการตอบคำถามผู้ใช้

**Why this priority**: เป็น integration point สำคัญสำหรับ Agents

**Independent Test**: Agent เรียก MCP tool `query_rag` และได้ผลลัพธ์ที่ relevant กลับมา

**Acceptance Scenarios**:

1. **Given** Agent มี agentId ที่ถูกต้อง, **When** เรียก MCP tool `query_rag` พร้อม query text, **Then** ระบบต้องส่งผลลัพธ์ที่ Agent มีสิทธิ์เข้าถึงกลับมา
2. **Given** ผู้ใช้มีเอกสาร Private, **When** Agent ของผู้ใช้คนอื่น query, **Then** ระบบต้องไม่แสดงเอกสาร Private นั้น
3. **Given** มีเอกสาร Public, **When** Agent ใดๆ query, **Then** ระบบต้องแสดงเอกสาร Public ได้

### Story 5: เปลี่ยนสิทธิ์การเข้าถึงเอกสาร (Priority: P2)

**ในฐานะ** เจ้าของเอกสาร  
**ฉันต้องการ** เปลี่ยนสิทธิ์การเข้าถึงเอกสารที่อัปโหลดไว้แล้ว  
**เพื่อที่จะ** ปรับการแชร์ตามความต้องการ

**Why this priority**: เพิ่มความยืดหยุ่นในการจัดการ

**Independent Test**: เปลี่ยน access level จาก Private เป็น Agency แล้วคนในทีมสามารถเข้าถึงได้

**Acceptance Scenarios**:

1. **Given** ผู้ใช้เป็นเจ้าของเอกสาร, **When** เปลี่ยน access level จาก "Private" เป็น "Agency", **Then** ระบบต้องอัปเดต metadata ใน D1 และ Vectorize สำเร็จ
2. **Given** access level ถูกเปลี่ยนเป็น "Agency", **When** คนในทีมเดียวกัน query, **Then** ระบบต้องแสดงผลลัพธ์จากเอกสารนั้น
3. **Given** ผู้ใช้ไม่ใช่เจ้าของเอกสาร, **When** พยายามเปลี่ยน access level, **Then** ระบบต้อง reject ด้วย error 403

### Edge Cases

- **เอกสารขนาดใหญ่**: ถ้าเอกสารมีขนาดเกิน 10 MB ระบบต้องแสดง error และแนะนำให้แบ่งไฟล์
- **Format ไม่รองรับ**: ถ้าอัปโหลดไฟล์ที่ไม่รองรับ (เช่น .exe) ระบบต้อง reject ทันที
- **Duplicate content**: ถ้าอัปโหลดเอกสารที่มีเนื้อหาเหมือนกัน ระบบควรแจ้งเตือนแต่ยังอนุญาตให้อัปโหลด
- **Organization ไม่มี**: ถ้าผู้ใช้ไม่ได้อยู่ใน Organization ระบบต้องซ่อนตัวเลือก "Organization" และ "Agency"
- **Agent ถูกลบ**: ถ้า Agent ที่แชร์ไว้ถูกลบ ระบบต้องลบ agentId ออกจาก shared_with_agent_ids อัตโนมัติ

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)

- การอัปโหลดเอกสาร (PDF, DOCX, XLSX, TXT, MD)
- การประมวลผลเอกสารและสร้าง embeddings
- การจัดเก็บ vectors ใน Cloudflare Vectorize
- การจัดเก็บไฟล์ใน Cloudflare R2
- การควบคุมสิทธิ์การเข้าถึงแบบ 5 ระดับ (Private, Agent, Agency, Organization, Public)
- การ query ข้อมูลผ่าน API Gateway
- การ query ข้อมูลผ่าน MCP Server
- UI สำหรับอัปโหลดและจัดการสิทธิ์
- Access logging สำหรับ audit
- การเปลี่ยนสิทธิ์การเข้าถึงเอกสาร

### 4.2 นอกขอบเขตงาน (Out of Scope)

- การ OCR สำหรับรูปภาพ (จะพัฒนาใน Phase 2)
- การรองรับไฟล์วิดีโอและเสียง (จะพัฒนาใน Phase 2)
- Hybrid Search (semantic + keyword) - จะพัฒนาใน Phase 2
- Reranking ด้วย Cohere API - จะพัฒนาใน Phase 2
- Multi-modal RAG (text + images) - จะพัฒนาใน Phase 3
- Conversation memory - จะพัฒนาใน Phase 3

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Backend API Endpoints

#### RAG Service Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/rag/documents/upload` | อัปโหลดเอกสาร | `{ file, title, accessLevel, sharedWithAgentIds, agentId }` | `{ success, document }` |
| GET | `/api/rag/documents` | ดึงรายการเอกสาร | Query: `{ agentId?, accessLevel? }` | `{ documents }` |
| GET | `/api/rag/documents/:id` | ดึงข้อมูลเอกสาร | - | `{ document }` |
| PUT | `/api/rag/documents/:id/access` | เปลี่ยนสิทธิ์การเข้าถึง | `{ accessLevel, sharedWithAgentIds }` | `{ success, document }` |
| DELETE | `/api/rag/documents/:id` | ลบเอกสาร | - | `{ success }` |
| POST | `/api/rag/query` | ค้นหาข้อมูล | `{ query, agentId?, topK? }` | `{ results }` |
| GET | `/api/rag/documents/:id/download` | ดาวน์โหลดเอกสาร | - | File stream |

### 5.2 Database Schema

#### D1 Tables

```sql
-- Organizations
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    allow_public_sharing BOOLEAN DEFAULT false,
    allow_cross_agency_sharing BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agencies
CREATE TABLE agencies (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    allow_public_sharing BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(organization_id, slug)
);

-- Users (extended)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    organization_id TEXT,
    agency_id TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

-- Documents
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT,
    agency_id TEXT,
    agent_id TEXT,
    title TEXT NOT NULL,
    filename TEXT,
    file_type TEXT,
    file_size INTEGER,
    r2_bucket TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    vectorize_index TEXT NOT NULL,
    vectorize_namespace TEXT,
    total_chunks INTEGER DEFAULT 0,
    access_level TEXT NOT NULL DEFAULT 'PRIVATE',
    shared_with_agent_ids TEXT[],
    allow_download BOOLEAN DEFAULT true,
    allow_copy BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT valid_access_level CHECK (
        access_level IN ('PRIVATE', 'AGENT', 'AGENCY', 'ORGANIZATION', 'PUBLIC')
    )
);

-- Document chunks
CREATE TABLE document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_size INTEGER,
    vector_id TEXT NOT NULL,
    embedding_model TEXT DEFAULT 'bge-base-en-v1.5',
    page_number INTEGER,
    section_title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE(document_id, chunk_index)
);

-- Access logs
CREATE TABLE document_access_logs (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    agent_id TEXT,
    action TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    granted BOOLEAN NOT NULL,
    denied_reason TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_agency ON documents(agency_id);
CREATE INDEX idx_documents_agent ON documents(agent_id);
CREATE INDEX idx_documents_access_level ON documents(access_level);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_access_logs_document ON document_access_logs(document_id);
CREATE INDEX idx_access_logs_user ON document_access_logs(user_id);
```

### 5.3 Vectorize Configuration

```typescript
// Vectorize indexes
const VECTORIZE_INDEXES = {
  DOCUMENTS: 'documents-index',
  CONVERSATIONS: 'conversations-index',
  SKILLS_KNOWLEDGE: 'skills-knowledge-index',
};

// Index configuration
const DOCUMENTS_INDEX_CONFIG = {
  dimensions: 768, // bge-base-en-v1.5
  metric: 'cosine',
  metadata_indexed: [
    'documentId',
    'userId',
    'organizationId',
    'agencyId',
    'agentId',
    'accessLevel',
  ],
};
```

### 5.4 R2 Configuration

```typescript
// R2 buckets
const R2_BUCKETS = {
  DOCUMENTS: 'smart-ai-hub-documents',
  IMAGES: 'smart-ai-hub-images',
  VIDEOS: 'smart-ai-hub-videos',
};

// File structure
// smart-ai-hub-documents/
//   {organizationId}/
//     {userId}/
//       {documentId}/
//         original.{ext}
//         chunks/
//           chunk-0.txt
//           chunk-1.txt
```

### 5.5 MCP Server Tools

```typescript
// MCP Tools
const MCP_TOOLS = {
  QUERY_RAG: 'query_rag',
  UPLOAD_DOCUMENT: 'upload_document',
  LIST_DOCUMENTS: 'list_documents',
  GET_DOCUMENT: 'get_document',
};

// Tool schemas
const QUERY_RAG_SCHEMA = {
  name: 'query_rag',
  description: 'Query the RAG system for relevant information',
  inputSchema: {
    query: 'string (required)',
    agentId: 'string (optional)',
    topK: 'number (optional, default: 5)',
  },
};
```

### 5.6 Security Requirements

- **Authentication**: ทุก API endpoint ต้องผ่าน JWT authentication
- **Authorization**: ตรวจสอบ access level ทุกครั้งที่ query
- **Rate Limiting**: สูงสุด 100 requests ต่อนาทีต่อ user
- **File Validation**: ตรวจสอบ file type และขนาดก่อนอัปโหลด
- **Access Logging**: บันทึกทุก access attempt
- **HTTPS Only**: ทุก communication ต้องผ่าน HTTPS

### 5.7 Frontend Requirements

- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **State Management**: React Query (TanStack Query)
- **File Upload**: react-dropzone
- **Responsive Design**: รองรับ mobile และ tablet

## 6. การทดสอบ (Testing Criteria)

### 6.1 Unit Tests

- [ ] ทดสอบ document loader สำหรับแต่ละ file type
- [ ] ทดสอบ text splitter
- [ ] ทดสอบ embedding generation
- [ ] ทดสอบ access control logic
- [ ] ทดสอบ vector metadata builder
- [ ] ทดสอบ filter builder

### 6.2 Integration Tests

- [ ] ทดสอบ upload flow ตั้งแต่ต้นจนจบ
- [ ] ทดสอบ query flow พร้อม access control
- [ ] ทดสอบ access level changes
- [ ] ทดสอบ MCP tool integration
- [ ] ทดสอบ R2 file operations
- [ ] ทดสอบ Vectorize operations

### 6.3 E2E Tests

- [ ] ทดสอบ upload document ผ่าน UI
- [ ] ทดสอบ query ผ่าน Agent
- [ ] ทดสอบ access control scenarios ทั้งหมด
- [ ] ทดสอบ permission changes ผ่าน UI
- [ ] ทดสอบ document deletion

### 6.4 Performance Tests

- [ ] ทดสอบ upload เอกสาร 100 ไฟล์พร้อมกัน
- [ ] ทดสอบ query 1000 requests พร้อมกัน
- [ ] ทดสอบ embedding generation speed
- [ ] ทดสอบ vector search latency

## 7. Dependencies และ Assumptions

### 7.1 Dependencies

- **Cloudflare Account**: ต้องมี Cloudflare account พร้อม Workers, R2, D1, Vectorize
- **Workers AI**: ต้องเปิดใช้งาน Workers AI สำหรับ embedding
- **PostgreSQL**: ต้องมี PostgreSQL สำหรับ main database (ใช้ร่วมกับ D1)
- **Redis**: ต้องมี Redis สำหรับ caching
- **Existing Services**: auth-service, core-service, api-gateway, mcp-server

### 7.2 Assumptions

- ผู้ใช้ต้องล็อกอินก่อนใช้งาน RAG
- Organization และ Agency structure มีอยู่แล้วในระบบ
- Agents มี unique ID ที่ถูกต้อง
- ระบบทำงานบน HTTPS ใน production
- Free tier ของ Cloudflare เพียงพอสำหรับ MVP

## 8. Non-Functional Requirements

### 8.1 Performance

- **Upload Speed**: ประมวลผลไฟล์ 1 MB ภายใน 5 วินาที
- **Query Latency**: ส่งผลลัพธ์ภายใน 500ms (P95)
- **Embedding Generation**: สร้าง embeddings ภายใน 2 วินาที/1000 tokens
- **Concurrent Users**: รองรับ 1000 concurrent users

### 8.2 Scalability

- **Documents**: รองรับ 1M documents
- **Vectors**: รองรับ 5M vectors (Vectorize free tier limit)
- **Storage**: รองรับ 10 GB files (R2 free tier)
- **Organizations**: รองรับ 10,000 organizations

### 8.3 Availability

- **Uptime**: อย่างน้อย 99.9%
- **Data Durability**: 99.999999999% (R2 guarantee)
- **Backup**: Daily backup ของ D1 database

### 8.4 Usability

- **Upload UI**: ใช้งานง่าย drag & drop
- **Access Control UI**: แสดงระดับการแชร์ชัดเจน
- **Error Messages**: ข้อความ error เข้าใจง่าย
- **Mobile Support**: รองรับ mobile devices

## 9. Risks และ Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Vectorize free tier limit | High | Medium | Monitor usage และเตรียม upgrade plan |
| Embedding quality ต่ำ | High | Low | ทดสอบหลาย models และเลือกที่ดีที่สุด |
| Access control bugs | Critical | Medium | เขียน comprehensive tests และ code review |
| R2 upload failures | Medium | Low | Implement retry mechanism และ error handling |
| Performance degradation | High | Medium | Implement caching และ optimization |
| Data privacy breach | Critical | Low | Strict access control และ audit logging |

## 10. Timeline และ Milestones

| Milestone | Target Date | Status | Dependencies |
|-----------|-------------|--------|--------------|
| **Phase 1: Foundation** | | | |
| Setup Vectorize indexes | Week 1 | Not Started | Cloudflare account |
| Implement document loaders | Week 1 | Not Started | - |
| Implement text splitter | Week 1 | Not Started | - |
| Build embedding service | Week 1 | Not Started | Workers AI |
| Create D1 schema | Week 1 | Not Started | - |
| **Phase 2: Core Features** | | | |
| Implement RAG service | Week 2 | Not Started | Phase 1 |
| Build access control logic | Week 2 | Not Started | Phase 1 |
| Create API endpoints | Week 2 | Not Started | Phase 1 |
| Implement R2 integration | Week 2 | Not Started | Phase 1 |
| **Phase 3: Integration** | | | |
| Integrate with API Gateway | Week 3 | Not Started | Phase 2 |
| Build MCP tools | Week 3 | Not Started | Phase 2 |
| Implement access logging | Week 3 | Not Started | Phase 2 |
| **Phase 4: Frontend** | | | |
| Build upload UI | Week 4 | Not Started | Phase 2 |
| Build document list UI | Week 4 | Not Started | Phase 2 |
| Build access control UI | Week 4 | Not Started | Phase 2 |
| **Phase 5: Testing & Deployment** | | | |
| Unit tests | Week 5 | Not Started | All phases |
| Integration tests | Week 5 | Not Started | All phases |
| E2E tests | Week 5 | Not Started | All phases |
| Performance tests | Week 5 | Not Started | All phases |
| Production deployment | Week 6 | Not Started | All tests pass |

## 11. Success Criteria

### Measurable Outcomes

- **SC-001**: ผู้ใช้สามารถอัปโหลดเอกสารและ query ได้สำเร็จภายใน 2 นาที
- **SC-002**: Query latency ไม่เกิน 500ms (P95)
- **SC-003**: Access control ทำงานถูกต้อง 100% (ไม่มี unauthorized access)
- **SC-004**: ผู้ใช้ 90% สามารถตั้งค่า access level ได้ถูกต้องในครั้งแรก
- **SC-005**: ระบบรองรับ 1000 concurrent queries โดยไม่มี degradation
- **SC-006**: Upload success rate อย่างน้อย 99%

## 12. Technical Stack Summary

### Backend Services

| Component | Technology | Purpose |
|-----------|------------|---------|
| **rag-service** | TypeScript + Cloudflare Workers | Core RAG logic |
| **Vector Database** | Cloudflare Vectorize | Store embeddings |
| **Object Storage** | Cloudflare R2 | Store documents |
| **Metadata DB** | Cloudflare D1 | Store metadata |
| **Embedding** | Workers AI (bge-base-en-v1.5) | Generate embeddings |
| **Cache** | Redis | Cache queries และ permissions |

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | React 18 + TypeScript | UI framework |
| **UI Library** | Material-UI v5 | Components |
| **Forms** | React Hook Form + Zod | Form handling |
| **State** | React Query | Server state |
| **File Upload** | react-dropzone | File upload |

### Integration

| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Gateway** | Express + TypeScript | Route requests |
| **MCP Server** | Node.js + TypeScript | Agent integration |
| **Auth** | JWT + RBAC | Authentication & Authorization |

## 13. Migration from Java to TypeScript

### Current State
- บางส่วนของระบบยังเป็น Java
- ต้อง migrate เป็น TypeScript เพื่อความสอดคล้อง

### Migration Strategy

1. **Identify Java Components**: ระบุ components ที่เป็น Java
2. **Create TypeScript Equivalents**: สร้าง TypeScript version
3. **Parallel Running**: รัน Java และ TypeScript แบบ parallel
4. **Gradual Migration**: ย้าย traffic ทีละส่วน
5. **Deprecate Java**: ปิด Java components เมื่อมั่นใจ

### Priority
- RAG service เป็น TypeScript ตั้งแต่แรก
- Existing services ค่อยๆ migrate ทีหลัง

## 14. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | - | - | Pending |
| Tech Lead | - | - | Pending |
| QA Lead | - | - | Pending |
| Security Lead | - | - | Pending |

---

**หมายเหตุ**: เอกสารนี้เป็น Living Document และจะถูกอัปเดตตามความจำเป็น การเปลี่ยนแปลงใดๆ ต้องผ่านการอนุมัติจาก Product Owner และ Tech Lead

**Related Documents**:
- [RAG Access Control Architecture](/home/ubuntu/RAG_Access_Control_Architecture.md)
- [Cloudflare Vectorize RAG Architecture](/home/ubuntu/Cloudflare_Vectorize_RAG_Architecture_for_Smart_AI_Hub.md)
- [Cloudflare R2 Storage Implementation Guide](/home/ubuntu/Cloudflare_R2_Storage_Implementation_Guide.md)
- [RAG Additional Components Guide](/home/ubuntu/RAG_Additional_Components_Guide.md)
- [Agent Skills Integration Report](/home/ubuntu/Agent_Skills_Integration_Report_for_Smart_AI_Hub.md)

