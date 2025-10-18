---
title: "Automated Backup Service Specification"
spec_id: "FEAT-011"
author: "Development Team"
created_date: "2025-10-17"
last_updated: "2025-10-17"
version: "1.0"
status: "Draft"
priority: "P0 - Critical"
related_specs: ["DISASTER_RECOVERY_PLAN", "DATABASE_MANAGEMENT"]
tags: ["infrastructure", "backup", "automation", "disaster-recovery"]
---

# Automated Backup Service Specification

## 1. Overview

The Automated Backup Service is a critical component of Smart AI Hub that automatically backs up important system data. This system is designed to prevent data loss and enable quick system recovery during emergencies.

The system uses a lightweight backup strategy, backing up only data essential for system recovery. It sends backup files to Administrators via email daily and includes monitoring and alerting to detect issues immediately.

Importance for Business Continuity and Disaster Recovery:
- Reduces Recovery Time Objective (RTO) from several hours to just 30 minutes
- Prevents loss of critical data such as user information, credits, and points
- Supports point-in-time system recovery for the last 30 days
- Reduces risk from human error and unexpected events

## 2. Objectives

The Automated Backup Service has the following primary objectives:

- **Prevent critical data loss**: Regularly backup important system data and verify integrity
- **Reduce Recovery Time Objective (RTO)**: Enable system recovery within 30 minutes from backup files
- **Easy access to backup files**: Administrators can access backups immediately via email
- **Immediate problem detection**: Monitoring system detects backup failures and alerts immediately
- **Reduce manual backup workload**: Automate all steps from backup, verification, email delivery, and file management
- **Support large systems**: Efficiently manage large databases

## 3. User Stories

### Story 1: Receive Daily Backup via Email

**As a** System Administrator  
**I want to** receive backup files via email daily  
**So that I can** keep data safely stored and easily accessible

**Acceptance Criteria:**
- [ ] System must send email with backup file every day at 2:00 AM
- [ ] Email must include backup summary (size, date, data list)
- [ ] If file < 25MB, attach in email
- [ ] If file > 25MB, provide download link
- [ ] Email must be sent to all Administrators

### Story 2: Backup Only Critical Data

**As a** System Administrator  
**I want to** backup only data essential for system recovery  
**So that I can** reduce file size and backup time

**Acceptance Criteria:**
- [ ] Backup must include: Users, Credits, Points, Transactions (3 months), Organizations, Config
- [ ] Backup must exclude: Old logs, Session data, Transactions older than 3 months
- [ ] File size must be < 100MB (target < 50MB)
- [ ] Backup must be able to restore system completely

### Story 3: Receive Immediate Alerts on Backup Failure

**As a** System Administrator  
**I want to** receive immediate alerts when backup fails  
**So that I can** fix problems immediately

**Acceptance Criteria:**
- [ ] System must send alert email when backup fails
- [ ] Alert must specify failure reason
- [ ] Alert must be sent to Administrators immediately
- [ ] System must check for no backup in 25 hours

### Story 4: Restore Data from Backup

**As a** System Administrator  
**I want to** restore data from backup easily and quickly  
**So that I can** recover system immediately when problems occur

**Acceptance Criteria:**
- [ ] Backup file must have README or BACKUP_INFO.txt explaining restore procedure
- [ ] Restore procedure must be clear and easy to follow
- [ ] Backup must verify integrity before sending
- [ ] System must be able to restore within 30 minutes

### Story 5: Check Backup Status

**As a** System Administrator  
**I want to** check latest backup status  
**So that I can** ensure backup system is working normally

**Acceptance Criteria:**
- [ ] System must have healthcheck endpoint
- [ ] System must record timestamp of latest backup
- [ ] System must record size of latest backup
- [ ] Status can be checked via Docker healthcheck

## 4. Scope

### 4.1 In Scope
- Automated backup scheduler (daily at 2 AM)
- Lightweight backup (critical data only, last 3 months transactions)
- Email delivery to administrators
- Backup monitoring and health checks
- Failure alerts
- Backup retention (30 days)
- Backup verification
- Docker container for backup service
- Configuration backup (.env, docker-compose, nginx, SSL)

### 4.2 Out of Scope
- Cloud storage integration (AWS S3, Google Cloud Storage) - Phase 2
- Incremental backups - Phase 2
- Point-in-time recovery - Phase 2
- Database replication - Phase 2
- Backup encryption - Phase 2
- Multi-region backups - Phase 2
- Backup compression optimization - Phase 2
- Automated restore testing - Phase 2

## 5. Functional Requirements

**FR-1: Automated Backup Scheduling**
- System must perform backup automatically every day at 2:00 AM
- Use cron job in Docker container
- Configurable schedule via environment variable

**FR-2: Lightweight Backup Strategy**
- Backup only tables: users, user_roles, organizations, agencies, referrals, exchange_rates, system_settings
- Backup transactions (credits, points, purchases, transfers) only for last 3 months
- Backup configuration files: .env.production, docker-compose.prod.yml, nginx.prod.conf, SSL certificates
- Do not backup: old logs, session data, old audit logs, transactions older than 3 months

**FR-3: Email Delivery**
- Send backup file to Administrators every day
- Attach file if size < 25MB
- Provide download link if size > 25MB
- Email must be HTML format with backup summary
- Include restore instructions in email

**FR-4: Backup Monitoring**
- Healthcheck to verify latest backup
- Alert if no backup in 25 hours
- Alert if file size is abnormal (< 1MB or > 100MB)
- Record metrics: last backup timestamp, size, success rate

**FR-5: Backup Verification**
- Verify gzip integrity
- Check file size
- Verify database dump readable
- Create backup summary

**FR-6: Backup Retention**
- Keep backups for 30 days
- Automatically delete old backups
- Configurable retention period

## 6. Non-Functional Requirements

**NFR-1: Performance**
- Backup must complete within 10 minutes
- File size must be < 100MB (target < 50MB)
- Email delivery must complete within 5 minutes

**NFR-2: Reliability**
- Backup success rate ≥ 99%
- Retry logic for email delivery (3 times)
- Comprehensive error handling

**NFR-3: Security**
- Backup files must be stored in secure directory
- SMTP credentials must be stored in environment variables
- Backup files must verify integrity

**NFR-4: Maintainability**
- Code must be clearly documented
- Scripts must have understandable error messages
- Comprehensive logging

**NFR-5: Scalability**
- Support large databases (up to 10GB)
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

No API endpoints (system works as standalone service)

**Docker Healthcheck:**
- Command: `/scripts/backup-monitor.sh`
- Interval: 1 hour
- Timeout: 10 seconds
- Retries: 3

## 9. Business Logic

**Backup Logic:**

1. Create temporary directory
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

- If file < 25MB → attach in email
- If file ≥ 25MB → provide download link
- Retry 3 times if send fails
- Log every email send

**Monitoring Logic:**

- Check `.last_backup_success` timestamp
- If > 25 hours → send alert
- Check `.last_backup_size_mb`
- If < 1MB or > 100MB → send alert

## 10. Security Considerations

**SC-1: Backup File Security**
- Store backup files in `/backups` directory (mounted volume)
- Do not expose backup files via web server
- Backup files must be readable only by root and postgres user

**SC-2: SMTP Credentials**
- Store in environment variables
- Do not commit in git
- Use app-specific passwords for Gmail

**SC-3: Email Security**
- Use TLS for SMTP connection
- Verify SMTP server certificate

**SC-4: Database Credentials**
- Store in environment variables
- Do not log passwords
- Use read-only user for backup (if possible)

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

Must be clear, with sufficient details for debugging

**Error Logging:**

- Log all errors to `/var/log/backup.log`
- Include timestamp, error message, stack trace

## 12. Performance Requirements

**PR-1: Backup Time**
- Target: < 5 minutes
- Maximum: < 10 minutes

**PR-2: File Size**
- Target: < 50MB
- Maximum: < 100MB

**PR-3: Email Delivery**
- Target: < 2 minutes
- Maximum: < 5 minutes

**PR-4: Monitoring Check**
- Target: < 5 seconds
- Maximum: < 10 seconds

## 13. Deployment Strategy

**DS-1: Docker Container**
- Create `Dockerfile.backup`
- Add service in `docker-compose.prod.yml`
- Mount volumes: `/backups`, `/scripts`, `/ssl`, config files

**DS-2: Environment Variables**
- Add to `.env.production`:
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

If problems occur:
1. Stop backup service
2. Revert docker-compose.prod.yml
3. Continue manual backups
4. Debug and fix issues
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

**Note:** This document is a Living Document and will be updated as necessary. Any changes must be approved by the Product Owner and Tech Lead.