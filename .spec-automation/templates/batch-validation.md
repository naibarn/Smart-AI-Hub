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