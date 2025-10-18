# Smart AI Hub - Backup System User Guide

## Overview

The Smart AI Hub Backup System is an automated backup solution that protects your critical data by creating daily backups and delivering them to administrators via email. This system ensures business continuity and disaster recovery capabilities.

## What's Backed Up

### Database Data

- **Critical Tables**: users, user_roles, organizations, agencies, referrals, exchange_rates, system_settings, roles, permissions, role_permissions
- **Recent Transactions**: Last 3 months of credit_transactions, point_transactions, purchases
- **Historical Data**: Older transactions are excluded to keep backup sizes manageable

### Configuration Files

- Environment configuration (`.env.production`)
- Docker Compose configuration (`docker-compose.prod.yml`)
- Nginx configuration (`nginx.prod.conf`)
- SSL certificates and keys

### Backup Information

- `BACKUP_INFO.txt` with restore instructions and metadata

## Backup Schedule

- **Frequency**: Daily at 2:00 AM (server time)
- **Retention**: 30 days (older backups are automatically deleted)
- **Format**: Compressed tar.gz files
- **Size**: Typically 20-50MB (maximum 100MB)

## Email Delivery

### Successful Backups

You will receive an email with:

- Backup summary (date, size, contents)
- Backup file attached (if < 25MB)
- Download link (if > 25MB)
- Quick restore instructions

### Failed Backups

You will receive an alert email with:

- Failure details and error message
- Recommended troubleshooting steps
- Priority: URGENT - requires immediate attention

## Quick Restore Guide

### Emergency Restore (30 minutes)

1. **Download Backup**
   - Get the backup file from the email or server path
   - Save to a secure location

2. **Extract Backup**

   ```bash
   tar -xzf critical_backup_YYYYMMDD_HHMMSS.tar.gz
   ```

3. **Restore Database**

   ```bash
   # Restore critical tables
   for sql_file in database/*.sql; do
     psql -U postgres smart_ai_hub < "$sql_file"
   done

   # Restore recent transactions
   psql -U postgres smart_ai_hub -c "\COPY credit_transactions FROM 'database/credit_transactions.csv' CSV HEADER"
   psql -U postgres smart_ai_hub -c "\COPY point_transactions FROM 'database/point_transactions.csv' CSV HEADER"
   psql -U postgres smart_ai_hub -c "\COPY purchases FROM 'database/purchases.csv' CSV HEADER"
   ```

4. **Restore Configuration**

   ```bash
   cp config/.env.production /path/to/project/
   cp config/docker-compose.prod.yml /path/to/project/
   cp config/nginx.prod.conf /path/to/project/
   cp -r config/ssl /path/to/project/
   ```

5. **Restart Services**

   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d
   ```

6. **Verify System**
   ```bash
   curl https://yourdomain.com/health
   ```

## Troubleshooting

### Common Issues

#### Backup Not Received

1. Check spam/junk folder
2. Verify email address in configuration
3. Check backup service status: `docker ps | grep backup-service`
4. Review backup logs: `docker logs backup-service`

#### Backup Failure Alerts

1. Check database connectivity
2. Verify disk space availability
3. Review configuration files
4. Trigger manual backup: `docker exec backup-service /scripts/backup-lightweight.sh`

#### Cannot Extract Backup

1. Verify file integrity: `gzip -t backup_file.tar.gz`
2. Check available disk space
3. Try using different extraction tool

#### Restore Database Fails

1. Verify database is running
2. Check database credentials
3. Ensure database exists
4. Review SQL file syntax

#### Services Won't Start After Restore

1. Check configuration file syntax
2. Verify SSL certificate paths
3. Check port availability
4. Review service logs

### Getting Help

#### Emergency Support

- **Priority 1**: Complete system failure, data loss
- **Response Time**: Within 1 hour
- **Contact**: System administrators immediately

#### Non-Emergency Support

- **Priority 2**: Backup questions, minor issues
- **Response Time**: Within 24 hours
- **Contact**: Development team via email

### Diagnostic Commands

#### Check Backup Status

```bash
# Check backup service
docker ps | grep backup-service

# Check recent backups
docker exec backup-service ls -la /backups/

# Check backup logs
docker exec backup-service tail -20 /var/log/backup.log

# Run health check
docker exec backup-service /scripts/backup-monitor.sh status
```

#### Check System Health

```bash
# Database connectivity
docker exec backup-service pg_isready -h postgres -U postgres

# Disk space
docker exec backup-service df -h /backups

# Service health
docker exec backup-service /scripts/backup-monitor.sh health-check
```

## Best Practices

### Backup Management

- **Save critical backups**: Keep monthly backups offline for 1 year
- **Test restores**: Perform test restores monthly to verify integrity
- **Monitor emails**: Respond to backup alerts promptly
- **Documentation**: Keep this guide accessible for emergency use

### Security Considerations

- **Store securely**: Keep backup files in secure locations
- **Access control**: Limit backup access to authorized personnel
- **Email security**: Use secure email accounts for backup delivery
- **Password protection**: Protect backup files with strong passwords

### Maintenance

- **Regular monitoring**: Check backup status weekly
- **Configuration updates**: Update email addresses when personnel change
- **Capacity planning**: Monitor disk space usage and plan for growth
- **Testing schedule**: Schedule regular restore drills

## FAQs

**Q: How long are backups retained?**
A: Backups are retained for 30 days automatically. Critical backups should be saved separately for longer retention.

**Q: Can I restore to a specific point in time?**
A: The backup system provides daily snapshots. You can restore to any backup date within the 30-day retention period.

**Q: What happens if the backup file is too large for email?**
A: Files larger than 25MB are not attached to emails. You'll receive instructions to access the file directly from the server.

**Q: Can I change the backup schedule?**
A: Yes, the backup schedule can be modified in the configuration. Contact the development team for schedule changes.

**Q: How do I know if a backup was successful?**
A: Successful backups generate a confirmation email with backup details. Failed backups generate urgent alert emails.

**Q: Can I trigger a manual backup?**
A: Yes, administrators can trigger manual backups using: `docker exec backup-service /scripts/backup-lightweight.sh`

**Q: What data is NOT included in backups?**
A: Old logs (beyond 3 months), session data, audit logs older than 3 months, and very old transactions are excluded.

**Q: How secure are the backup files?**
A: Backup files are stored in a secure directory with restricted access. Email delivery uses TLS encryption.

## Contact Information

**Technical Support**: development@smartaihub.com  
**System Administration**: admin@smartaihub.com  
**Emergency Contact**: Available 24/7 for critical issues

---

**Version**: 1.0  
**Last Updated**: 2025-10-17  
**Next Review**: 2025-11-17

For the most current information and updates, please refer to the project documentation or contact the development team.
