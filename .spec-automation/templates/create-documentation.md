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