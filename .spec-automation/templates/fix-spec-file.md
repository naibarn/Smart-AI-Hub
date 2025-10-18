TASK: {{task_id}} - แก้ไขไฟล์ {{filename}}

**INPUT FILE:** {{input_path}}
**QUALITY SCORE:** {{current_score}}/100
**PRIORITY:** {{priority}}

คำสั่ง:

1. อ่านไฟล์ {{input_path}}

2. วิเคราะห์ปัญหาที่พบ:
   - มี Front Matter: {{has_frontmatter}}
   - มี User Stories: {{has_user_stories}}
   - มี Acceptance Criteria: {{has_acceptance_criteria}}
   - มี Scope: {{has_scope}}
   - มี Technical Requirements: {{has_technical_requirements}}
   - มี Testing Criteria: {{has_testing_criteria}}

3. แก้ไขไฟล์โดยใช้มาตรฐานจาก spec_example_good.md:

   **ต้องมีทุกส่วน:**
   - Front Matter (YAML) ครบถ้วน
   - 1. ภาพรวม (Overview)
   - 2. วัตถุประสงค์ (Objectives) - 3-5 ข้อ
   - 3. User Stories - อย่างน้อย 2 stories
     - แต่ละ story ต้องมี Acceptance Criteria 5-7 ข้อ
   - 4. ขอบเขตงาน (In Scope 5-7 ข้อ / Out of Scope 3-5 ข้อ)
   - 5. ข้อกำหนดทางเทคนิค
     - Backend API Endpoints (ถ้ามี) - ตาราง
     - Security Requirements
     - Frontend Requirements
   - 6. การทดสอบ (Unit/Integration/E2E อย่างละ 3+ ข้อ)
   - 7. Dependencies และ Assumptions
   - 8. Non-Functional Requirements
   - 9. Timeline และ Milestones

4. เขียนเนื้อหาให้:
   - ใช้ข้อมูลจากไฟล์เดิมเป็นหลัก
   - ใช้บริบทของ Smart AI Hub (TypeScript, React, PostgreSQL, Stripe, Claude AI)
   - ภาษาไทยที่เป็นทางการแต่เข้าใจง่าย
   - ระดับความละเอียดเท่ากับ spec_example_good.md
   - ความยาวอย่างน้อย 200 บรรทัด

5. บันทึกไฟล์ใหม่ทับไฟล์เดิมที่ {{input_path}}

6. รัน validation:

```bash
   cd packages/speckit
   node dist/cli/index.js validate ../../{{input_path}}
```

7. ถ้า validation fail:
   - แก้ไขข้อผิดพลาดตาม error message
   - รัน validation อีกครั้งจนกว่าจะผ่าน

8. สร้าง checkpoint:
   สร้างไฟล์ .spec-automation/checkpoints/{{task_id}}.json:

```json
   {
     "task_id": "{{task_id}}",
     "filename": "{{filename}}",
     "completed_at": "[timestamp]",
     "original_score": {{current_score}},
     "new_score": "[calculated]",
     "original_lines": "[count]",
     "new_lines": "[count]",
     "validation_passed": true/false,
     "changes": {
       "added_frontmatter": true/false,
       "added_user_stories": X,
       "added_acceptance_criteria": Y,
       "added_scope": true/false,
       "added_technical_requirements": true/false,
       "added_testing_criteria": true/false
     }
   }
```

9. แสดงผลลัพธ์:

```
   ✅ {{task_id}} COMPLETE

   📄 File: {{filename}}
   📊 Score: {{current_score}} → [new_score] (+XX)
   📏 Lines: [old] → [new] (+XX)
   ✅ Validation: PASSED
   ⏱️  Time: XX minutes

   💾 Checkpoint: .spec-automation/checkpoints/{{task_id}}.json

   🔄 Update tracker:
   node .spec-automation/tracker.js complete {{task_id}} XX

   ➡️  Next Task:
   node .spec-automation/tracker.js next
```
