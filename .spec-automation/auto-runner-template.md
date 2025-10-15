# Auto-Runner Prompt Template

## วิธีใช้:
1. รัน: node .spec-automation/tracker.js next
2. ได้ task ถัดไป
3. Copy prompt ที่เหมาะสมตาม task type
4. Replace {{variables}} ด้วยข้อมูลจริง
5. รัน prompt ใน Kilo Code
6. เมื่อเสร็จ รัน: node .spec-automation/tracker.js complete <taskId> <minutes>

---

## TEMPLATE 1: Setup Task
```
TASK: {{task_id}} - {{task_name}}

คำสั่ง:
{{task_description}}

เมื่อทำเสร็จ:
1. บันทึกผลลงไฟล์ {{output_file}}
2. แสดง "✅ {{task_id}} COMPLETE"
3. แสดงสรุปสั้นๆ ว่าทำอะไรไปบ้าง
4. บอก next task: รัน `node .spec-automation/tracker.js next`
```

---

## TEMPLATE 2: Fix Spec File
```
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
     * แต่ละ story ต้องมี Acceptance Criteria 5-7 ข้อ
   - 4. ขอบเขตงาน (In Scope 5-7 ข้อ / Out of Scope 3-5 ข้อ)
   - 5. ข้อกำหนดทางเทคนิค
     * Backend API Endpoints (ถ้ามี) - ตาราง
     * Security Requirements
     * Frontend Requirements
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
```

---

## TEMPLATE 3: Batch Validation
```
TASK: {{task_id}} - Validate Group {{group_name}}

คำสั่ง:
1. รัน speckit validate สำหรับทุกไฟล์ใน Group {{group_name}}

2. สร้างรายงานเป็นตาราง:
   | File | Status | Score | Issues |

3. ถ้ามีไฟล์ไม่ผ่าน:
   - สร้าง list ไฟล์ที่ต้องแก้ไข
   - เพิ่ม task ใหม่ใน progress tracker

4. บันทึกรายงานที่ .spec-automation/reports/validation-{{group_name}}.md

5. แสดง:
```
   ✅ {{task_id}} COMPLETE
   
   📊 Validation Results - Group {{group_name}}:
   - Total: X files
   - Passed: Y files (Z%)
   - Failed: W files
   
   [ตาราง]
   
   💾 Report: .spec-automation/reports/validation-{{group_name}}.md
```
```

---

## TEMPLATE 4: Batch Commit
```
TASK: {{task_id}} - Commit Group {{group_name}} Changes

คำสั่ง:
1. สร้าง list ไฟล์ทั้งหมดที่แก้ไขใน Group {{group_name}}

2. สร้าง commit message:
```
   docs(specs): improve {{count}} {{group_name}} spec files
   
   Improved files:
   {{#each files}}
   - {{this}}: [สรุปการแก้ไข]
   {{/each}}
   
   Changes:
   - Added complete metadata (front matter)
   - Added user stories with acceptance criteria
   - Defined clear scope (in/out)
   - Added technical requirements
   - Added testing criteria
   
   Validation: {{passed}}/{{total}} files passed
   Average score improved: {{old_avg}} → {{new_avg}} (+{{diff}})
```

3. รันคำสั่ง:
```bash
   git add {{files}}
   git commit -m "[commit message]"
```

4. แสดง:
```
   ✅ {{task_id}} COMPLETE
   
   📦 Committed {{count}} files
   🎯 Group {{group_name}} progress: {{percent}}%
   
   📝 Commit: [commit hash]
```
```

---

## TEMPLATE 5: Create Documentation
```
TASK: {{task_id}} - Create {{doc_name}}

คำสั่ง:
1. สร้างเอกสาร {{doc_name}} ตาม spec:
   {{doc_spec}}

2. เนื้อหาต้องมี:
   {{#each sections}}
   - {{this}}
   {{/each}}

3. บันทึกที่ {{output_path}}

4. แสดง:
```
   ✅ {{task_id}} COMPLETE
   
   📄 Created: {{doc_name}}
   💾 Path: {{output_path}}
   📏 Size: XX lines
```