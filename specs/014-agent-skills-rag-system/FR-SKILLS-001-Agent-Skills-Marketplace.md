---
title: 'Agent Skills Marketplace Integration'
author: 'Development Team'
created_date: '2025-10-18'
last_updated: '2025-10-18'
version: '1.0'
status: 'Draft'
priority: 'P2 - Medium'
related_specs: ['FR-RAG-001-RAG-System', 'FR-PRICING-001-Pricing-System', 'FR-003-Access-Control']
---

# Agent Skills Marketplace Integration

## 1. ภาพรวม (Overview)

ระบบ Agent Skills Marketplace เป็นแพลตฟอร์มสำหรับการแชร์และจัดจำหน่าย Agent Skills ที่ผู้ใช้สร้างขึ้น รองรับการ publish, discover, install และ review skills จากผู้ใช้ทั่วโลก พร้อมระบบ approval และ moderation เพื่อรักษาคุณภาพ

**เทคโนโลยีหลัก**:
- **TypeScript**: ภาษาหลักสำหรับพัฒนา
- **PostgreSQL**: Database สำหรับ skills metadata
- **Cloudflare R2**: Storage สำหรับ skill files
- **Cloudflare Vectorize**: Search และ recommendation

## 2. วัตถุประสงค์ (Objectives)

ระบบนี้ถูกออกแบบมาเพื่อ:

- ให้ผู้ใช้สามารถสร้างและแชร์ skills ของตนเองได้
- ให้ผู้ใช้ค้นหาและติดตั้ง skills จากผู้อื่นได้ง่าย
- รักษาคุณภาพของ skills ด้วยระบบ review และ approval
- สร้าง community ของ skill creators
- รองรับการ monetization ในอนาคต

## 3. User Stories

### Story 1: สร้างและ Publish Skill (Priority: P2)

**ในฐานะ** Skill Creator  
**ฉันต้องการ** สร้างและ publish skill ของฉันไปยัง marketplace  
**เพื่อที่จะ** แชร์ให้ผู้อื่นใช้งานได้

**Acceptance Scenarios**:

```gherkin
Scenario: สร้าง skill ใหม่
  Given ผู้ใช้เข้าหน้า "Create Skill"
  When กรอกข้อมูล:
    - Name: "PDF Analyzer"
    - Description: "Analyze PDF documents and extract insights"
    - Category: "Document Processing"
    - Platform: "Claude Agent Skills"
    - Tags: ["pdf", "analysis", "document"]
  And อัปโหลด skill file (.zip)
  And อัปโหลดรูปภาพ icon
  And เลือก visibility: "Public"
  And กด "Publish"
  Then ระบบสร้าง skill draft
  And ส่ง skill ไปยัง approval queue
  And แสดงข้อความ "Your skill has been submitted for review"
```

### Story 2: ค้นหาและติดตั้ง Skill (Priority: P2)

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** ค้นหาและติดตั้ง skill ที่ต้องการ  
**เพื่อที่จะ** ใช้งาน skill นั้นกับ agents ของฉัน

**Acceptance Scenarios**:

```gherkin
Scenario: ค้นหา skill
  Given ผู้ใช้เข้าหน้า Marketplace
  When ค้นหาด้วยคำว่า "PDF"
  Then ระบบแสดงรายการ skills ที่เกี่ยวข้อง
  And แต่ละ skill แสดง:
    - Name และ icon
    - Description สั้นๆ
    - Rating (stars)
    - Install count
    - Creator name
    - Tags

Scenario: ติดตั้ง skill
  Given ผู้ใช้เลือก skill "PDF Analyzer"
  When กด "Install"
  Then ระบบดาวน์โหลด skill file
  And เพิ่ม skill เข้าใน user's installed skills
  And แสดงข้อความ "Skill installed successfully"
  And skill พร้อมใช้งานทันที
```

### Story 3: Review และ Rate Skill (Priority: P2)

**ในฐานะ** ผู้ใช้งาน  
**ฉันต้องการ** review และให้คะแนน skill ที่ใช้งาน  
**เพื่อที่จะ** ช่วยผู้อื่นตัดสินใจและให้ feedback แก่ creator

**Acceptance Scenarios**:

```gherkin
Scenario: เขียน review
  Given ผู้ใช้ติดตั้ง skill "PDF Analyzer" แล้ว
  When เข้าหน้า skill detail
  And กด "Write Review"
  And ให้คะแนน 5 ดาว
  And เขียน review: "Excellent tool for analyzing PDFs!"
  And กด "Submit"
  Then ระบบบันทึก review
  And อัปเดต average rating ของ skill
  And แสดง review ในหน้า skill detail
```

## 4. Technical Specification

### 4.1 Database Schema

#### 4.1.1 AgentSkill

```prisma
model AgentSkill {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(100)
  slug            String   @unique @db.VarChar(120)
  description     String   @db.Text
  longDescription String?  @map("long_description") @db.Text
  creatorId       String   @map("creator_id") @db.Uuid
  categoryId      String   @map("category_id") @db.Uuid
  platformId      String   @map("platform_id") @db.Uuid
  
  // Visibility
  visibility      String   @db.VarChar(20)  // public, organization, private
  organizationId  String?  @map("organization_id") @db.Uuid
  
  // Status
  status          String   @db.VarChar(20)  // draft, pending, approved, rejected, archived
  approvedBy      String?  @map("approved_by") @db.Uuid
  approvedAt      DateTime? @map("approved_at")
  rejectionReason String?  @map("rejection_reason") @db.Text
  
  // Metrics
  installCount    Int      @default(0) @map("install_count")
  averageRating   Decimal  @default(0) @map("average_rating") @db.Decimal(3, 2)
  reviewCount     Int      @default(0) @map("review_count")
  
  // Media
  iconUrl         String?  @map("icon_url") @db.Text
  screenshotUrls  Json     @default("[]") @map("screenshot_urls")
  
  // Metadata
  tags            String[] @db.VarChar(50)
  metadata        Json     @default("{}")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relations
  creator         User     @relation("CreatedSkills", fields: [creatorId], references: [id], onDelete: Cascade)
  category        SkillCategory @relation(fields: [categoryId], references: [id])
  platform        AgentPlatform @relation(fields: [platformId], references: [id])
  approver        User?    @relation("ApprovedSkills", fields: [approvedBy], references: [id])
  organization    Organization? @relation(fields: [organizationId], references: [id])
  
  versions        SkillVersion[]
  reviews         SkillReview[]
  installations   SkillInstallation[]
  
  @@index([creatorId])
  @@index([categoryId])
  @@index([platformId])
  @@index([status, visibility])
  @@index([slug])
  @@map("agent_skills")
}
```

#### 4.1.2 SkillVersion

```prisma
model SkillVersion {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  skillId         String   @map("skill_id") @db.Uuid
  version         String   @db.VarChar(20)  // 1.0.0
  changelog       String?  @db.Text
  fileUrl         String   @map("file_url") @db.Text
  fileSize        Int      @map("file_size")  // bytes
  fileHash        String   @map("file_hash") @db.VarChar(64)
  isLatest        Boolean  @default(false) @map("is_latest")
  downloadCount   Int      @default(0) @map("download_count")
  
  createdAt       DateTime @default(now()) @map("created_at")
  
  skill           AgentSkill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  @@unique([skillId, version])
  @@index([skillId, isLatest])
  @@map("skill_versions")
}
```

#### 4.1.3 SkillCategory

```prisma
model SkillCategory {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @unique @db.VarChar(50)
  slug        String   @unique @db.VarChar(60)
  description String?  @db.Text
  iconName    String?  @map("icon_name") @db.VarChar(50)
  parentId    String?  @map("parent_id") @db.Uuid
  sortOrder   Int      @default(0) @map("sort_order")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  parent      SkillCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    SkillCategory[] @relation("CategoryHierarchy")
  skills      AgentSkill[]
  
  @@map("skill_categories")
}
```

#### 4.1.4 SkillReview

```prisma
model SkillReview {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  skillId     String   @map("skill_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  rating      Int      @db.SmallInt  // 1-5
  title       String?  @db.VarChar(100)
  comment     String?  @db.Text
  isVerified  Boolean  @default(false) @map("is_verified")  // verified purchase
  
  helpfulCount Int     @default(0) @map("helpful_count")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  skill       AgentSkill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([skillId, userId])
  @@index([skillId, rating])
  @@map("skill_reviews")
}
```

#### 4.1.5 SkillInstallation

```prisma
model SkillInstallation {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  skillId     String   @map("skill_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  versionId   String   @map("version_id") @db.Uuid
  
  installedAt DateTime @default(now()) @map("installed_at")
  lastUsedAt  DateTime? @map("last_used_at")
  usageCount  Int      @default(0) @map("usage_count")
  
  skill       AgentSkill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  version     SkillVersion @relation(fields: [versionId], references: [id])
  
  @@unique([skillId, userId])
  @@index([userId])
  @@map("skill_installations")
}
```

### 4.2 API Endpoints

#### 4.2.1 Marketplace Endpoints

```typescript
// GET /api/marketplace/skills
// ค้นหา skills
GET /api/marketplace/skills?q=pdf&category=document&platform=claude&sort=popular&limit=20
Response: {
  skills: AgentSkill[];
  total: number;
  page: number;
  pageSize: number;
}

// GET /api/marketplace/skills/:skillId
// ดูรายละเอียด skill
GET /api/marketplace/skills/:skillId
Response: {
  skill: AgentSkill;
  latestVersion: SkillVersion;
  reviews: SkillReview[];
  isInstalled: boolean;
}

// POST /api/marketplace/skills/:skillId/install
// ติดตั้ง skill
POST /api/marketplace/skills/:skillId/install
Response: {
  installation: SkillInstallation;
  downloadUrl: string;
}

// GET /api/marketplace/categories
// ดูรายการ categories
GET /api/marketplace/categories
Response: {
  categories: SkillCategory[];
}
```

#### 4.2.2 Skill Management Endpoints

```typescript
// POST /api/skills
// สร้าง skill ใหม่
POST /api/skills
Request: {
  name: string;
  description: string;
  longDescription?: string;
  categoryId: string;
  platformId: string;
  visibility: 'public' | 'organization' | 'private';
  tags: string[];
}
Response: { skill: AgentSkill }

// PUT /api/skills/:skillId
// อัปเดต skill
PUT /api/skills/:skillId
Request: Partial<AgentSkill>
Response: { skill: AgentSkill }

// POST /api/skills/:skillId/versions
// อัปโหลด version ใหม่
POST /api/skills/:skillId/versions
Request: FormData {
  version: string;
  changelog: string;
  file: File;
}
Response: { version: SkillVersion }

// POST /api/skills/:skillId/publish
// Publish skill (ส่ง approval)
POST /api/skills/:skillId/publish
Response: { skill: AgentSkill }
```

#### 4.2.3 Review Endpoints

```typescript
// POST /api/skills/:skillId/reviews
// เขียน review
POST /api/skills/:skillId/reviews
Request: {
  rating: number;
  title?: string;
  comment?: string;
}
Response: { review: SkillReview }

// PUT /api/skills/:skillId/reviews/:reviewId
// แก้ไข review
PUT /api/skills/:skillId/reviews/:reviewId
Request: Partial<SkillReview>
Response: { review: SkillReview }

// POST /api/skills/:skillId/reviews/:reviewId/helpful
// ทำเครื่องหมาย review ว่า helpful
POST /api/skills/:skillId/reviews/:reviewId/helpful
Response: { success: boolean }
```

#### 4.2.4 Admin Endpoints

```typescript
// GET /api/admin/skills/pending
// ดู skills ที่รอ approval
GET /api/admin/skills/pending
Response: {
  skills: AgentSkill[];
  total: number;
}

// POST /api/admin/skills/:skillId/approve
// Approve skill
POST /api/admin/skills/:skillId/approve
Response: { skill: AgentSkill }

// POST /api/admin/skills/:skillId/reject
// Reject skill
POST /api/admin/skills/:skillId/reject
Request: {
  reason: string;
}
Response: { skill: AgentSkill }
```

### 4.3 Service Implementation

#### 4.3.1 SkillsService

```typescript
class SkillsService {
  async createSkill(userId: string, data: CreateSkillInput): Promise<AgentSkill>;
  async updateSkill(skillId: string, userId: string, data: UpdateSkillInput): Promise<AgentSkill>;
  async publishSkill(skillId: string, userId: string): Promise<AgentSkill>;
  async uploadVersion(skillId: string, userId: string, version: string, file: File): Promise<SkillVersion>;
  async getSkillById(skillId: string): Promise<AgentSkill>;
  async searchSkills(filters: SkillSearchFilters): Promise<SearchResult<AgentSkill>>;
  async getMySkills(userId: string): Promise<AgentSkill[]>;
}
```

#### 4.3.2 SkillInstallationService

```typescript
class SkillInstallationService {
  async installSkill(userId: string, skillId: string): Promise<SkillInstallation>;
  async uninstallSkill(userId: string, skillId: string): Promise<void>;
  async getInstalledSkills(userId: string): Promise<AgentSkill[]>;
  async trackUsage(userId: string, skillId: string): Promise<void>;
  private generateDownloadUrl(versionId: string): Promise<string>;
}
```

#### 4.3.3 SkillReviewService

```typescript
class SkillReviewService {
  async createReview(userId: string, skillId: string, data: CreateReviewInput): Promise<SkillReview>;
  async updateReview(reviewId: string, userId: string, data: UpdateReviewInput): Promise<SkillReview>;
  async deleteReview(reviewId: string, userId: string): Promise<void>;
  async markHelpful(reviewId: string, userId: string): Promise<void>;
  async getSkillReviews(skillId: string, filters: ReviewFilters): Promise<SkillReview[]>;
  private updateSkillRating(skillId: string): Promise<void>;
}
```

### 4.4 Frontend Components

#### 4.4.1 Marketplace Page

```typescript
// pages/AgentSkills/index.tsx
const MarketplacePage: React.FC = () => {
  // Search bar
  // Category filter
  // Platform filter
  // Sort options (popular, newest, highest rated)
  // Skills grid (SkillCard components)
  // Pagination
};
```

#### 4.4.2 Skill Detail Page

```typescript
// pages/AgentSkills/SkillDetail.tsx
const SkillDetailPage: React.FC = () => {
  // Skill header (name, icon, rating, install count)
  // Install/Uninstall button
  // Description
  // Screenshots
  // Version history
  // Reviews section
  // Related skills
};
```

#### 4.4.3 Create/Edit Skill Page

```typescript
// pages/AgentSkills/CreateSkill.tsx
const CreateSkillPage: React.FC = () => {
  // Form: name, description, category, platform, tags
  // Icon upload
  // Screenshot upload
  // Skill file upload
  // Visibility selector
  // Save draft / Publish buttons
};
```

## 5. Implementation Plan

### Phase 1: Database & Core Services (Week 1)

**Tasks**:
- [ ] สร้าง Prisma schema
- [ ] รัน migrations
- [ ] Seed categories และ platforms
- [ ] Implement SkillsService
- [ ] Implement SkillInstallationService
- [ ] เขียน unit tests

### Phase 2: API Endpoints (Week 2)

**Tasks**:
- [ ] Implement marketplace endpoints
- [ ] Implement skill management endpoints
- [ ] Implement review endpoints
- [ ] เขียน integration tests

### Phase 3: Frontend (Week 3)

**Tasks**:
- [ ] สร้าง Marketplace page
- [ ] สร้าง Skill Detail page
- [ ] สร้าง Create/Edit Skill page
- [ ] สร้าง My Skills page
- [ ] Integrate กับ API

### Phase 4: Admin & Testing (Week 4)

**Tasks**:
- [ ] Implement admin approval workflow
- [ ] E2E tests
- [ ] Bug fixes

### Phase 5: Deployment (Week 5)

**Tasks**:
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring

## 6. Success Metrics

- ✅ ผู้ใช้สามารถสร้างและ publish skills ได้
- ✅ ผู้ใช้สามารถค้นหาและติดตั้ง skills ได้
- ✅ ระบบ approval ทำงานถูกต้อง
- ✅ Reviews และ ratings แสดงผลถูกต้อง

## 7. Future Enhancements

- Skill monetization (paid skills)
- Skill analytics สำหรับ creators
- Skill recommendations based on user behavior
- Skill collections/bundles
- Community features (discussions, Q&A)

