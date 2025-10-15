---
title: "Role Data Model"
author: "Development Team"
created_date: "2025-10-15"
version: "1.0"
status: "Draft"
priority: "P1"
type: "data_model"
category: "architecture"
dependencies: ["user.md", "permission.md", "user_role.md", "role_permission.md"]
---

# Role Data Model

## 1. ภาพรวม (Overview)

Role เป็น data model ที่ใช้สำหรับจัดการสิทธิ์การใช้งานในระบบ Smart AI Hub โมเดลนี้กำหนดบทบาทและระดับการเข้าถึงของผู้ใช้แต่ละคนในระบบ โดยใช้ RBAC (Role-Based Access Control) เพื่อควบคุมการเข้าถึง resources ต่างๆ ภายในระบบ แต่ละ role จะมี permissions ที่แตกต่างกันตามความเหมาะสมของบทบาทนั้นๆ

## 2. วัตถุประสงค์ (Objectives)

- 2.1 จัดการบทบาทและระดับการเข้าถึงของผู้ใช้ในระบบ
- 2.2 ควบคุมการเข้าถึง resources ตามหลักการ least privilege
- 2.3 จัดเตรียมกลไกการจัดการสิทธิ์ที่ยืดหยุ่นและปลอดภัย
- 2.4 รองรับการเปลี่ยนแปลงบทบาทของผู้ใช้ตามความต้องการ
- 2.5 ช่วยให้การจัดการสิทธิ์เป็นระบบและง่ายต่อการตรวจสอบ

## 3. User Stories

### 3.1 ในฐานะผู้ดูแลระบบ ฉันต้องการจัดการบทบาทของผู้ใช้เพื่อควบคุมการเข้าถึงระบบ

**Acceptance Criteria:**
- AC 3.1.1: ฉันสามารถสร้างบทบาทใหม่ได้ (admin, manager, user, guest)
- AC 3.1.2: ฉันสามารถแก้ไขชื่อและคำอธิบายของบทบาทได้
- AC 3.1.3: ฉันสามารถกำหนด permissions ให้กับแต่ละบทบาทได้
- AC 3.1.4: ฉันสามารถดูรายการผู้ใช้ที่มีบทบาทนั้นๆ ได้
- AC 3.1.5: ฉันสามารถลบบทบาทที่ไม่ใช้งานได้ (หากไม่มีผู้ใช้ใช้งาน)
- AC 3.1.6: ฉันสามารถคัดลอกบทบาทเพื่อสร้างบทบาทใหม่ที่คล้ายกันได้
- AC 3.1.7: ระบบต้องป้องกันการลบบทบาทที่ยังมีผู้ใช้ใช้งานอยู่

### 3.2 ในฐานะผู้จัดการ ฉันต้องการมอบหมายบทบาทให้กับสมาชิกในทีมเพื่อควบคุมการเข้าถึง

**Acceptance Criteria:**
- AC 3.2.1: ฉันสามารถดูบทบาทที่มีอยู่ทั้งหมดในระบบได้
- AC 3.2.2: ฉันสามารถดู permissions ที่แต่ละบทบาทมีได้
- AC 3.2.3: ฉันสามารถมอบหมายบทบาทให้กับผู้ใช้ได้
- AC 3.2.4: ฉันสามารถเปลี่ยนบทบาทของผู้ใช้ได้
- AC 3.2.5: ฉันสามารถดูประวัติการเปลี่ยนแปลงบทบาทของผู้ใช้ได้
- AC 3.2.6: ฉันสามารถสร้างบทบาทแบบ custom สำหรับทีมของฉันได้
- AC 3.2.7: ฉันต้องได้รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลงบทบาทที่สำคัญ

## 4. ขอบเขตงาน (Scope)

### In Scope:
- 4.1 การออกแบบ database schema สำหรับ roles และ permissions
- 4.2 การจัดการบทบาทพื้นฐาน (admin, manager, user, guest)
- 4.3 การสร้าง custom roles สำหรับความต้องการเฉพาะ
- 4.4 การเชื่อมโยง roles กับ users และ permissions
- 4.5 การจัดการ lifecycle ของ roles (create, update, delete)
- 4.6 การตรวจสอบสิทธิ์การเข้าถึงตาม roles
- 4.7 การบันทึกประวัติการเปลี่ยนแปลง roles

### Out of Scope:
- 4.8 การจัดการ permissions แบบละเอียด (attribute-based access control)
- 4.9 การจัดการ roles แบบ temporal (มีวันหมดอายุ)
- 4.10 การจัดการ roles แบบ hierarchical (inheritance)
- 4.11 การจัดการ roles สำหรับ external systems
- 4.12 การทำ role mining หรือ suggestion system

## 5. ข้อกำหนดทางเทคนิค (Technical Requirements)

### 5.1 Database Schema

```sql
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_system   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_roles_name (name),
  INDEX idx_roles_is_system (is_system)
);
```

### 5.2 Prisma Model Definition

```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique // admin, manager, user, guest
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}
```

### 5.3 Default Roles

| Role Name | Description | Is System | Typical Permissions |
|-----------|-------------|-----------|-------------------|
| admin | Full system access | true | All permissions |
| manager | Manage team and resources | true | Read, Write, Delete limited resources |
| user | Standard user access | true | Read own resources, Write limited |
| guest | Read-only access | true | Read public resources only |

### 5.4 API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/roles` | GET | List all roles | Admin Token |
| `/api/roles` | POST | Create new role | Admin Token |
| `/api/roles/:id` | GET | Get role details | Admin Token |
| `/api/roles/:id` | PUT | Update role | Admin Token |
| `/api/roles/:id` | DELETE | Delete role | Admin Token |
| `/api/roles/:id/users` | GET | Get users with this role | Admin Token |
| `/api/roles/:id/permissions` | GET | Get role permissions | Admin Token |
| `/api/roles/:id/permissions` | POST | Add permission to role | Admin Token |
| `/api/roles/:id/permissions/:permissionId` | DELETE | Remove permission from role | Admin Token |

### 5.5 Security Requirements

- SR 5.5.1: เฉพาะ admin เท่านั้นที่สามารถจัดการ roles ได้
- SR 5.5.2: System roles ไม่สามารถถูกลบหรือแก้ไขชื่อได้
- SR 5.5.3: ต้องมีการตรวจสอบว่า role ที่จะลบไม่มีผู้ใช้ใช้งาน
- SR 5.5.4: ต้องมี audit log สำหรับการเปลี่ยนแปลง roles
- SR 5.5.5: ต้องมีการ validate ชื่อ roles ไม่ซ้ำกัน
- SR 5.5.6: ต้องมีการ rate limiting สำหรับ API จัดการ roles

### 5.6 Frontend Requirements

- FR 5.6.1: Role management page ใน admin dashboard
- FR 5.6.2: Form สำหรับสร้าง/แก้ไข roles พร้อม validation
- FR 5.6.3: Table แสดงรายการ roles พร้อม actions
- FR 5.6.4: Permission assignment interface สำหรับ roles
- FR 5.6.5: User role assignment modal
- FR 5.6.6: Role usage statistics และ analytics
- FR 5.6.7: Responsive design สำหรับ mobile devices

## 6. การทดสอบ (Testing)

### 6.1 Unit Testing
- UT 6.1.1: Test role creation พร้อม validation ทุกกรณี
- UT 6.1.2: Test role name uniqueness validation
- UT 6.1.3: Test system role protection (no delete/edit)
- UT 6.1.4: Test role-permission relationship operations
- UT 6.1.5: Test role-user relationship operations

### 6.2 Integration Testing
- IT 6.2.1: Test role management API endpoints
- IT 6.2.2: Test role assignment to users
- IT 6.2.3: Test permission inheritance through roles
- IT 6.2.4: Test role-based access control in API
- IT 6.2.5: Test role deletion constraints

### 6.3 E2E Testing
- E2E 6.3.1: Test admin creates and manages roles ใน UI
- E2E 6.3.2: Test manager assigns roles to team members
- E2E 6.3.3: Test user access based on assigned roles
- E2E 6.3.4: Test role permission management
- E2E 6.3.5: Test role-based UI component visibility

## 7. Dependencies และ Assumptions

### 7.1 Dependencies
- D 7.1.1: User model สำหรับเชื่อมโยง roles
- D 7.1.2: Permission model สำหรับกำหนดสิทธิ์
- D 7.1.3: UserRole model สำหรับ many-to-many relationship
- D 7.1.4: RolePermission model สำหรับ many-to-many relationship
- D 7.1.5: Authentication service สำหรับ verify user tokens

### 7.2 Assumptions
- A 7.2.1: ทุกผู้ใช้ในระบบต้องมีอย่างน้อย 1 role
- A 7.2.2: ผู้ใช้สามารถมีได้หลาย roles ในระบบ
- A 7.2.3: มีการ backup ข้อมูล roles และ permissions เป็นประจำ
- A 7.2.4: ผู้ดูแลระบบมีความเข้าใจเกี่ยวกับ RBAC principles
- A 7.2.5: ระบบจะมีการ review roles และ permissions เป็นระยะๆ

## 8. Non-Functional Requirements

### 8.1 Performance
- NFR 8.1.1: Role checking response time < 50ms
- NFR 8.1.2: Role management API response time < 200ms
- NFR 8.1.3: รองรับได้ 10,000 role checks ต่อนาที
- NFR 8.1.4: Role queries มีการใช้ indexes อย่างเหมาะสม

### 8.2 Security
- NFR 8.2.1: Role information เป็น sensitive data
- NFR 8.2.2: ต้องมี encryption สำหรับข้อมูล roles ที่บอกความละเอียด
- NFR 8.2.3: ต้องมี audit trail สำหรับทุกการเปลี่ยนแปลง
- NFR 8.2.4: ต้องมีการ monitor สำหรับ suspicious role activities

### 8.3 Reliability
- NFR 8.3.1: Role system uptime 99.9%
- NFR 8.3.2: ไม่มี data loss สำหรับ role assignments
- NFR 8.3.3: มี backup และ recovery plan สำหรับ role data
- NFR 8.3.4: มีการ monitor และ alerts สำหรับ role system

## 9. Timeline และ Milestones

### Phase 1 (Week 1): Database Design
- 9.1.1: Finalize database schema และ Prisma model
- 9.1.2: Create database migration scripts
- 9.1.3: Setup default roles และ permissions
- 9.1.4: Create seed data สำหรับ testing

### Phase 2 (Week 2): Backend Development
- 9.2.1: Implement role service logic
- 9.2.2: Create role management API endpoints
- 9.2.3: Implement RBAC middleware
- 9.2.4: Add validation และ error handling

### Phase 3 (Week 3): Frontend Development
- 9.3.1: Create role management UI components
- 9.3.2: Implement role assignment interface
- 9.3.3: Add permission management UI
- 9.3.4: Create role analytics dashboard

### Phase 4 (Week 4): Testing & Deployment
- 9.4.1: Complete unit, integration และ E2E testing
- 9.4.2: Security testing สำหรับ role system
- 9.4.3: Performance testing และ optimization
- 9.4.4: Deploy to production และ monitor

### Success Metrics
- SM 9.5.1: Role checking response time < 50ms
- SM 9.5.2: Zero security incidents related to roles
- SM 9.5.3: Admin efficiency improvement > 60% สำหรับ user management
- SM 9.5.4: User satisfaction score > 4.5/5 สำหรับ access control