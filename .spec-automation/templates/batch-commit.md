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
