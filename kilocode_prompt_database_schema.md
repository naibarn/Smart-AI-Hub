# Kilo Code Prompt: Database Schema Implementation

## 🎯 Objective

Implement database schema for Agent Skills & RAG System by adding new Prisma models to the existing `prisma/schema.prisma` file in the Smart-AI-Hub project.

---

## 📋 Task Overview

You need to complete the following tasks:

1. ✅ แก้ไข `prisma/schema.prisma` เพื่อเพิ่ม models ใหม่ทั้งหมด
2. ✅ รัน `npx prisma format` เพื่อ format schema
3. ✅ รัน `npx prisma migrate dev --name add_agent_skills_rag_system` เพื่อสร้าง migration
4. ✅ ตรวจสอบ migration files ที่ถูกสร้างขึ้น

---

## 📄 Specification References

Please read the following specification files carefully to understand the complete database schema requirements:

### 1. RAG System Models
**File**: `specs/014-agent-skills-rag-system/FR-RAG-001-RAG-System-Integration.md`

**Section to read**: 
- Section 4.1: Database Schema
- Models to implement:
  - `Document`
  - `DocumentChunk`
  - `Conversation`
  - `Message`

### 2. Pricing System Models
**File**: `specs/014-agent-skills-rag-system/FR-PRICING-001-Agent-Skills-Pricing-System.md`

**Section to read**:
- Section 4.1: Database Schema
- Models to implement:
  - `AgentPlatform`
  - `AgentModel`
  - `PricingRule`
  - `AgentUsageLog`
  - `CostEstimation`
  - `CreditReservation`

### 3. Marketplace Models
**File**: `specs/014-agent-skills-rag-system/FR-SKILLS-001-Agent-Skills-Marketplace.md`

**Section to read**:
- Section 4.1: Database Schema
- Models to implement:
  - `AgentSkill`
  - `SkillVersion`
  - `SkillCategory`
  - `SkillReview`
  - `SkillInstallation`

---

## 🎯 Requirements

### 1. Schema Location
- **File**: `prisma/schema.prisma`
- **Action**: Append new models to the existing file
- **Position**: Add at the end of the file with clear section comments

### 2. Section Comments
Add clear section comments to organize the new models:

```prisma
// ==========================================
// Agent Skills & RAG System Models
// Added: 2025-10-18
// Specs: FR-RAG-001, FR-PRICING-001, FR-SKILLS-001
// ==========================================

// RAG System Models
// ------------------------------------------
model Document {
  // ... (read from FR-RAG-001 spec)
}

// Pricing System Models
// ------------------------------------------
model AgentPlatform {
  // ... (read from FR-PRICING-001 spec)
}

// Marketplace Models
// ------------------------------------------
model AgentSkill {
  // ... (read from FR-SKILLS-001 spec)
}
```

### 3. Model Implementation Guidelines

**Important Notes**:
- ✅ Follow the exact schema definitions from the spec files
- ✅ Maintain all field names, types, and constraints as specified
- ✅ Include all indexes as defined in the specs
- ✅ Preserve all relations between models
- ✅ Use proper Prisma syntax and conventions
- ✅ Add `@@map()` directives for table names (snake_case)
- ✅ Add `@map()` directives for field names (snake_case)

### 4. Relations to Existing Models

Some new models have relations to existing models in the schema:
- `Document.userId` → `User.id`
- `AgentUsageLog.userId` → `User.id`
- `AgentSkill.creatorId` → `User.id`
- `SkillReview.userId` → `User.id`
- etc.

**Action Required**: 
- Add reverse relations to existing models if needed
- Example: Add `documents Document[]` to `User` model

### 5. Migration Name
Use the following migration name:
```
add_agent_skills_rag_system
```

---

## ✅ Acceptance Criteria

### 1. Schema File
- [ ] All 15 models are added to `prisma/schema.prisma`
- [ ] Models are organized with clear section comments
- [ ] All fields, types, and constraints match the specs
- [ ] All indexes are included
- [ ] All relations are properly defined
- [ ] File is properly formatted (after running `npx prisma format`)

### 2. Migration
- [ ] Migration is successfully created
- [ ] Migration file is in `prisma/migrations/` directory
- [ ] Migration file name includes timestamp and `add_agent_skills_rag_system`
- [ ] Migration SQL creates all 15 tables
- [ ] Migration SQL creates all indexes
- [ ] Migration SQL creates all foreign key constraints

### 3. Validation
- [ ] No Prisma syntax errors
- [ ] No relation errors
- [ ] Schema validates successfully
- [ ] Migration can be applied without errors

---

## 🚫 What NOT to Do

- ❌ Do NOT modify existing models unless adding reverse relations
- ❌ Do NOT change existing field names or types
- ❌ Do NOT remove any existing models
- ❌ Do NOT create example code or implementation files
- ❌ Do NOT modify any files other than `prisma/schema.prisma`

---

## 📝 Deliverables

After completing this task, you should have:

1. ✅ Updated `prisma/schema.prisma` with 15 new models
2. ✅ Migration file in `prisma/migrations/YYYYMMDDHHMMSS_add_agent_skills_rag_system/`
3. ✅ Confirmation that schema validates successfully
4. ✅ Summary of changes made

---

## 🔍 Verification Steps

After implementation, verify:

1. **Schema Validation**:
   ```bash
   npx prisma validate
   ```
   Should output: "The schema is valid"

2. **Migration Status**:
   ```bash
   npx prisma migrate status
   ```
   Should show the new migration

3. **Model Count**:
   Count the total number of models in schema.prisma
   Should include 15 new models

---

## 📚 Additional Context

### Project Information
- **Project**: Smart-AI-Hub
- **Repository**: https://github.com/naibarn/Smart-AI-Hub
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Current Schema**: `prisma/schema.prisma`

### Existing Models (Do Not Modify)
The schema already contains models for:
- User management
- Authentication
- Credits/Points system
- Subscriptions
- Organizations
- etc.

### New Models Summary
You are adding 15 new models across 3 domains:
- **RAG System**: 4 models
- **Pricing System**: 6 models
- **Marketplace**: 5 models

---

## 🎯 Success Criteria

This task is considered complete when:

1. ✅ All 15 models are correctly added to `prisma/schema.prisma`
2. ✅ Schema is properly formatted and validates without errors
3. ✅ Migration is successfully created and can be applied
4. ✅ All tables, indexes, and constraints are created correctly
5. ✅ No breaking changes to existing models

---

## 📞 Questions?

If you encounter any issues or need clarification:
- Refer back to the specification files for detailed schema definitions
- Check existing models in `prisma/schema.prisma` for syntax examples
- Ensure all field types and constraints match the specs exactly

---

**Ready to proceed?** 

Please read the specification files carefully and implement the database schema as described. Good luck! 🚀

