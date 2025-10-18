# Data Models - PromptPay Credit Top-up

## Database: PostgreSQL 15+

---

## Table: credit_transactions

Main table storing all credit purchase transactions.

### Schema

```sql
CREATE TABLE credit_transactions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Purchase Details
  package_id VARCHAR(50) NOT NULL REFERENCES credit_packages(id),
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  total_credits INTEGER GENERATED ALWAYS AS (credits_purchased + bonus_credits) STORED,

  -- Payment Details
  price_thb DECIMAL(10, 2) NOT NULL CHECK (price_thb >= 100 AND price_thb <= 50000),
  amount_paid_thb DECIMAL(10, 2),
  overpayment_thb DECIMAL(10, 2) GENERATED ALWAYS AS (amount_paid_thb - price_thb) STORED,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'promptpay',

  -- PromptPay Specific
  promptpay_reference VARCHAR(50) UNIQUE NOT NULL,
  qr_code_data TEXT NOT NULL,
  qr_code_image TEXT, -- Base64 PNG

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN ('pending_payment', 'verifying', 'approved', 'rejected', 'manual_review', 'expired')
  ),

  -- Slip Details
  slip_image_path VARCHAR(255),
  slip_thumbnail_path VARCHAR(255),
  slip_uploaded_at TIMESTAMP,
  slip_deleted_at TIMESTAMP, -- When auto-deleted after 30 days

  -- Verification Results (JSONB for flexibility)
  verification_results JSONB,
  /*
  Example structure:
  {
    "recipient_valid": true,
    "recipient_confidence": 98.5,
    "extracted_recipient": "0812345678",
    "amount_valid": true,
    "amount_confidence": 96.2,
    "extracted_amount": 249.00,
    "authenticity_score": 97.8,
    "qr_code_valid": true,
    "qr_decoded_data": "...",
    "duplicate_check_passed": true,
    "image_hash": "a1b2c3d4e5f6g7h8",
    "timestamp_valid": true,
    "extracted_timestamp": "2025-01-18T14:23:45Z",
    "overall_confidence": 97.5,
    "ai_model_used": "gpt-4-vision-preview",
    "ai_reasoning": "..."
  }
  */

  -- Manual Review
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_decision VARCHAR(20) CHECK (review_decision IN ('approve', 'reject', 'request_info')),
  review_notes TEXT,

  -- Rejection
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP, -- Payment window expiry (created_at + 30 min)
  completed_at TIMESTAMP, -- When credits allocated

  -- Audit Trail
  ip_address INET,
  user_agent TEXT,

  -- Soft Delete
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_credit_txn_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_txn_status ON credit_transactions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_credit_txn_reference ON credit_transactions(promptpay_reference);
CREATE INDEX idx_credit_txn_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_txn_flagged ON credit_transactions(flagged_for_review)
  WHERE flagged_for_review = true AND deleted_at IS NULL;

-- Auto-update updated_at
CREATE TRIGGER update_credit_txn_updated_at
  BEFORE UPDATE ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Column Details

| Column               | Type          | Nullable | Description                 |
| -------------------- | ------------- | -------- | --------------------------- |
| id                   | UUID          | No       | Primary key                 |
| user_id              | UUID          | No       | User who purchased          |
| package_id           | VARCHAR(50)   | No       | Credit package ID           |
| credits_purchased    | INTEGER       | No       | Base credits from package   |
| bonus_credits        | INTEGER       | No       | Bonus from overpayment      |
| total_credits        | INTEGER       | No       | Auto-calculated total       |
| price_thb            | DECIMAL(10,2) | No       | Package price               |
| amount_paid_thb      | DECIMAL(10,2) | Yes      | Actual amount paid          |
| overpayment_thb      | DECIMAL(10,2) | Yes      | Auto-calculated overpayment |
| status               | VARCHAR(20)   | No       | Current status              |
| verification_results | JSONB         | Yes      | AI verification results     |
| flagged_for_review   | BOOLEAN       | No       | Manual review flag          |
| expires_at           | TIMESTAMP     | Yes      | When transaction expires    |

### Sample Data

```sql
INSERT INTO credit_transactions (
  id,
  user_id,
  package_id,
  credits_purchased,
  bonus_credits,
  price_thb,
  amount_paid_thb,
  promptpay_reference,
  qr_code_data,
  status,
  slip_image_path,
  verification_results,
  completed_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'user-uuid-here',
  'pkg_100_credits',
  100,
  25,
  199.00,
  249.00,
  'TXN-20250118-A7K9M',
  '00020101021129370016...',
  'approved',
  'storage/slips/2025/01/TXN-20250118-A7K9M.jpg',
  '{"recipient_valid": true, "amount_valid": true, "authenticity_score": 97.8, "overall_confidence": 97.5}',
  '2025-01-18 14:05:30'
);
```

---

## Table: credit_packages

Available credit packages for purchase.

### Schema

```sql
CREATE TABLE credit_packages (
  -- Primary Key
  id VARCHAR(50) PRIMARY KEY,

  -- Package Details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  price_thb DECIMAL(10, 2) NOT NULL CHECK (price_thb >= 100),

  -- Bonuses and Discounts
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),

  -- Display
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_pkg_active ON credit_packages(is_active, display_order);

-- Auto-update
CREATE TRIGGER update_credit_pkg_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Sample Data

```sql
INSERT INTO credit_packages VALUES
('pkg_100_credits', 'Starter Pack', 'Perfect for trying out', 100, 199.00, 0, 0, true, false, 1),
('pkg_500_credits', 'Popular Pack', 'Most popular choice', 500, 899.00, 50, 10, true, true, 2),
('pkg_1000_credits', 'Pro Pack', 'Best value for power users', 1000, 1699.00, 150, 15, true, false, 3);
```

---

## Table: slip_image_hashes

Stores perceptual hashes of payment slips for duplicate detection.

### Schema

```sql
CREATE TABLE slip_image_hashes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction Reference
  transaction_id UUID NOT NULL REFERENCES credit_transactions(id) ON DELETE CASCADE,

  -- Hash Data
  perceptual_hash VARCHAR(16) NOT NULL, -- 64-bit hash as hex
  reference_number VARCHAR(50), -- Extracted from slip
  composite_key VARCHAR(64), -- SHA256({timestamp}_{amount}_{recipient})

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '90 days'
);

-- Indexes for fast duplicate lookup
CREATE INDEX idx_slip_hash_phash ON slip_image_hashes(perceptual_hash);
CREATE INDEX idx_slip_hash_ref ON slip_image_hashes(reference_number);
CREATE INDEX idx_slip_hash_composite ON slip_image_hashes(composite_key);
CREATE INDEX idx_slip_hash_expires ON slip_image_hashes(expires_at);
```

### Column Details

| Column           | Type        | Description                          |
| ---------------- | ----------- | ------------------------------------ |
| perceptual_hash  | VARCHAR(16) | pHash of slip image (64-bit hex)     |
| reference_number | VARCHAR(50) | Transaction ref from slip            |
| composite_key    | VARCHAR(64) | SHA256 of timestamp+amount+recipient |
| expires_at       | TIMESTAMP   | Auto-delete after 90 days            |

### Cleanup Job

```sql
-- Daily cron to delete expired hashes
DELETE FROM slip_image_hashes WHERE expires_at < NOW();
```

---

## Table: manual_review_queue

Tracks transactions flagged for manual review.

### Schema

```sql
CREATE TABLE manual_review_queue (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction Reference
  transaction_id UUID NOT NULL UNIQUE REFERENCES credit_transactions(id) ON DELETE CASCADE,

  -- Flag Details
  flagged_at TIMESTAMP NOT NULL DEFAULT NOW(),
  flag_reason TEXT NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),

  -- Review Details
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  decision VARCHAR(20) CHECK (decision IN ('approve', 'reject', 'request_info')),
  decision_reason TEXT,
  decision_notes TEXT,

  -- SLA Tracking
  sla_deadline TIMESTAMP GENERATED ALWAYS AS (
    CASE
      WHEN priority = 'high' THEN flagged_at + INTERVAL '1 hour'
      WHEN priority = 'normal' THEN flagged_at + INTERVAL '2 hours'
      ELSE flagged_at + INTERVAL '4 hours'
    END
  ) STORED
);

-- Indexes
CREATE INDEX idx_review_queue_pending ON manual_review_queue(reviewed_at)
  WHERE reviewed_at IS NULL;
CREATE INDEX idx_review_queue_priority ON manual_review_queue(priority, flagged_at)
  WHERE reviewed_at IS NULL;
CREATE INDEX idx_review_queue_sla ON manual_review_queue(sla_deadline)
  WHERE reviewed_at IS NULL;
```

### Sample Query - Pending Reviews

```sql
SELECT
  mrq.id,
  mrq.transaction_id,
  ct.promptpay_reference,
  u.email AS user_email,
  ct.amount_paid_thb,
  mrq.flagged_at,
  mrq.flag_reason,
  mrq.priority,
  mrq.sla_deadline,
  (mrq.sla_deadline < NOW()) AS is_overdue
FROM manual_review_queue mrq
JOIN credit_transactions ct ON ct.id = mrq.transaction_id
JOIN users u ON u.id = ct.user_id
WHERE mrq.reviewed_at IS NULL
ORDER BY mrq.priority DESC, mrq.flagged_at ASC
LIMIT 20;
```

---

## Table: admin_actions (Audit Log)

Logs all admin actions for audit trail.

### Schema

```sql
CREATE TABLE admin_actions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin Details
  admin_id UUID NOT NULL REFERENCES users(id),
  admin_email VARCHAR(255) NOT NULL,

  -- Action Details
  action_type VARCHAR(50) NOT NULL, -- 'review_approve', 'review_reject', etc.
  resource_type VARCHAR(50) NOT NULL, -- 'credit_transaction'
  resource_id UUID NOT NULL,

  -- Action Data
  action_data JSONB, -- Stores decision, reason, notes, etc.

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id, created_at DESC);
CREATE INDEX idx_admin_actions_resource ON admin_actions(resource_type, resource_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);
```

### Sample Data

```sql
INSERT INTO admin_actions (
  admin_id,
  admin_email,
  action_type,
  resource_type,
  resource_id,
  action_data
) VALUES (
  'admin-uuid',
  'admin@smartaihub.com',
  'review_approve',
  'credit_transaction',
  'txn-uuid',
  '{"decision": "approve", "reason": "Verified authentic", "credits_allocated": 125}'
);
```

---

## Views

### view_pending_transactions

Quick view of all pending transactions.

```sql
CREATE VIEW view_pending_transactions AS
SELECT
  ct.id,
  ct.promptpay_reference,
  ct.user_id,
  u.email AS user_email,
  ct.package_id,
  ct.price_thb,
  ct.status,
  ct.created_at,
  ct.expires_at,
  (ct.expires_at < NOW()) AS is_expired
FROM credit_transactions ct
JOIN users u ON u.id = ct.user_id
WHERE ct.status IN ('pending_payment', 'verifying', 'manual_review')
  AND ct.deleted_at IS NULL
ORDER BY ct.created_at DESC;
```

### view_review_queue_summary

Summary of manual review queue.

```sql
CREATE VIEW view_review_queue_summary AS
SELECT
  priority,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE sla_deadline < NOW()) AS overdue_count,
  MIN(flagged_at) AS oldest_flagged_at
FROM manual_review_queue
WHERE reviewed_at IS NULL
GROUP BY priority;
```

---

## Functions

### update_updated_at_column()

Trigger function to auto-update updated_at timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### allocate_credits_atomic()

Atomically allocate credits to user upon approval.

```sql
CREATE OR REPLACE FUNCTION allocate_credits_atomic(
  p_transaction_id UUID,
  p_total_credits INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_status VARCHAR(20);
BEGIN
  -- Lock transaction row
  SELECT user_id, status INTO v_user_id, v_status
  FROM credit_transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  -- Check if already completed (idempotency)
  IF v_status = 'approved' THEN
    RETURN TRUE;
  END IF;

  -- Update user balance
  UPDATE users
  SET credit_balance = credit_balance + p_total_credits
  WHERE id = v_user_id;

  -- Mark transaction complete
  UPDATE credit_transactions
  SET
    status = 'approved',
    completed_at = NOW()
  WHERE id = p_transaction_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to allocate credits: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

---

## Redis Cache Schema

### Key Patterns

```
# Rate limiting
rate_limit:purchase:{user_id} → Counter (TTL: 1 hour)
rate_limit:upload:{transaction_id} → Counter (TTL: 24 hours)

# Session cache
qr_code:{transaction_id} → QR image base64 (TTL: 30 minutes)

# Queue
verification_queue → List of transaction IDs

# Locks
lock:txn:{transaction_id} → Lock flag (TTL: 30 seconds)
```

### Sample Redis Commands

```redis
# Set rate limit
INCR rate_limit:purchase:user-uuid
EXPIRE rate_limit:purchase:user-uuid 3600

# Cache QR code
SETEX qr_code:TXN-123 1800 "data:image/png;base64,..."

# Push to verification queue
LPUSH verification_queue TXN-123

# Acquire lock
SETNX lock:txn:TXN-123 1
EXPIRE lock:txn:TXN-123 30
```

---

## File Storage Structure

```
storage/
├── slips/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── TXN-20250118-A7K9M_1705564800.jpg
│   │   │   ├── TXN-20250118-B2C3D_1705564850.png
│   │   │   └── ...
│   │   ├── 02/
│   │   └── ...
│   └── thumbnails/
│       ├── TXN-20250118-A7K9M.jpg (400x400)
│       └── ...
├── invoices/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── INV-TXN-20250118-A7K9M.pdf
│   │   │   └── ...
│   │   └── ...
└── logs/
    └── slip-cleanup.log
```

---

## Migration Scripts

### Initial Migration

```sql
-- migrations/001_create_credit_topup_tables.sql

BEGIN;

-- Create tables in order (respecting foreign keys)
CREATE TABLE credit_packages (...);
CREATE TABLE credit_transactions (...);
CREATE TABLE slip_image_hashes (...);
CREATE TABLE manual_review_queue (...);
CREATE TABLE admin_actions (...);

-- Create indexes
-- Create triggers
-- Create views
-- Create functions

-- Insert default packages
INSERT INTO credit_packages VALUES (...);

COMMIT;
```

### Rollback Migration

```sql
-- migrations/001_rollback.sql

BEGIN;

DROP VIEW IF EXISTS view_review_queue_summary;
DROP VIEW IF EXISTS view_pending_transactions;
DROP TABLE IF EXISTS admin_actions;
DROP TABLE IF EXISTS manual_review_queue;
DROP TABLE IF EXISTS slip_image_hashes;
DROP TABLE IF EXISTS credit_transactions;
DROP TABLE IF EXISTS credit_packages;
DROP FUNCTION IF EXISTS allocate_credits_atomic;
DROP FUNCTION IF EXISTS update_updated_at_column;

COMMIT;
```

---

## Performance Considerations

### Query Optimization

**Slow query example:**

```sql
-- BAD: Full table scan
SELECT * FROM credit_transactions
WHERE status = 'pending_payment';
```

**Optimized:**

```sql
-- GOOD: Uses partial index
SELECT * FROM credit_transactions
WHERE status = 'pending_payment' AND deleted_at IS NULL
LIMIT 100;
```

### Partitioning (Future)

For high volume (>10M transactions), consider partitioning by month:

```sql
CREATE TABLE credit_transactions_2025_01
  PARTITION OF credit_transactions
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## Backup Strategy

- **Full backup:** Daily at 3 AM
- **Incremental:** Every 6 hours
- **Retention:** 30 days
- **Test restore:** Monthly

---

## Data Retention Policy

| Data Type     | Retention | Action              |
| ------------- | --------- | ------------------- |
| Transactions  | Forever   | Soft delete only    |
| Slip images   | 30 days   | Auto-delete         |
| Slip hashes   | 90 days   | Hard delete         |
| Audit logs    | 2 years   | Archive then delete |
| Queue entries | 30 days   | Hard delete         |
