# Epic 3: Credit Management System (Sprint 2-3)

## E3.1: Credit Account System

**Story Points**: 5
**Priority**: P1 (High)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
- **links_to_architecture**:
  - Service: `../../02_architecture/services/core_service.md`
  - Data Models: `../../02_architecture/data_models/credit_account.md`, `../../02_architecture/data_models/credit_transaction.md`, `../../02_architecture/data_models/user.md`

**Acceptance Criteria**:

- [x] Credit account creation for new users ✅
- [x] Initial balance (1 credit) ✅
- [x] Credit balance tracking API ✅
- [x] Credit transaction logging ✅
- [x] Credit usage calculation ✅
- [x] Credit history API endpoints ✅

**Completion Notes**:

- Auto-creation on user registration
- Database schema implemented
- Initial balance setup
- Credit balance endpoint with Redis caching (60s TTL)
- Transaction history with pagination (page/limit)
- Admin credit adjustment endpoints
- Promo code redemption system
- Comprehensive error handling and validation

**API Endpoints Implemented**:

```typescript
GET    /credits/balance        - Get current balance (with caching)
GET    /credits/history        - Transaction history (paginated)
POST   /credits/redeem         - Redeem promo codes
POST   /admin/credits/adjust   - Admin credit adjustments
GET    /admin/credits/:userId  - Get user credit info (admin)
```

---

## E3.2: Credit Top-up System

**Story Points**: 8
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: E3.1, Stripe Account Setup
**Risk Level**: High (Payment integration)
- **links_to_architecture**:
  - Service: `../../02_architecture/services/core_service.md`
  - Data Models: `../../02_architecture/data_models/credit_account.md`, `../../02_architecture/data_models/credit_transaction.md`, `../../02_architecture/data_models/user.md`

**Acceptance Criteria**:

- [ ] Credit package configuration
- [ ] Stripe payment integration
- [ ] Checkout page (hosted or embedded)
- [ ] Payment webhook handling
- [ ] Transaction security (idempotency)
- [ ] Purchase confirmation email
- [ ] Refund processing

**Credit Packages**:

```typescript
{
  starter: { credits: 100, price: 10, perCredit: 0.10 },
  pro: { credits: 1000, price: 80, perCredit: 0.08 },
  business: { credits: 10000, price: 600, perCredit: 0.06 },
  enterprise: { custom: true }
}
```

**Implementation Steps**:

1. **Stripe Setup** (1 day)
   - [ ] Create Stripe account
   - [ ] Configure products and prices
   - [ ] Setup webhook endpoint
   - [ ] Add Stripe SDK

2. **Purchase Flow** (2 days)
   - [ ] Create checkout session endpoint
   - [ ] Redirect to Stripe checkout
   - [ ] Handle success/cancel callbacks
   - [ ] Store pending transactions

3. **Webhook Processing** (2 days)
   - [ ] Verify webhook signatures
   - [ ] Handle checkout.session.completed
   - [ ] Handle payment_intent.succeeded
   - [ ] Handle payment_intent.failed
   - [ ] Implement idempotency (prevent duplicate credits)
   - [ ] Update credit balance atomically

4. **Email Notifications** (1 day)
   - [ ] Purchase confirmation email
   - [ ] Receipt with transaction details
   - [ ] Failed payment notification

**Security Measures**:

- [ ] Webhook signature verification
- [ ] Idempotency keys for all operations
- [ ] Transaction audit logging
- [ ] PCI compliance (Stripe handles card data)

**Testing**:

- [ ] Use Stripe test mode
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Test webhook retry mechanism
- [ ] Test duplicate webhook prevention

---

## E3.3: Admin Credit Management

**Story Points**: 3
**Priority**: P2 (Medium)
**Status**: Not Started
**Dependencies**: E3.1, E2.3 (RBAC)
- **links_to_architecture**:
  - Service: `../../02_architecture/services/core_service.md`
  - Data Models: `../../02_architecture/data_models/credit_account.md`, `../../02_architecture/data_models/credit_transaction.md`, `../../02_architecture/data_models/user.md`, `../../02_architecture/data_models/role.md`, `../../02_architecture/data_models/permission.md`

**Acceptance Criteria**:

- [ ] Admin interface for credit adjustments
- [ ] Manual credit addition/deduction
- [ ] Bulk credit operations
- [ ] Credit audit trail
- [ ] Credit usage reports

**Admin Endpoints**:

```typescript
POST   /admin/credits/adjust       - Adjust user credits
POST   /admin/credits/bulk         - Bulk operations
GET    /admin/credits/report       - Usage reports
GET    /admin/credits/audit        - Audit trail
```

**Tasks**:

- [ ] Create admin credit adjustment service
- [ ] Add reason field for manual adjustments
- [ ] Implement bulk operations (CSV import)
- [ ] Create audit trail queries
- [ ] Build usage report generator

---

## E3.4: Promotional Code System

**Story Points**: 5
**Priority**: P2 (Medium)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E3.1
- **links_to_architecture**:
  - Service: `../../02_architecture/services/core_service.md`
  - Data Models: `../../02_architecture/data_models/promo_code.md`, `../../02_architecture/data_models/promo_redemption.md`, `../../02_architecture/data_models/credit_account.md`, `../../02_architecture/data_models/credit_transaction.md`

**Acceptance Criteria**:

- [x] Promo code creation (admin only) ✅
- [x] Code redemption functionality ✅
- [x] Validation (exists, not expired, not used) ✅
- [x] One-time use per user enforcement ✅
- [x] Credit bonus application ✅
- [x] Redemption tracking ✅

**Promo Code Properties**:

```typescript
interface PromoCode {
  code: string; // e.g., "WELCOME10"
  credits: number; // Bonus credits
  maxUses?: number; // Global limit (null = unlimited)
  expiresAt?: Date; // Expiration date (null = never)
  active: boolean; // Can be deactivated
}
```

**Endpoints Implemented**:

```typescript
POST   /credits/redeem         - Redeem code (user)
// Admin endpoints for promo management will be in Phase 2
```

**Validation Rules Implemented**:

- [x] Code must exist and be active
- [x] Code must not be expired
- [x] User must not have redeemed this code before
- [x] Global max uses not exceeded (if set)

**Completion Notes**:

- Atomic transaction implementation for redemption
- Redis cache invalidation on credit updates
- Comprehensive error handling for all validation cases
- Usage tracking with promo_code_usage table
- Admin management UI planned for Phase 2