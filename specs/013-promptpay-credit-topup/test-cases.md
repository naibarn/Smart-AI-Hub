# Test Cases - PromptPay Credit Top-up

## Test Coverage Matrix

| Category          | Unit Tests | Integration Tests | E2E Tests | Total   |
| ----------------- | ---------- | ----------------- | --------- | ------- |
| Purchase Flow     | 15         | 8                 | 5         | 28      |
| Slip Verification | 25         | 12                | 8         | 45      |
| Manual Review     | 10         | 6                 | 4         | 20      |
| Business Rules    | 20         | 5                 | 3         | 28      |
| **Total**         | **70**     | **31**            | **20**    | **121** |

---

## Critical Path Tests (Must Pass)

### TC-001: Valid Slip - Auto Approve ✅

**Priority:** CRITICAL  
**Type:** End-to-End

**Preconditions:**

- User logged in
- User has 0 credits

**Test Data:**

- Package: 100 credits for 199 THB
- Slip: Genuine SCB slip with correct recipient, amount 199 THB

**Steps:**

1. User selects "Starter Pack" (100 credits, 199 THB)
2. System generates QR code and transaction ID
3. User "pays" via PromptPay (simulated)
4. User uploads genuine payment slip
5. System verifies slip with AI

**Expected Result:**

- ✅ Status: `approved`
- ✅ Credits added: 100 credits
- ✅ New balance: 100 credits
- ✅ Verification time: < 30 seconds
- ✅ Email notification sent
- ✅ Transaction status: `completed`
- ✅ All confidence scores ≥ 90%

---

### TC-002: Wrong Recipient - Auto Reject ❌

**Priority:** CRITICAL  
**Type:** Integration

**Test Data:**

- Package: 100 credits for 199 THB
- Slip: Genuine slip but to DIFFERENT PromptPay ID

**Steps:**

1. Initiate purchase
2. Upload slip with wrong recipient (e.g., 0898765432 instead of 0812345678)

**Expected Result:**

- ❌ Status: `rejected`
- ❌ Credits added: 0
- ❌ Error message: "Wrong recipient. Please transfer to our PromptPay account: 081-234-5678"
- ✅ Verification results logged
- ✅ User can create new transaction

---

### TC-003: Insufficient Amount - Auto Reject ❌

**Priority:** CRITICAL  
**Type:** Integration

**Test Data:**

- Package: 100 credits for 199 THB
- Slip: Correct recipient but only 180 THB paid

**Steps:**

1. Initiate purchase
2. Upload slip showing 180 THB payment (underpaid by 19 THB)

**Expected Result:**

- ❌ Status: `rejected`
- ❌ Error: "Insufficient payment. Expected at least 199 THB but received 180 THB."
- ✅ No credits allocated

---

### TC-004: Duplicate Slip - Reject Second Upload 🚫

**Priority:** CRITICAL  
**Type:** Integration

**Test Data:**

- Same slip uploaded twice (by same user or different users)

**Steps:**

1. User A uploads slip → approved
2. User A tries to upload SAME slip again

**Expected Result:**

- ❌ Status: `rejected`
- ❌ Error: "This slip has already been used. Previously used on: {date}"
- ✅ First transaction: still approved
- ✅ Second transaction: rejected
- ✅ Perceptual hash match detected

**Variation:**

- User B tries to upload User A's slip
- Result: Rejected + security alert sent

---

### TC-005: Fake Slip - Auto Reject or Manual Review ⚠️

**Priority:** CRITICAL  
**Type:** Integration

**Test Data:**

- Fake/edited slip (Photoshopped amount or recipient)

**Steps:**

1. Initiate purchase
2. Upload obviously fake slip (edited in Photoshop)

**Expected Result:**

- **If authenticity < 75%:**
  - ❌ Status: `rejected`
  - ❌ Error: "Slip verification failed. Slip appears to be edited."
- **If authenticity 75-94%:**
  - ⏳ Status: `manual_review`
  - ⏳ Message: "Your slip is being reviewed. Expected within 2 hours."

---

### TC-006: Overpayment - Bonus Credits 💰

**Priority:** HIGH  
**Type:** Integration

**Test Data:**

- Package: 100 credits for 199 THB (1.99 THB/credit)
- Slip: Shows 249 THB payment (overpaid 50 THB)

**Steps:**

1. Initiate purchase for 199 THB
2. Upload slip showing 249 THB payment

**Expected Result:**

- ✅ Status: `approved`
- ✅ Base credits: 100
- ✅ Bonus credits: FLOOR(50 / 1.99) = 25
- ✅ Total credits: 125
- ✅ Message: "Payment verified! You received 25 bonus credits from overpayment."

**Edge Cases:**

- Overpay 5 THB (< 10): No bonus, approved
- Overpay 1500 THB: Flag for manual review (suspicious)

---

### TC-007: Expired Transaction - Reject Upload 🕒

**Priority:** HIGH  
**Type:** Integration

**Test Data:**

- Transaction created 25 hours ago
- Status: `expired`

**Steps:**

1. Create transaction
2. Wait 25 hours (or set created_at to 25 hours ago)
3. Try to upload slip

**Expected Result:**

- ❌ Status: remains `expired`
- ❌ Error: "Transaction expired. Please create a new purchase."
- ❌ Upload blocked

---

### TC-008: Low Confidence - Manual Review ⏳

**Priority:** HIGH  
**Type:** Integration

**Test Data:**

- Slip with blurry amount (confidence 85%)
- All other checks pass

**Steps:**

1. Upload slip with slightly blurry amount section

**Expected Result:**

- ⏳ Status: `manual_review`
- ⏳ Message: "Your slip is being reviewed. Expected within 2 hours."
- ✅ Flagged in review queue
- ✅ Admin can view slip and all AI analysis
- ✅ No credits allocated yet

---

### TC-009: Manual Review - Admin Approves ✅

**Priority:** HIGH  
**Type:** E2E

**Preconditions:**

- Transaction in `manual_review` status

**Steps:**

1. Admin logs in to review dashboard
2. Admin views slip and AI analysis
3. Admin clicks "Approve" with reason: "Verified authentic"

**Expected Result:**

- ✅ Status: changed to `approved`
- ✅ Credits allocated immediately
- ✅ User receives email: "Payment approved by our team"
- ✅ Review queue item removed
- ✅ Admin action logged

---

### TC-010: Manual Review - Admin Rejects ❌

**Priority:** HIGH  
**Type:** E2E

**Steps:**

1. Admin views slip in review queue
2. Admin clicks "Reject" with reason: "Slip appears edited"

**Expected Result:**

- ❌ Status: changed to `rejected`
- ❌ No credits allocated
- ✅ User receives email with rejection reason
- ✅ User can create new transaction
- ✅ Admin action logged

---

## Additional Test Scenarios

### TC-011: File Too Large

**Input:** 15 MB image file  
**Expected:** HTTP 400 "File too large. Maximum 10MB."

---

### TC-012: Invalid File Format

**Input:** .exe file renamed to .jpg  
**Expected:** HTTP 400 "Invalid file format. Upload JPG, PNG or PDF."

---

### TC-013: Corrupted Image

**Input:** Corrupted JPEG file  
**Expected:** HTTP 400 "File corrupted. Please re-screenshot slip."

---

### TC-014: Missing QR Code in Slip

**Input:** Old slip format without QR code  
**Expected:** Lower authenticity score, possibly manual review

---

### TC-015: QR Code Mismatch

**Input:** Slip where QR data != printed amount  
**Expected:** Authenticity check fails, rejected or manual review

---

### TC-016: Multiple Currencies

**Input:** Slip showing USD instead of THB  
**Expected:** Rejected "Currency must be THB"

---

### TC-017: Slip Too Old (> 24 hours)

**Input:** Slip with timestamp > 24 hours ago  
**Expected:** Rejected "Payment slip too old"

---

### TC-018: Future Timestamp

**Input:** Slip with timestamp in future  
**Expected:** Rejected "Invalid timestamp"

---

### TC-019: Rate Limit - Purchase Initiation

**Setup:** User initiates 6 purchases in 1 hour  
**Expected:** 6th request gets HTTP 429 "Rate limit exceeded"

---

### TC-020: Rate Limit - Slip Upload

**Setup:** Upload 4 slips for same transaction  
**Expected:** 4th upload rejected "Maximum uploads reached"

---

### TC-021: Transaction Not Found

**Input:** Invalid transaction_id  
**Expected:** HTTP 404 "Transaction not found"

---

### TC-022: Unauthorized Access

**Input:** No JWT token  
**Expected:** HTTP 401 "Authentication required"

---

### TC-023: Wrong User Uploads Slip

**Setup:** User A creates transaction, User B tries to upload slip  
**Expected:** HTTP 403 "Forbidden"

---

### TC-024: Concurrent Credit Allocation

**Setup:** Same transaction approved twice simultaneously  
**Expected:** Credits allocated once (idempotency works)

---

### TC-025: Database Transaction Rollback

**Setup:** Simulate DB failure during credit allocation  
**Expected:** Entire transaction rolled back, no partial state

---

### TC-026: AI API Timeout

**Setup:** AI API takes > 30 seconds  
**Expected:** Fallback to manual review queue

---

### TC-027: AI API Error

**Setup:** AI API returns 500 error  
**Expected:** Retry, then fallback to manual review

---

### TC-028: Email Service Down

**Setup:** SMTP server unavailable  
**Expected:** Credits still allocated, email queued for retry

---

### TC-029: Storage Disk Full

**Setup:** Disk at 100% capacity  
**Expected:** Upload fails gracefully with clear error

---

### TC-030: Cleanup Job - Delete Old Slips

**Setup:** Slips older than 30 days  
**Expected:** Files deleted, DB updated with slip_deleted_at

---

## Performance Tests

### PT-001: Verification Speed

**Test:** Upload 100 slips simultaneously  
**Expected:** 95th percentile < 30 seconds

---

### PT-002: Concurrent Users

**Test:** 1,000 users browsing packages simultaneously  
**Expected:** Response time < 1 second

---

### PT-003: Queue Depth

**Test:** 150 verifications pending  
**Expected:** System continues processing, alerts sent at 100

---

### PT-004: Database Load

**Test:** 10,000 status checks per minute  
**Expected:** No degradation, cached responses

---

## Security Tests

### ST-001: SQL Injection

**Input:** `transaction_id'; DROP TABLE users;--`  
**Expected:** Treated as string, no SQL execution

---

### ST-002: XSS in Slip

**Input:** Slip with embedded JavaScript in metadata  
**Expected:** Sanitized, no script execution

---

### ST-003: Path Traversal

**Input:** `../../etc/passwd` as filename  
**Expected:** Blocked, file saved with safe name

---

### ST-004: Brute Force Detection

**Input:** 100 failed slip uploads in 1 minute  
**Expected:** User blocked, security alert

---

## Edge Cases

### EC-001: Exact Package Price

**Input:** Pay exactly 199.00 THB for 199 THB package  
**Expected:** Approved, no bonus

---

### EC-002: Tiny Overpayment

**Input:** Pay 199.01 THB for 199 THB package  
**Expected:** Approved, no bonus (< 10 THB tolerance)

---

### EC-003: Large Overpayment

**Input:** Pay 2000 THB for 199 THB package  
**Expected:** Flagged for manual review (suspicious)

---

### EC-004: Multiple Banks

**Test:** Upload slips from all 8 supported banks  
**Expected:** All verified correctly

---

### EC-005: Thai Numerals

**Input:** Slip with Thai numerals (๑๒๓.๔๕ THB)  
**Expected:** Converted and verified correctly

---

### EC-006: Multiple QR Codes

**Input:** Slip with promotional QR + payment QR  
**Expected:** Correct QR identified and decoded

---

### EC-007: Low Resolution Slip

**Input:** 600x400 pixel image (below 800x600)  
**Expected:** Rejected "Image too small"

---

### EC-008: High Resolution Slip

**Input:** 10000x8000 pixel image (10MB)  
**Expected:** Accepted, resized for processing

---

## Regression Tests

### RT-001: Previous Bug - Duplicate Hash Collision

**Bug:** Different images generated same hash  
**Test:** Verify collision rate < 0.001%

---

### RT-002: Previous Bug - Timezone Issues

**Bug:** Timestamps in different timezone caused expiry errors  
**Test:** Verify all timestamps in UTC, displayed in Bangkok time

---

### RT-003: Previous Bug - Race Condition in Credit Allocation

**Bug:** Concurrent requests allocated credits twice  
**Test:** Verify atomic operations, idempotency

---

## Test Data Sets

### Valid Test Slips

- `test/slips/valid/scb_199thb.jpg` - SCB slip, 199 THB
- `test/slips/valid/kbank_899thb.png` - Kbank slip, 899 THB
- `test/slips/valid/bbl_overpay.jpg` - BBL slip, overpaid 50 THB

### Invalid Test Slips

- `test/slips/invalid/wrong_recipient.jpg` - Different PromptPay ID
- `test/slips/invalid/insufficient.jpg` - Underpaid
- `test/slips/invalid/fake_edited.jpg` - Photoshopped amount
- `test/slips/invalid/old_slip.jpg` - 2 months old

### Edge Case Test Slips

- `test/slips/edge/blurry.jpg` - Low quality, hard to read
- `test/slips/edge/thai_numerals.jpg` - Thai numbers
- `test/slips/edge/no_qr.jpg` - Old format without QR

---

## Automated Test Commands

```bash
# Run all tests
npm test

# Run critical path only
npm test -- --grep "CRITICAL"

# Run integration tests
npm test:integration

# Run E2E tests
npm test:e2e

# Run with coverage
npm test:coverage

# Run specific test file
npm test tests/slip-verification.test.ts

# Run in watch mode
npm test:watch
```

---

## Test Environment Setup

```bash
# Setup test database
npm run db:test:setup

# Seed test data
npm run db:test:seed

# Reset test database
npm run db:test:reset

# Start test server
npm run test:server

# Mock AI API
export USE_MOCK_AI=true
npm test
```

---

## Acceptance Criteria

### Before Production Deployment

- [ ] All CRITICAL tests pass (100%)
- [ ] All HIGH tests pass (≥ 95%)
- [ ] Code coverage ≥ 80%
- [ ] Performance tests meet targets
- [ ] Security tests pass (100%)
- [ ] Manual QA completed
- [ ] Stakeholder approval

### Continuous Integration

- [ ] All tests run on every commit
- [ ] PR blocked if tests fail
- [ ] Nightly full test suite
- [ ] Weekly performance tests

---

## Test Maintenance

- Review and update tests: Quarterly
- Add tests for new features: Always
- Fix flaky tests: Within 24 hours
- Remove obsolete tests: During refactoring

---

## Bug Report Template

```markdown
**Test Case:** TC-XXX
**Environment:** Production / Staging / Local
**Steps to Reproduce:**

1. ...
2. ...

**Expected Result:** ...
**Actual Result:** ...
**Screenshots:** [attach]
**Logs:** [attach]
**Severity:** Critical / High / Medium / Low
```
