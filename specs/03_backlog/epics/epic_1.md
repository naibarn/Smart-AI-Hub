# Epic 1: Project Setup & Infrastructure (Sprint 1)

## E1.1: Development Environment Setup

**Story Points**: 8
**Priority**: P0 (Critical)
**Status**: In Progress
**Dependencies**: None
**Risk Level**: Low
- **links_to_architecture**:
  - Service: `../../02_architecture/services/api_gateway.md`

**Acceptance Criteria**:

- [x] Ubuntu VPS server setup and configuration ✅ DONE
- [x] Docker and Docker Compose installation ✅ DONE
- [x] Nginx reverse proxy configuration ✅ DONE
- [ ] SSL certificate setup (Let's Encrypt) with auto-renewal
- [ ] Basic monitoring setup (PM2 with cluster mode)
- [ ] Server security hardening (firewall, fail2ban, SSH keys only)

**Technical Details**:

```bash
# SSL Certificate Setup
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.smartaihub.com -d www.smartaihub.com
sudo certbot renew --dry-run  # Test auto-renewal

# PM2 Setup
npm install -g pm2
pm2 startup systemd
pm2 save
```

**Tasks**:

- [ ] Configure UFW firewall (allow 22, 80, 443)
- [ ] Setup fail2ban for SSH protection
- [ ] Install and configure PM2 with ecosystem.config.js
- [ ] Setup automated SSL renewal cron job
- [ ] Create deployment user with limited permissions
- [ ] Configure log rotation
- [ ] Setup automated backups

**Technical Debt**: Manual SSL setup initially, automate in Sprint 2

---

## E1.2: Database Setup

**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-02
- **links_to_architecture**:
  - Data Models: `../../02_architecture/data_models/user.md`, `../../02_architecture/data_models/role.md`, `../../02_architecture/data_models/permission.md`, `../../02_architecture/data_models/user_role.md`, `../../02_architecture/data_models/role_permission.md`, `../../02_architecture/data_models/credit_account.md`, `../../02_architecture/data_models/credit_transaction.md`, `../../02_architecture/data_models/promo_code.md`, `../../02_architecture/data_models/promo_redemption.md`, `../../02_architecture/data_models/usage_log.md`

**Acceptance Criteria**:

- [x] PostgreSQL database installation and configuration ✅
- [x] Redis cache server setup ✅
- [x] Database schema initialization ✅
- [x] Database migration system setup ✅
- [x] Connection pooling configuration ✅

**Completion Notes**:

- PostgreSQL 15 configured with optimized settings
- Redis 7 configured for caching and sessions
- Prisma migrations working correctly
- All tables created and indexed
- Connection pool: max 100, min 10 connections

**Lessons Learned**:

- Schema alignment between Prisma and migrations requires careful review
- Initial credit balance (1 credit) working as expected

---

## E1.3: Project Structure Creation

**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-02
- **links_to_architecture**:
  - Service: `../../02_architecture/services/api_gateway.md`, `../../02_architecture/services/auth_service.md`, `../../02_architecture/services/core_service.md`, `../../02_architecture/services/mcp_server.md`

**Acceptance Criteria**:

- [x] Monorepo structure with microservices ✅
- [x] TypeScript configuration for all services ✅
- [x] Docker containers for each service ✅
- [x] Environment configuration management ✅
- [ ] Code quality tools setup (ESLint, Prettier)

**Remaining Tasks**:

- [ ] Setup ESLint with shared config
- [ ] Setup Prettier with pre-commit hooks
- [ ] Configure Husky for git hooks
- [ ] Add commitlint for conventional commits

**Technical Debt**: Code quality tools postponed to Sprint 2

---

## NEW: E1.4: CI/CD Pipeline Setup

**Story Points**: 5
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: E1.3
**Risk Level**: Medium
- **links_to_architecture**:
  - Service: `../../02_architecture/services/api_gateway.md`, `../../02_architecture/services/auth_service.md`, `../../02_architecture/services/core_service.md`, `../../02_architecture/services/mcp_server.md`

**Acceptance Criteria**:

- [ ] GitHub Actions workflow for automated testing
- [ ] Automated linting and type checking
- [ ] Docker image building and pushing
- [ ] Automated deployment to staging
- [ ] Build status badges in README

**Pipeline Stages**:

```yaml
1. Lint & Type Check
2. Unit Tests (with coverage report)
3. Integration Tests
4. Build Docker Images
5. Push to Registry
6. Deploy to Staging (on main branch)
```

**Tasks**:

- [ ] Create .github/workflows/ci.yml
- [ ] Setup Docker Hub or GitHub Container Registry
- [ ] Configure secrets in GitHub
- [ ] Setup staging environment
- [ ] Add deployment scripts

---

## NEW: E1.5: Logging Infrastructure

**Story Points**: 3
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: E1.3
**Risk Level**: Low
- **links_to_architecture**:
  - Service: `../../02_architecture/services/api_gateway.md`, `../../02_architecture/services/auth_service.md`, `../../02_architecture/services/core_service.md`, `../../02_architecture/services/mcp_server.md`

**Acceptance Criteria**:

- [ ] Winston logger configured in all services
- [ ] Structured JSON logging format
- [ ] Log levels properly configured (dev: debug, prod: info)
- [ ] Request ID correlation across services
- [ ] Error stack traces captured
- [ ] Sensitive data masking in logs

**Implementation**:

```typescript
// Shared logger configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME,
  },
});