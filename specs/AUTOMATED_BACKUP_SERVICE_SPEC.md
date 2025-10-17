---
title: "Automated Backup Service Specification"
author: "Development Team"
created_date: "2025-10-17"
last_updated: "2025-10-17"
version: "1.0"
status: "Draft"
priority: "P0 - Critical"
related_specs: ["DISASTER_RECOVERY_PLAN", "DATABASE_MANAGEMENT"]
---

# Automated Backup Service Specification

## 1. ภาพรวม (Overview)

ระบบ Automated Backup Service เป็นบริการสำคัญของ Smart AI Hub ที่ทำหน้าที่สำรองข้อมูลสำคัญของระบบอย่างอัตโนมัติ ระบบนี้ออกแบบมาเพื่อป้องกันการสูญเสียข้อมูลสำคัญและช่วยให้สามารถกู้คืนระบบได้อย่างรวดเร็วเมื่อเกิดเหตุฉุกเฉิน

ระบบใช้กลยุทธ์ Lightweight backup โดยสำรองเฉพาะข้อมูลที่จำเป็นต่อการกู้ระบบ ส่งไฟล์สำรองข้อมูลไปยัง Administrators ผ่านอีเมลทุกวัน และมีระบบ Monitoring และ Alerting เพื่อตรวจจับปัญหาได้ทันที

ความสำคัญต่อ Business Continuity และ Disaster Recovery:
- ลด Recovery Time Objective (RTO) จากหลายชั่วโมงเหลือเพียง 30 นาที
- ป้องกันการสูญเสียข้อมูลสำคัญ เช่น ข้อมูลผู้ใช้ เครดิต และคะแนน
- รองรับการกู้คืนระบบแบบ Point-in-time ย้อนหลัง 30 วัน
- ลดความเสี่ยงจากความผิดพลาดของมนุษย์และเหตุการณ์ไม่คาดคิด

## 2. วัตถุประสงค์ (Objectives)

ระบบ Automated Backup Service มีเป้าหมายหลักดังนี้:

- **ป้องกันการสูญเสียข้อมูลสำคัญ**: สำรองข้อมูลสำคัญของระบบอย่างสม่ำเสมอและตรวจสอบความสมบูรณ์
- **ลด Recovery Time Objective (RTO)**: ให้สามารถกู้ระบบได้ภายใน 30 นาทีจากไฟล์สำรองข้อมูล
- **เข้าถึงไฟล์สำรองข้อมูลได้ง่าย**: Administrators สามารถเข้าถึงไฟล์สำรองผ่านอีเมลได้ทันที
- **ตรวจจับปัญหาทันที**: ระบบ Monitoring ตรวจจับปัญหาการสำรองข้อมูลล้มเหลวและแจ้งเตือนทันที
- **ลดภาระงาน Manual backup**: อัตโนมัติทุกขั้นตอนตั้งแต่การสำรอง การตรวจสอบ การส่งอีเมล และการจัดการไฟล์เก่า
- **รองรับระบบขนาดใหญ่**: สามารถจัดการฐานข้อมูลขนาดใหญ่ได้อย่างมีประสิทธิภาพ

## 3. User Stories

### Story 1: รับ Backup ทุกวันผ่าน Email

**ในฐานะ** System Administrator  
**ฉันต้องการ** รับไฟล์ backup ผ่าน email ทุกวัน  
**เพื่อที่จะ** เก็บสำรองข้อมูลไว้ที่ปลอดภัยและเข้าถึงได้ง่าย

**Acceptance Criteria:**
- [ ] ระบบต้องส่ง email พร้อม backup file ทุกวันเวลา 2:00 AM
- [ ] Email ต้องมี backup summary (ขนาด, วันที่, รายการข้อมูล)
- [ ] ถ้าไฟล์ < 25MB ต้องแนบใน email
- [ ] ถ้าไฟล์ > 25MB ต้องให้ download link
- [ ] Email ต้องส่งถึง Administrators ทุกคน

### Story 2: Backup เฉพาะข้อมูลสำคัญ

**ในฐานะ** System Administrator  
**ฉันต้องการ** backup เฉพาะข้อมูลที่จำเป็นต่อการกู้ระบบ  
**เพื่อที่จะ** ลดขนาดไฟล์และเวลาในการ backup

**Acceptance Criteria:**
- [ ] Backup ต้องรวม: Users, Credits, Points, Transactions (3 เดือน), Organizations, Config
- [ ] Backup ต้องไม่รวม: Logs เก่า, Session data, Transactions เก่ากว่า 3 เดือน
- [ ] ขนาดไฟล์ต้อง < 100MB (เป้าหมาย < 50MB)
- [ ] Backup ต้องสามารถ restore ระบบได้อย่างสมบูรณ์

### Story 3: ได้รับแจ้งเตือนเมื่อ Backup ล้มเหลว

**ในฐานะ** System Administrator  
**ฉันต้องการ** ได้รับแจ้งเตือนทันทีเมื่อ backup ล้มเหลว  
**เพื่อที่จะ** แก้ไขปัญหาได้ทันท่วงที

**Acceptance Criteria:**
- [ ] ระบบต้องส่ง alert email เมื่อ backup ล้มเหลว
- [ ] Alert ต้องระบุสาเหตุของความล้มเหลว
- [ ] Alert ต้องส่งถึง Administrators ทันที
- [ ] ระบบต้องตรวจสอบว่าไม่มี backup ใน 25 ชั่วโมง

### Story 4: Restore ข้อมูลจาก Backup

**ในฐานะ** System Administrator  
**ฉันต้องการ** restore ข้อมูลจาก backup ได้ง่ายและรวดเร็ว  
**เพื่อที่จะ** กู้ระบบได้ทันทีเมื่อเกิดปัญหา

**Acceptance Criteria:**
- [ ] Backup file ต้องมี README หรือ BACKUP_INFO.txt อธิบายวิธี restore
- [ ] Restore procedure ต้องชัดเจนและทำตามได้ง่าย
- [ ] Backup ต้อง verify integrity ก่อนส่ง
- [ ] ระบบต้องสามารถ restore ได้ภายใน 30 นาที

### Story 5: ตรวจสอบสถานะ Backup

**ในฐานะ** System Administrator  
**ฉันต้องการ** ตรวจสอบสถานะ backup ล่าสุดได้  
**เพื่อที่จะ** มั่นใจว่าระบบ backup ทำงานปกติ

**Acceptance Criteria:**
- [ ] ระบบต้องมี healthcheck endpoint
- [ ] ระบบต้องบันทึก timestamp ของ backup ล่าสุด
- [ ] ระบบต้องบันทึกขนาดของ backup ล่าสุด
- [ ] สามารถตรวจสอบสถานะผ่าน Docker healthcheck

## 4. ขอบเขตงาน (Scope)

### 4.1 ในขอบเขตงาน (In Scope)
- Automated backup scheduler (daily at 2 AM)
- Lightweight backup (critical data only, last 3 months transactions)
- Email delivery to administrators
- Backup monitoring and health checks
- Failure alerts
- Backup retention (30 days)
- Backup verification
- Docker container for backup service
- Configuration backup (.env, docker-compose, nginx, SSL)

### 4.2 นอกขอบเขตงาน (Out of Scope)
- Cloud storage integration (AWS S3, Google Cloud Storage) - Phase 2
- Incremental backups - Phase 2
- Point-in-time recovery - Phase 2
- Database replication - Phase 2
- Backup encryption - Phase 2
- Multi-region backups - Phase 2
- Backup compression optimization - Phase 2
- Automated restore testing - Phase 2

## 5. ข้อกำหนดด้านฟังก์ชัน (Functional Requirements)

**FR-1: Automated Backup Scheduling**
- ระบบต้องทำ backup อัตโนมัติทุกวันเวลา 2:00 AM
- ใช้ cron job ใน Docker container
- Configurable schedule ผ่าน environment variable

**FR-2: Lightweight Backup Strategy**
- Backup เฉพาะ tables: users, user_roles, organizations, agencies, referrals, exchange_rates, system_settings
- Backup transactions (credits, points, purchases, transfers) ย้อนหลัง 3 เดือนเท่านั้น
- Backup configuration files: .env.production, docker-compose.prod.yml, nginx.prod.conf, SSL certificates
- ไม่ backup: logs เก่า, session data, audit logs เก่า, transactions เก่ากว่า 3 เดือน

**FR-3: Email Delivery**
- ส่ง backup file ไปยัง Administrators ทุกวัน
- แนบไฟล์ถ้าขนาด < 25MB
- ให้ download link ถ้าขนาด > 25MB
- Email ต้องเป็น HTML format พร้อม backup summary
- รวม restore instructions ใน email

**FR-4: Backup Monitoring**
- Healthcheck ตรวจสอบ backup ล่าสุด
- Alert ถ้าไม่มี backup ใน 25 ชั่วโมง
- Alert ถ้าขนาดไฟล์ผิดปกติ (< 1MB หรือ > 100MB)
- บันทึก metrics: last backup timestamp, size, success rate

**FR-5: Backup Verification**
- Verify gzip integrity
- Check file size
- Verify database dump readable
- Create backup summary

**FR-6: Backup Retention**
- เก็บ backup ไว้ 30 วัน
- ลบ backup เก่าอัตโนมัติ
- Configurable retention period

## 6. ข้อกำหนดด้านไม่ใช่ฟังก์ชัน (Non-Functional Requirements)

**NFR-1: Performance**
- Backup ต้องเสร็จภายใน 10 นาที
- ขนาดไฟล์ต้อง < 100MB (เป้าหมาย < 50MB)
- Email delivery ต้องเสร็จภายใน 5 นาที

**NFR-2: Reliability**
- Backup success rate ≥ 99%
- Retry logic สำหรับ email delivery (3 ครั้ง)
- Error handling ครบถ้วน

**NFR-3: Security**
- Backup files ต้องเก็บใน secure directory
- SMTP credentials ต้องเก็บใน environment variables
- Backup files ต้อง verify integrity

**NFR-4: Maintainability**
- Code ต้อง documented ชัดเจน
- Scripts ต้องมี error messages ที่เข้าใจง่าย
- Logging ครบถ้วน

**NFR-5: Scalability**
- รองรับ database ขนาดใหญ่ (up to 10GB)
- Configurable backup scope

## 7. Data Models

**Backup File Structure:**

```
critical_backup_YYYYMMDD_HHMMSS.tar.gz
├── BACKUP_INFO.txt
├── users.sql
├── organization.sql
├── config.sql
├── credit_transactions.csv
├── point_transactions.csv
├── .env.production
├── docker-compose.prod.yml
├── nginx.prod.conf
└── ssl/
    ├── cert.pem
    └── key.pem
```

**Monitoring Data:**

```
/backups/.last_backup_success (timestamp)
/backups/.last_backup_size_mb (integer)
```

## 8. API Specifications

ไม่มี API endpoints (ระบบทำงานแบบ standalone service)

**Docker Healthcheck:**
- Command: `/scripts/backup-monitor.sh`
- Interval: 1 hour
- Timeout: 10 seconds
- Retries: 3

## 9. Business Logic

**Backup Logic:**

1. สร้าง temporary directory
2. Export critical database tables
3. Filter transactions by date (last 3 months)
4. Copy configuration files
5. Create backup summary
6. Compress to .tar.gz
7. Verify compression integrity
8. Check file size
9. Send email with attachment/link
10. Update monitoring status
11. Cleanup old backups
12. Cleanup temporary directory

**Email Logic:**

- ถ้าไฟล์ < 25MB → แนบใน email
- ถ้าไฟล์ ≥ 25MB → ให้ download link
- Retry 3 ครั้งถ้าส่งไม่สำเร็จ
- Log ทุกครั้งที่ส่ง email

**Monitoring Logic:**

- ตรวจสอบ `.last_backup_success` timestamp
- ถ้า > 25 ชั่วโมง → ส่ง alert
- ตรวจสอบ `.last_backup_size_mb`
- ถ้า < 1MB หรือ > 100MB → ส่ง alert

## 10. Security Considerations

**SC-1: Backup File Security**
- เก็บ backup files ใน `/backups` directory (mounted volume)
- ไม่ expose backup files ผ่าน web server
- Backup files ต้อง readable เฉพาะ root และ postgres user

**SC-2: SMTP Credentials**
- เก็บใน environment variables
- ไม่ commit ใน git
- ใช้ app-specific passwords สำหรับ Gmail

**SC-3: Email Security**
- ใช้ TLS สำหรับ SMTP connection
- Verify SMTP server certificate

**SC-4: Database Credentials**
- เก็บใน environment variables
- ไม่ log passwords
- ใช้ read-only user สำหรับ backup (ถ้าเป็นไปได้)

## 11. Error Handling

**Error Scenarios:**

| Error | Handling | Alert |
|-------|----------|-------|
| Database connection failed | Retry 3 times, then alert | Yes |
| Backup compression failed | Alert immediately | Yes |
| Email delivery failed | Retry 3 times, then alert | Yes |
| Disk space full | Alert immediately | Yes |
| Backup verification failed | Alert immediately | Yes |

**Error Messages:**

ต้องชัดเจน, มีรายละเอียดเพียงพอสำหรับ debugging

**Error Logging:**

- Log ทุก error ไปยัง `/var/log/backup.log`
- Include timestamp, error message, stack trace

## 12. Performance Requirements

**PR-1: Backup Time**
- Target: < 5 นาที
- Maximum: < 10 นาที

**PR-2: File Size**
- Target: < 50MB
- Maximum: < 100MB

**PR-3: Email Delivery**
- Target: < 2 นาที
- Maximum: < 5 นาที

**PR-4: Monitoring Check**
- Target: < 5 วินาที
- Maximum: < 10 วินาที

## 13. Deployment Strategy

**DS-1: Docker Container**
- สร้าง `Dockerfile.backup`
- เพิ่ม service ใน `docker-compose.prod.yml`
- Mount volumes: `/backups`, `/scripts`, `/ssl`, config files

**DS-2: Environment Variables**
- เพิ่มใน `.env.production`:
  - SMTP configuration
  - Admin emails
  - Backup schedule
  - Retention period

**DS-3: Deployment Steps**

1. Build backup service image
2. Update docker-compose.prod.yml
3. Configure environment variables
4. Start backup service
5. Verify first backup
6. Monitor for 7 days

**DS-4: Rollback Plan**

ถ้าเกิดปัญหา:
1. Stop backup service
2. Revert docker-compose.prod.yml
3. Continue manual backups
4. Debug และ fix issues
5. Redeploy

## 14. Testing Strategy

**TS-1: Unit Tests**

- [ ] Test database export functions
- [ ] Test compression functions
- [ ] Test email delivery functions
- [ ] Test monitoring functions

**TS-2: Integration Tests**

- [ ] Test full backup flow
- [ ] Test email delivery with attachments
- [ ] Test monitoring alerts
- [ ] Test backup restoration

**TS-3: Manual Testing**

- [ ] Trigger manual backup
- [ ] Verify email received
- [ ] Verify backup file integrity
- [ ] Test restore procedure
- [ ] Test failure scenarios

**TS-4: Performance Testing**

- [ ] Measure backup time
- [ ] Measure file size
- [ ] Measure email delivery time

## 15. Documentation Requirements

**DR-1: User Documentation**

**File:** `docs/BACKUP_SYSTEM.md`

**Contents:**
- Overview
- What's backed up
- Backup schedule
- Email delivery
- Restore procedures
- Troubleshooting

**DR-2: Developer Documentation**

**File:** `docs/BACKUP_DEVELOPMENT.md`

**Contents:**
- Architecture
- Code structure
- Scripts explanation
- How to modify backup scope
- How to add new backup targets

**DR-3: Operations Documentation**

**File:** `docs/BACKUP_OPERATIONS.md`

**Contents:**
- How to check backup status
- How to trigger manual backup
- How to restore from backup
- How to troubleshoot failures
- Monitoring and alerting

## 16. Examples and Use Cases

**Example 1: Daily Backup Success**

```
Timeline:
02:00 AM - Backup starts
02:02 AM - Database export complete
02:03 AM - Configuration backup complete
02:04 AM - Compression complete
02:05 AM - Verification passed
02:06 AM - Email sent to admins
02:07 AM - Monitoring status updated
02:08 AM - Old backups cleaned up
02:08 AM - Backup complete

Result:
✅ Backup file: critical_backup_20251016_020000.tar.gz (45MB)
✅ Email sent to: admin1@example.com, admin2@example.com
✅ Monitoring status: OK
```

**Example 2: Backup Failure - Database Connection**

```
Timeline:
02:00 AM - Backup starts
02:00 AM - Database connection failed
02:01 AM - Retry 1 failed
02:02 AM - Retry 2 failed
02:03 AM - Retry 3 failed
02:03 AM - Alert email sent

Result:
❌ Backup failed: Database connection error
❌ Alert sent to: admin1@example.com, admin2@example.com
```

**Example 3: Restore from Backup**

```bash
# 1. Download backup from email
# 2. Extract backup
tar -xzf critical_backup_20251016_020000.tar.gz

# 3. Restore database
psql -U postgres smart_ai_hub < users.sql
psql -U postgres smart_ai_hub < organization.sql
psql -U postgres smart_ai_hub < config.sql

# 4. Restore transactions
psql -U postgres smart_ai_hub -c "\COPY credit_transactions FROM 'credit_transactions.csv' CSV"
psql -U postgres smart_ai_hub -c "\COPY point_transactions FROM 'point_transactions.csv' CSV"

# 5. Restore configuration
cp .env.production /path/to/project/.env.production
cp docker-compose.prod.yml /path/to/project/
cp nginx.prod.conf /path/to/project/

# 6. Restart services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 7. Verify system
curl https://api.smartaihub.com/health
```

---

**หมายเหตุ:** เอกสารนี้เป็น Living Document และจะถูกอัปเดตตามความจำเป็น การเปลี่ยนแปลงใดๆ ต้องผ่านการอนุมัติจาก Product Owner และ Tech Lead