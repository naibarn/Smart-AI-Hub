# Agent Skills & RAG System Specifications

**Domain**: 014-agent-skills-rag-system  
**Created**: 2025-10-18  
**Status**: Draft  
**Priority**: P1 - High

---

## 📋 Overview

โฟลเดอร์นี้รวมเอกสาร specifications สำหรับระบบ Agent Skills และ RAG System ที่จะ integrate เข้ากับโปรเจกต์ Smart-AI-Hub ประกอบด้วย 3 feature specifications หลัก:

1. **RAG System Integration** - ระบบ RAG พร้อม multi-tier access control
2. **Pricing System** - ระบบกำหนดราคาและตัดเครดิตสำหรับ agent skills
3. **Skills Marketplace** - ตลาดกลางสำหรับแชร์และจัดจำหน่าย agent skills

---

## 📄 Specification Files

### 1. FR-RAG-001: RAG System Integration

**File**: `FR-RAG-001-RAG-System-Integration.md`

**ภาพรวม**:
ระบบ RAG (Retrieval-Augmented Generation) พร้อมการควบคุมสิทธิ์การเข้าถึงข้อมูลแบบหลายระดับ ช่วยให้ Agents สามารถเข้าถึงและใช้งานข้อมูลที่เกี่ยวข้องได้อย่างมีประสิทธิภาพและปลอดภัย

**เทคโนโลยีหลัก**:
- Cloudflare Vectorize (Vector database)
- Cloudflare R2 (Object storage)
- Cloudflare D1 (SQLite database)
- Workers AI (Embedding generation)
- TypeScript

**Features**:
- ✅ อัปโหลดและจัดการเอกสาร (PDF, DOCX, TXT, Markdown, etc.)
- ✅ Multi-tier access control (Private, Agent, Agency, Organization, Public)
- ✅ Semantic search ด้วย vector embeddings
- ✅ Conversation memory และ context management
- ✅ API Gateway และ MCP Server integration
- ✅ UI สำหรับจัดการเอกสารและสิทธิ์

**Priority**: P1 - High

**Dependencies**:
- FR-001: Authentication
- FR-002: Authorization
- FR-003: Agent Marketplace

---

### 2. FR-PRICING-001: Agent Skills Pricing System

**File**: `FR-PRICING-001-Agent-Skills-Pricing-System.md`

**ภาพรวม**:
ระบบกำหนดราคาและตัดเครดิตสำหรับ Agent Skills ที่รองรับหลาย platforms พร้อมการคำนวณค่าใช้จ่ายแบบละเอียดและระบบตัดเครดิตแบบ real-time

**เทคโนโลยีหลัก**:
- TypeScript
- PostgreSQL (Prisma ORM)
- Redis (Caching & Locking)

**Features**:
- ✅ รองรับหลาย platforms (Custom GPT, Gemini Gems, Claude Skills, Vertex AI, etc.)
- ✅ คำนวณค่าใช้จ่ายแยกตาม components (LLM, RAG, Tool calls, Nested agents)
- ✅ Credit reservation mechanism
- ✅ Real-time credit deduction
- ✅ Cost estimation API
- ✅ Nested agent calls support
- ✅ Flexible pricing rules (tier-based, markup, etc.)
- ✅ Admin pricing dashboard
- ✅ Cost breakdown และ usage history

**Priority**: P1 - High

**Dependencies**:
- FR-RAG-001: RAG System
- FR-SKILLS-001: Skills Marketplace
- FR-004: Financial System

---

### 3. FR-SKILLS-001: Agent Skills Marketplace

**File**: `FR-SKILLS-001-Agent-Skills-Marketplace.md`

**ภาพรวม**:
แพลตฟอร์มสำหรับการแชร์และจัดจำหน่าย Agent Skills ที่ผู้ใช้สร้างขึ้น รองรับการ publish, discover, install และ review skills

**เทคโนโลยีหลัก**:
- TypeScript
- PostgreSQL (Prisma ORM)
- Cloudflare R2 (Skill files storage)
- Cloudflare Vectorize (Search & recommendation)

**Features**:
- ✅ สร้างและ publish skills
- ✅ ค้นหาและติดตั้ง skills
- ✅ Review และ rating system
- ✅ Approval workflow
- ✅ Version management
- ✅ Category และ tag system
- ✅ Usage tracking
- ✅ Admin moderation tools

**Priority**: P2 - Medium

**Dependencies**:
- FR-RAG-001: RAG System
- FR-PRICING-001: Pricing System
- FR-003: Access Control

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Smart AI Hub Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ RAG System   │  │ Pricing      │  │ Marketplace  │      │
│  │              │  │ System       │  │              │      │
│  │ - Documents  │  │ - Cost Calc  │  │ - Skills     │      │
│  │ - Vectorize  │  │ - Credits    │  │ - Reviews    │      │
│  │ - Access Ctl │  │ - Usage Log  │  │ - Install    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │              Agent Service (New)                    │     │
│  │  - RAG Service                                      │     │
│  │  - Pricing Service                                  │     │
│  │  - Skills Service                                   │     │
│  │  - Credit Service (Enhanced)                        │     │
│  └─────────────────────────┬──────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │              API Gateway                            │     │
│  │  - Authentication                                   │     │
│  │  - Authorization                                    │     │
│  │  - Rate Limiting                                    │     │
│  └─────────────────────────┬──────────────────────────┘     │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │             │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐     │
│  │ Frontend    │  │ MCP Server      │  │ External   │     │
│  │ (React)     │  │                 │  │ Agents     │     │
│  └─────────────┘  └─────────────────┘  └────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Services                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Vectorize    │  │ R2 Storage   │  │ D1 Database  │      │
│  │ (Vectors)    │  │ (Files)      │  │ (Metadata)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Workers AI   │  │ CDN          │                         │
│  │ (Embeddings) │  │ (Delivery)   │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Summary

### New Tables (13 tables)

#### RAG System (4 tables)
- `documents` - เอกสารที่อัปโหลด
- `document_chunks` - Chunks ของเอกสาร
- `conversations` - บทสนทนา
- `messages` - ข้อความในบทสนทนา

#### Pricing System (6 tables)
- `agent_platforms` - Platforms (OpenAI, Anthropic, Google, etc.)
- `agent_models` - Models ของแต่ละ platform
- `pricing_rules` - กฎการกำหนดราคา
- `agent_usage_logs` - บันทึกการใช้งาน
- `cost_estimations` - ประมาณการค่าใช้จ่าย
- `credit_reservations` - การจอง credits

#### Marketplace (3 tables)
- `agent_skills` - Skills ทั้งหมด
- `skill_versions` - เวอร์ชันของ skills
- `skill_reviews` - Reviews และ ratings
- `skill_installations` - การติดตั้ง skills
- `skill_categories` - หมวดหมู่ของ skills

---

## 🎯 Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- Database schema
- Core services
- Basic API endpoints

### Phase 2: RAG System (Week 3-4)
- Document processing
- Vector search
- Access control

### Phase 3: Pricing System (Week 5-6)
- Cost calculation
- Credit management
- Usage tracking

### Phase 4: Frontend (Week 7-8)
- UI components
- Pages
- Integration

### Phase 5: Marketplace (Week 9-10)
- Skills management
- Review system
- Admin tools

### Phase 6: Testing & Deployment (Week 11-12)
- E2E tests
- Performance optimization
- Production deployment

**Total Duration**: 12 weeks (3 months)

---

## 💰 Cost Estimation

### Cloudflare Services (Free Tier)

| Service | Free Tier | Estimated Usage | Cost |
|---------|-----------|-----------------|------|
| Vectorize | 5M vectors, 30M queries/mo | 100K vectors, 1M queries | **$0** |
| R2 Storage | 10 GB storage | 5 GB | **$0** |
| D1 Database | 5 GB storage, 5M reads | 1 GB, 1M reads | **$0** |
| Workers AI | 10K requests/day | 5K requests/day | **$0** |
| **Total** | - | - | **$0/month** |

### Scaling Costs (Paid Tier)

| Service | Unit Price | At 1M users | Monthly Cost |
|---------|-----------|-------------|--------------|
| Vectorize | $0.04/1M queries | 100M queries | $4 |
| R2 Storage | $0.015/GB | 100 GB | $1.50 |
| D1 Database | $0.50/1M reads | 50M reads | $25 |
| Workers AI | $0.01/1K requests | 1M requests | $10 |
| **Total** | - | - | **$40.50/month** |

**Conclusion**: เริ่มต้นฟรี, scale up ได้ในราคาที่ถูกมาก

---

## 🔐 Security Considerations

### 1. Access Control
- Row-level security (RLS) สำหรับ documents
- RBAC สำหรับ admin functions
- JWT authentication
- API rate limiting

### 2. Data Protection
- Encryption at rest (R2)
- Encryption in transit (HTTPS)
- Sensitive data masking
- Audit logs

### 3. Financial Security
- Distributed locking สำหรับ credit operations
- Atomic transactions
- Automatic refund mechanism
- Fraud detection

---

## 📚 Related Documentation

### Technical Docs
- [RAG System Architecture](../docs/agent-skills/rag-system.md)
- [Pricing System Guide](../docs/agent-skills/pricing-system.md)
- [Marketplace Guide](../docs/agent-skills/marketplace.md)

### API Reference
- [Agent Service API](../docs/api/agent-service.md)
- [Pricing Endpoints](../docs/api/pricing-endpoints.md)
- [RAG Endpoints](../docs/api/rag-endpoints.md)
- [Skills Endpoints](../docs/api/skills-endpoints.md)

### Setup Guides
- [Cloudflare Setup](../docs/guides/cloudflare-setup.md)
- [Vectorize Guide](../docs/guides/vectorize-guide.md)
- [R2 Guide](../docs/guides/r2-guide.md)

---

## 🤝 Contributing

### Spec Review Process

1. **Draft** - เขียน spec ตาม template
2. **Review** - ทีมพัฒนา review และให้ feedback
3. **Revision** - แก้ไขตาม feedback
4. **Approval** - Tech lead approve
5. **Implementation** - เริ่มพัฒนาตาม spec

### Spec Template

ใช้ template จาก `.specify/templates/spec-template.md`

---

## 📞 Contact

**Spec Owner**: Development Team  
**Created**: 2025-10-18  
**Last Updated**: 2025-10-18

---

## ✅ Checklist

### Specifications
- [x] FR-RAG-001: RAG System Integration
- [x] FR-PRICING-001: Agent Skills Pricing System
- [x] FR-SKILLS-001: Agent Skills Marketplace
- [ ] Tech review completed
- [ ] Approved for implementation

### Implementation
- [ ] Database schema created
- [ ] Services implemented
- [ ] API endpoints implemented
- [ ] Frontend components implemented
- [ ] Tests written
- [ ] Documentation completed
- [ ] Deployed to production

---

**Status**: 📝 Draft - Ready for Review

