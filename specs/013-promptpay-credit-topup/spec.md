---
spec_id: FEAT-013
title: PromptPay Credit Top-up with AI Slip Verification
type: Feature
status: Draft
version: 1.0.0
created: 2025-01-18
updated: 2025-01-18
author: Product Team
priority: High
category: Payment
parent: null
dependencies:
  - FEAT-002 # Credit System - must exist for credit allocation
  - FEAT-001 # User Management - for authentication
related_specs:
  - FEAT-002 # Credit System
  - FEAT-001 # User Management
tags:
  - payment
  - promptpay
  - ai-verification
  - thailand
  - credit-topup
---

# FEAT-013: PromptPay Credit Top-up with AI Slip Verification

## Overview

### Purpose

Enable Thai users to purchase credits via Thailand's PromptPay payment system with automated AI-powered payment slip verification, ensuring secure, accurate, and scalable credit transactions without manual intervention.

### Background

- **Market Context:** PromptPay is Thailand's dominant digital payment method, used by 90%+ of smartphone users for instant money transfers
- **Current Pain Point:** Manual verification of payment slips doesn't scale and is prone to human error
- **Solution Approach:** Leverage AI/LLM technology (GPT-4 Vision/Claude 3.5 Sonnet) to automatically verify payment slips with 95%+ accuracy
- **Business Impact:** Reduces verification time from hours to seconds, eliminates manual labor costs, improves user experience, and enables 24/7 credit purchases

### Scope

**In Scope:**

- PromptPay QR code generation for payments
- Payment slip upload interface (drag-drop, file picker)
- AI-powered slip verification:
  - Recipient validation (PromptPay ID matching)
  - Amount verification (sufficient payment check)
  - Authenticity detection (fake slip prevention)
  - QR code validation within slip
- Duplicate slip prevention (perceptual hashing)
- Automatic credit allocation upon successful verification
- Manual review queue for low-confidence cases
- Transaction audit trail and reporting
- Local slip storage with 30-day auto-cleanup

**Out of Scope (Future Phases):**

- Other payment methods (credit card, bank transfer, mobile banking)
- Refund/reversal processing
- International payments (non-THB currencies)
- Real-time bank API integration (Phase 2)
- Multi-currency support
- Cryptocurrency payments

### Success Criteria

**Quantitative Metrics:**

- Verification accuracy: ≥95% (less than 5% errors requiring manual correction)
- Verification speed: <30 seconds (95th percentile)
- Zero duplicate slip acceptance: 100% prevention rate
- False rejection rate: <1% (minimize legitimate payment rejections)
- Manual review rate: <10% (most transactions auto-approved)

**Qualitative Metrics:**

- User satisfaction: >4.5/5 rating for payment experience
- Feature adoption: 60%+ of active users use PromptPay within 3 months
- Support ticket reduction: 80% fewer payment-related inquiries

---

## User Stories

### US-013-01: Initiate Credit Purchase

**As a** registered user  
**I want to** select a credit package and see PromptPay payment instructions  
**So that** I can purchase credits using my preferred payment method

**Priority:** Critical  
**Estimated Effort:** 3 story points  
**Dependencies:** None

**Acceptance Criteria:**

- **US-013-AC1:** User can view available credit packages with clear pricing
  - Display minimum 3 package tiers (e.g., Starter 100 credits, Popular 500 credits, Pro 1000 credits)
  - Show for each package: name, credit amount, THB price, savings percentage, bonus credits
  - Highlight "Most Popular" or "Best Value" badge on recommended package
  - Responsive grid layout: 3 columns desktop, 1 column mobile
  - Sort by: display_order field in database

- **US-013-AC2:** User can select package and initiate secure purchase
  - Click "Buy Credits" button opens payment modal
  - Generate unique transaction ID: format TXN-YYYYMMDD-{5-char-random}
  - Example: TXN-20250118-A7K9M
  - Set transaction expiry: current_time + 30 minutes
  - Display countdown timer: "Complete payment within: 29:45"
  - Store in database with status: "pending_payment"

- **US-013-AC3:** System displays PromptPay QR code and payment details
  - Generate PromptPay QR code using EMVCo standard
  - QR code size: 300x300 pixels minimum (readable by all banking apps)
  - Display company PromptPay ID: format 0XX-XXX-XXXX (masked for security)
  - Show exact transfer amount: 1,234.56 THB (formatted with comma separator)
  - Show transaction reference: TXN-20250118-A7K9M
  - Show payment deadline: "Pay by 14:45 (30 minutes)"
  - QR must be downloadable as PNG image

- **US-013-AC4:** User receives clear step-by-step instructions
  - **Step 1:** "Scan QR code with your mobile banking app (Kbank, SCB, BBL, etc.)"
  - **Step 2:** "Verify amount is exactly 1,234.56 THB"
  - **Step 3:** "Complete transfer and save payment slip screenshot"
  - **Step 4:** "Upload slip on this page within 24 hours"
  - Show example slip image with annotation arrows
  - Warning box: "⚠️ Do not edit slip image. Upload original screenshot only."
  - Tip: "Having trouble? Contact support with transaction ID"

**Technical Notes:**

- Use library: promptpay-qr (npm) for QR generation
- QR payload format: EMVCo standard with PromptPay tag
- Store transaction: PostgreSQL with indexed transaction_id
- Cache QR image: 30 minutes TTL in Redis

**UI/UX Notes:**

- Modal should be dismissible but show warning: "Transaction will expire"
- Mobile-first design: QR easily scannable on same device
- Copy buttons for: PromptPay ID, Amount, Reference

---

### US-013-02: Upload Payment Slip

**As a** user who has completed PromptPay transfer  
**I want to** upload my payment slip screenshot  
**So that** the system can verify my payment and credit my account automatically

**Priority:** Critical  
**Estimated Effort:** 5 story points  
**Dependencies:** US-013-01

**Acceptance Criteria:**

- **US-013-AC5:** User can upload slip image via multiple methods
  - **Upload methods:**
    - Drag and drop file onto upload zone
    - Click "Browse Files" to open file picker
    - Paste from clipboard (Ctrl+V / Cmd+V)
  - **Accepted formats:** JPG, JPEG, PNG, PDF
  - **Max file size:** 10MB
  - **Show upload progress:** Progress bar 0-100% with percentage text
  - **Display preview:** Show uploaded image (max width 600px, maintain aspect ratio)
  - **Allow re-upload:** "Upload Different Slip" button if user uploaded wrong file

- **US-013-AC6:** System validates uploaded file before processing
  - **File size validation:**
    - Check: file.size <= 10MB
    - Error if fail: "File too large. Maximum size is 10MB. Please compress or crop your image."
  - **File type validation:**
    - Check: MIME type in ['image/jpeg', 'image/png', 'application/pdf']
    - Error if fail: "Invalid file format. Please upload JPG, PNG or PDF only."
  - **Image quality validation:**
    - Check: image resolution >= 800x600 pixels
    - Error if fail: "Image resolution too low (minimum 800x600). Please upload clearer image."
  - **File corruption check:**
    - Try to read image/PDF headers
    - Error if fail: "File appears corrupted. Please re-screenshot your payment slip."
  - **Show clear error messages:** Red box with icon, actionable fix suggestion

- **US-013-AC7:** System provides real-time upload and verification status
  - **Uploading state:**
    - Show: "Uploading slip... 45%" with spinner
    - Disable submit button during upload
  - **Uploaded state:**
    - Show: "✓ Slip uploaded successfully"
    - Green checkmark icon
  - **Verifying state:**
    - Show: "🔍 Verifying payment slip... This usually takes less than 30 seconds"
    - Animated spinner or progress indicator
    - Polling interval: check status every 3 seconds
  - **Completed states:**
    - **Approved:** "✅ Payment verified! Credits added to your account."
    - **Rejected:** "❌ Verification failed: {reason}. Please try again or contact support."
    - **Manual Review:** "⏳ Your slip is being reviewed by our team. Expected within 2 hours."

**Technical Notes:**

- **Storage location:** `storage/slips/{year}/{month}/{transaction_id}_{timestamp}.{ext}`
- **Example path:** `storage/slips/2025/01/TXN-20250118-A7K9M_1705564800.jpg`
- **File naming:** `{transaction_id}_{unix_timestamp}.{extension}`
- **Thumbnail generation:** Create 400x400px thumbnail for admin review (stored alongside original)
- **No encryption (Phase 1):** Local storage only, protected by file system permissions
- **Permissions:** File mode 600 (owner read/write only)
- **Serve via API:** Never expose direct file paths to users

**Security Notes:**

- Validate file extension matches MIME type (prevent .exe renamed to .jpg)
- Strip EXIF GPS data if present (privacy protection)
- Virus scan large files before processing (optional: ClamAV integration)

---

### US-013-03: AI Slip Verification - Recipient Validation

**As a** system  
**I want to** verify payment was sent to correct PromptPay account  
**So that** fraudulent or misdirected payments are rejected automatically

**Priority:** Critical  
**Estimated Effort:** 8 story points  
**Dependencies:** US-013-02

**Acceptance Criteria:**

- **US-013-AC8:** Extract recipient information from slip using AI OCR
  - **Extract PromptPay ID:**
    - Format 1: Mobile number (0812345678, 66812345678, +66812345678)
    - Format 2: Citizen ID (1-XXXX-XXXXX-XX-X)
    - Handle with/without separators: 0812345678 or 081-234-5678
  - **Extract recipient name** (if visible on slip):
    - Thai name: "บริษัท สมาร์ท เอไอ ฮับ จำกัด"
    - English name: "Smart AI Hub Co., Ltd."
  - **Extract bank account info:**
    - Account number (if shown)
    - Bank name/code
  - **Support major Thai banks:**
    - SCB (Siam Commercial Bank) - purple theme
    - Kbank (Kasikornbank) - green theme
    - BBL (Bangkok Bank) - blue theme
    - KTB (Krung Thai Bank) - light blue theme
    - TMB (TMB Thanachart Bank) - orange theme
    - BAY (Krungsri/Bank of Ayudhya) - yellow theme
    - CIMB Thai - red theme
    - UOB (United Overseas Bank) - blue theme
  - **Handle different slip layouts:** Each bank has unique slip format

- **US-013-AC9:** Validate extracted recipient matches company account
  - **Get company PromptPay ID from config:**
    - Stored in: environment variable COMPANY_PROMPTPAY_ID
    - Example: "0812345678"
  - **Normalize formats before comparison:**
    - Remove: spaces, dashes, country codes
    - Convert: +66812345678 → 0812345678
    - Convert: 66812345678 → 0812345678
  - **Exact match required:** extracted_id (normalized) == company_id (normalized)
  - **Fuzzy match for names:**
    - Allow variations: "Smart AI Hub" vs "สมาร์ท เอไอ ฮับ"
    - Ignore: "บริษัท", "จำกัด", "Co., Ltd."
    - Case insensitive comparison
  - **Confidence scoring:**
    - PromptPay ID match: confidence 100% if exact, 0% if different
    - Name match: confidence based on similarity score (Levenshtein distance)
  - **Decision logic:**
    - If ID confidence >= 90% AND match: approve recipient
    - If ID confidence >= 90% AND no match: reject (wrong recipient)
    - If ID confidence < 90%: flag for manual review

- **US-013-AC10:** Handle edge cases and uncertainty gracefully
  - **Low confidence scenarios:**
    - Blurry PromptPay ID: confidence < 90%
    - Multiple recipients shown: unclear which is correct
    - Partial ID visible: cannot verify completely
  - **Action for low confidence:**
    - Set flag: flagged_for_review = true
    - Set reason: "Cannot clearly verify recipient from slip"
    - DO NOT auto-reject: prevent false negatives
    - Queue for manual review
  - **Logging for audit:**
    - Store: extracted_recipient, company_recipient, confidence_score
    - Store: AI reasoning/explanation
    - Store: all attempted matches and scores

**Technical Notes:**

- **AI Model:**
  - Primary: OpenAI GPT-4 Vision API
  - Fallback: Anthropic Claude 3.5 Sonnet
- **API Configuration:**
  - Timeout: 30 seconds max
  - Retry: 2 times on network error
  - Cost tracking: log tokens used per request
- **OCR Thai Language:**
  - Ensure model supports Thai characters
  - Test with Thai bank slips before deployment
- **Configuration:**
  - Store COMPANY_PROMPTPAY_ID in .env file
  - Support multiple company IDs (array) for businesses with multiple accounts

**Prompt Engineering:**

```
System: You are analyzing a Thai PromptPay payment slip.
Task: Extract the recipient's PromptPay ID and name.
Format: Return JSON with extracted_id, extracted_name, confidence_score.
Be conservative: If uncertain, return lower confidence.
```

---

### US-013-04: AI Slip Verification - Amount Validation

**As a** system  
**I want to** verify transfer amount matches or exceeds expected amount  
**So that** underpayments are rejected and overpayments are handled correctly

**Priority:** Critical  
**Estimated Effort:** 5 story points  
**Dependencies:** US-013-03

**Acceptance Criteria:**

- **US-013-AC11:** Extract transfer amount from slip using AI OCR
  - **Parse numeric amount:**
    - English format: 1,234.56 (comma thousand separator, period decimal)
    - Thai format: ๑,๒๓๔.๕๖ (Thai numerals with same separators)
    - Handle no separators: 1234.56
  - **Extract currency:**
    - Must be: THB, บาท, or ฿
    - Reject if: USD, EUR, or other currency
  - **Handle Thai text amounts:**
    - Example: "หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบหกสตางค์"
    - Convert to: 1234.56
  - **Multiple amounts on slip:**
    - Identify: "จำนวนเงิน" (Amount) vs "ค่าธรรมเนียม" (Fee)
    - Extract: transfer amount only (not fee or total balance)

- **US-013-AC12:** Validate extracted amount is sufficient
  - **Get expected amount:**
    - From: transaction.price_thb (from database)
    - Example: expected = 199.00 THB
  - **Validation rule:**
    - Formula: extracted_amount >= expected_amount
    - **PASS if:** extracted >= expected (exact or overpaid)
    - **FAIL if:** extracted < expected (underpaid)
  - **Examples:**
    - Expected 199.00, Extracted 199.00 → PASS (exact)
    - Expected 199.00, Extracted 200.00 → PASS (overpaid)
    - Expected 199.00, Extracted 198.00 → FAIL (underpaid)
  - **Logging:**
    - Always log: expected_amount, extracted_amount, difference
    - Log pass/fail decision with reason

- **US-013-AC13:** Handle overpayment with bonus credits
  - **Small overpayment (<10 THB):**
    - Difference: extracted - expected < 10
    - Action: Approve, ignore difference (accounting rounding)
    - Example: Paid 200 THB, expected 199 → approve, no bonus
  - **Significant overpayment (≥10 THB):**
    - Difference: extracted - expected >= 10
    - Action: Approve, add bonus credits
    - **Bonus calculation:**
      - Get: credits_per_thb = package.credits / package.price_thb
      - Calculate: bonus = floor(overpayment_thb \* credits_per_thb)
      - Example: Overpaid 50 THB, rate 0.5 credits/THB → bonus 25 credits
    - **Logging:**
      - Store: overpayment_amount, bonus_credits
      - Flag: has_overpayment = true
      - Note: for accounting reconciliation
  - **Maximum overpayment:**
    - If overpayment > 1000 THB: flag for manual review (suspicious)

- **US-013-AC14:** Handle amount extraction failures gracefully
  - **Low confidence scenarios:**
    - Blurry numbers: confidence < 85%
    - Multiple amounts unclear which is transfer amount
    - OCR confusion: "1" vs "l", "0" vs "O"
  - **Action for low confidence:**
    - Set flag: amount_confidence < 85%
    - Flag for manual review
    - Error message: "Cannot clearly verify amount from slip"
    - DO NOT auto-reject: let human verify
  - **Logging:**
    - Store: all extracted numbers with confidence scores
    - Store: AI reasoning for which number is transfer amount

**Technical Notes:**

- **Number parsing library:** Use numeral.js for robust parsing
- **Thai numeral conversion:**
  - Map: ๐→0, ๑→1, ๒→2, ๓→3, ๔→4, ๕→5, ๖→6, ๗→7, ๘→8, ๙→9
- **Float precision:** Use Decimal.js to avoid floating point errors
- **Rounding:** Always round bonus credits down (floor function)

---

### US-013-05: AI Slip Verification - Authenticity Check

**As a** system  
**I want to** verify payment slip is authentic and not fake/edited  
**So that** fraudulent slips are rejected automatically

**Priority:** Critical  
**Estimated Effort:** 13 story points  
**Dependencies:** US-013-03, US-013-04

**Acceptance Criteria:**

- **US-013-AC15:** Validate slip has genuine bank branding and layout
  - **Bank logo detection:**
    - Identify: SCB lion logo, Kbank "K", BBL building, KTB elephant, etc.
    - Verify: logo quality, color accuracy, positioning
    - Score: logo_confidence (0-100)
  - **Layout validation:**
    - Check: header (bank name, logo), body (transaction details), footer (reference)
    - Match: against known bank slip templates in database
    - Detect: if elements are in wrong positions (red flag)
  - **Font consistency:**
    - Banks use: specific fonts (e.g., SCB uses Sarabun, Kbank uses Kanit)
    - Check: font appears consistent throughout slip
    - Detect: if multiple different fonts used (edit indicator)
  - **Color scheme:**
    - Verify: matches bank's brand colors
    - Example: SCB purple #4E2A84, Kbank green #138F2D
    - Detect: if colors are off or inconsistent

- **US-013-AC16:** Validate PromptPay QR code within slip
  - **Extract QR code from image:**
    - Use library: jsQR (JavaScript QR decoder)
    - Scan entire image for QR codes
    - Handle: multiple QR codes (promotional vs payment)
  - **Decode QR code data:**
    - Parse: EMVCo PromptPay format
    - Extract: PromptPay ID, amount, currency from QR payload
  - **Verify QR matches slip details:**
    - Compare: QR PromptPay ID == slip printed PromptPay ID
    - Compare: QR amount == slip printed amount
    - Compare: QR currency == THB
  - **QR validation results:**
    - All match: qr_code_valid = true, high confidence
    - Mismatch: qr_code_valid = false, flag as suspicious
    - Cannot decode: qr_code_valid = null, flag for review
  - **QR readability:**
    - If QR too small/blurry to decode: flag for review
    - If no QR present: lower authenticity score (some banks don't include QR)

- **US-013-AC17:** Detect image manipulation and editing
  - **Compression artifact analysis:**
    - Check: JPEG compression levels across image
    - Edited images: have inconsistent compression (re-saved multiple times)
    - Detect: if some areas have different compression than others
  - **Clone stamp detection:**
    - Look for: repeated patterns (user copied/pasted numbers)
    - Example: same "9" digit used multiple times in different positions
  - **Content-aware fill detection:**
    - Look for: blurred or smudged areas indicating removal/addition
    - Check: unnatural pixel patterns
  - **EXIF metadata analysis:**
    - Extract: camera model, edit software, creation date
    - Red flags:
      - Edited with: Photoshop, GIMP (editing software)
      - No EXIF data: suspicious (stripped to hide edits)
      - Created date != screenshot time
  - **Screenshot vs photo:**
    - Screenshot: clean edges, consistent resolution, no camera artifacts
    - Photo of screen: moiré patterns, glare, uneven brightness
    - Prefer: screenshots (more authentic)
    - Suspicious: photo of screen (potential re-screenshot of fake)

- **US-013-AC18:** Validate transaction timestamp is recent and valid
  - **Extract date/time from slip:**
    - Format: "18/01/2568 14:23:45" (Thai Buddhist year)
    - Parse: day, month, year, hour, minute, second
  - **Convert Buddhist year to Gregorian:**
    - Formula: gregorian_year = buddhist_year - 543
    - Example: 2568 - 543 = 2025
  - **Timezone handling:**
    - Assume: Bangkok timezone (UTC+7)
    - Convert to UTC for storage
  - **Validation rules:**
    - Transaction must be: within last 24 hours
    - Transaction must NOT be: in the future
    - **REJECT if:** timestamp > 24 hours old ("Payment slip expired")
    - **REJECT if:** timestamp in future ("Invalid timestamp")
  - **Edge cases:**
    - Transaction exactly at midnight: allow
    - Transaction during daylight saving: N/A (Thailand doesn't have DST)

- **US-013-AC19:** AI holistic authenticity analysis
  - **LLM comprehensive review:**
    - Prompt: "Analyze this payment slip for authenticity. Look for signs it's fake or edited."
    - LLM checks: overall consistency, logical coherence, realistic transaction flow
  - **Common fake slip patterns:**
    - Misaligned text
    - Fonts don't match bank's standard
    - Numbers look "too perfect" (computer-generated)
    - Shadows/highlights inconsistent
    - Low-res logo pasted on high-res background
  - **Authenticity scoring:**
    - Output: authenticity_score (0-100)
    - High confidence: >= 95 (clearly authentic)
    - Medium confidence: 80-94 (probably authentic)
    - Low confidence: < 80 (suspicious)
  - **Decision thresholds:**
    - **Auto-approve:** authenticity >= 95 AND all other checks pass
    - **Manual review:** authenticity 80-94 OR any uncertainty
    - **Auto-reject:** authenticity < 80 AND clear fake indicators
  - **AI reasoning:**
    - Store: detailed explanation from LLM
    - Example: "Logo appears genuine, fonts consistent, QR validates, timestamp recent. Appears authentic."
    - Example: "Text alignment inconsistent, amount appears edited (compression mismatch), QR doesn't match printed amount. Likely fake."

**Technical Notes:**

- **Image analysis libraries:**
  - QR decode: jsQR
  - EXIF parsing: exif-parser (npm)
  - Image manipulation detection: custom algorithms or ImageMagick
- **AI Model:**
  - Use: GPT-4 Vision detailed mode for high-res analysis
  - Alternative: Claude 3.5 Sonnet with vision
- **Performance:**
  - QR decode: < 2 seconds
  - AI analysis: < 20 seconds
  - Total: < 30 seconds target
- **Cost optimization:**
  - Compress images before sending to AI (reduce API costs)
  - Use lower-res for initial checks, full-res only if needed

**Database Schema:**

```sql
-- Store all authenticity check results
authenticity_results JSONB {
  "logo_detected": true,
  "logo_confidence": 95,
  "layout_matches_template": true,
  "font_consistent": true,
  "qr_code_valid": true,
  "qr_matches_details": true,
  "manipulation_detected": false,
  "timestamp_valid": true,
  "authenticity_score": 97,
  "ai_reasoning": "..."
}
```

---

### US-013-06: Duplicate Slip Detection

**As a** system  
**I want to** prevent same payment slip from being used multiple times  
**So that** users cannot fraudulently reuse slips to get credits repeatedly

**Priority:** Critical  
**Estimated Effort:** 8 story points  
**Dependencies:** US-013-02

**Acceptance Criteria:**

- **US-013-AC20:** Generate unique fingerprint for each uploaded slip
  - **Perceptual hash (pHash):**
    - Algorithm: DCT-based perceptual hashing
    - Library: imghash (npm)
    - Output: 64-bit hash as hexadecimal string
    - Example: "a1b2c3d4e5f6g7h8"
  - **Why perceptual hash:**
    - Resilient to: minor crops, resizes, compression
    - Similar images: produce similar hashes
    - Different images: produce different hashes
  - **Extract transaction reference:**
    - Look for: "เลขที่อ้างอิง" (Reference number)
    - Pattern: alphanumeric 8-20 chars
    - Example: "REF123456789"
    - Store if found: reference_number field
  - **Create composite key:**
    - Combine: {extracted*timestamp}*{extracted*amount}*{recipient_id}
    - Example: "20250118142345_199.00_0812345678"
    - Hash: SHA256 to create fixed-length key
  - **Store all fingerprints:**
    - Table: slip_image_hashes
    - Fields: transaction_id, perceptual_hash, reference_number, composite_key, created_at

- **US-013-AC21:** Check for duplicates before approving transaction
  - **Query 1: Perceptual hash match**
    - Find: hashes with similarity > 95%
    - Calculate: Hamming distance between hashes
    - Formula: similarity = 1 - (hamming_distance / 64)
    - Match if: similarity >= 0.95
  - **Query 2: Transaction reference match**
    - Find: slips with same reference_number
    - Match if: exact string match (case-insensitive)
  - **Query 3: Composite key match**
    - Find: slips with same {timestamp + amount + recipient}
    - Match if: exact match
  - **Decision logic:**
    - If ANY match found: duplicate detected
    - Get: original transaction details
    - Action: reject new transaction
  - **Performance:**
    - Index: perceptual_hash, reference_number, composite_key
    - Query time: < 100ms

- **US-013-AC22:** Allow legitimate similar transactions
  - **Same user, different legitimate transactions:**
    - Same user: makes 2 separate payments (different times)
    - Same amount: coincidentally pays same amount
    - Different timestamps: 1+ hours apart
    - Action: ALLOW (legitimate separate transactions)
  - **Perceptual hash tolerance:**
    - Threshold: 95% similarity
    - Allows: slight crops (user crops screenshot)
    - Allows: minor resizes (user resizes before upload)
    - Allows: JPEG re-compression
    - Prevents: exact duplicates
  - **Different users, same slip:**
    - User A: uploads slip
    - User B: uploads SAME slip (fraud attempt)
    - Action: REJECT User B's transaction
    - Reason: "This slip has already been used by another account"
    - Alert: security team (potential fraud ring)

- **US-013-AC23:** Provide clear duplicate rejection message
  - **Error message:**
    - Title: "Duplicate Payment Slip Detected"
    - Body: "This payment slip has already been used for a credit purchase."
    - Details: "Previously used on: January 15, 2025 at 2:30 PM"
    - Action: "Please contact support if you believe this is an error."
    - Support: Provide transaction ID for both transactions
  - **Logging for investigation:**
    - Log: current transaction_id, duplicate transaction_id
    - Log: user_id for both (detect if same user or different)
    - Log: similarity score, match type (hash/reference/composite)
    - Alert: if different users (fraud attempt)

**Technical Notes:**

- **Hashing algorithm:**
  - Library: `imghash` or `sharp` with perceptual hash plugin
  - Hash size: 64 bits (balance accuracy vs speed)
- **Hamming distance:**
  - XOR two hashes, count 1-bits
  - Fast operation: < 1ms
- **Database schema:**

```sql
CREATE TABLE slip_image_hashes (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES credit_transactions(id),
  perceptual_hash VARCHAR(16) NOT NULL,
  reference_number VARCHAR(50),
  composite_key VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days'
);

CREATE INDEX idx_perceptual_hash ON slip_image_hashes(perceptual_hash);
CREATE INDEX idx_reference_number ON slip_image_hashes(reference_number);
CREATE INDEX idx_composite_key ON slip_image_hashes(composite_key);
```

- **Retention policy:**
  - Keep hashes: 90 days
  - Auto-delete: daily cron job at 2 AM
  - Reason: balance fraud prevention vs storage costs

---

### US-013-07: Automatic Credit Allocation

**As a** user whose payment slip passed all verifications  
**I want to** receive credits immediately  
**So that** I can start using the service without delay

**Priority:** Critical  
**Estimated Effort:** 5 story points  
**Dependencies:** US-013-03, US-013-04, US-013-05, US-013-06

**Acceptance Criteria:**

- **US-013-AC24:** Allocate credits automatically upon successful verification
  - **Calculate total credits:**
    - Base: package.credits_amount
    - Bonus: bonus_credits (from overpayment, if any)
    - Total: base_credits + bonus_credits
    - Example: 100 (base) + 25 (bonus) = 125 credits
  - **Update user balance atomically:**
    - Query: `UPDATE users SET credit_balance = credit_balance + {total_credits} WHERE id = {user_id}`
    - Use: database transaction (BEGIN...COMMIT)
    - Lock: SELECT FOR UPDATE to prevent race conditions
  - **Mark transaction complete:**
    - Update: transaction.status = "completed"
    - Set: transaction.completed_at = NOW()
    - Set: transaction.credits_allocated = total_credits
  - **All-or-nothing operation:**
    - If ANY step fails: ROLLBACK entire transaction
    - Ensure: credits never allocated without marking transaction complete
    - Ensure: transaction never marked complete without allocating credits

- **US-013-AC25:** Create immutable transaction record
  - **Store comprehensive details:**

```sql
-- Example record
{
  transaction_id: "TXN-20250118-A7K9M",
  user_id: "user-uuid",
  package_id: "pkg_100_credits",
  credits_purchased: 100,
  bonus_credits: 25,
  total_credits: 125,
  price_thb: 199.00,
  amount_paid_thb: 249.00,
  overpayment_thb: 50.00,
  slip_image_path: "storage/slips/2025/01/TXN-20250118-A7K9M.jpg",
  verification_results: {
    recipient_valid: true,
    recipient_confidence: 98,
    amount_valid: true,
    amount_confidence: 95,
    authenticity_score: 97,
    duplicate_check_passed: true,
    overall_confidence: 97
  },
  status: "completed",
  created_at: "2025-01-18T14:00:00Z",
  completed_at: "2025-01-18T14:05:30Z",
  ip_address: "103.xxx.xxx.xxx",
  user_agent: "Mozilla/5.0..."
}
```

- **Immutability rules:**
  - Once status = "completed": NO updates allowed
  - Use: database constraint or application logic
  - Audit trail: never delete, only mark as refunded (if needed in future)

- **US-013-AC26:** Send confirmation notifications to user
  - **Email notification:**
    - Subject: "✓ Credits Successfully Added to Your Account"
    - Body:
      - "Hi {user_name},"
      - "Your payment of {amount_thb} THB has been verified."
      - "Credits added: {total_credits} credits"
      - "New balance: {new_balance} credits"
      - "Transaction ID: {transaction_id}"
      - "Date: {completed_at}"
      - "[View Invoice]" button
    - Attach: PDF invoice (see below)
  - **In-app notification:**
    - Show: toast notification "✓ Credits added! New balance: {new_balance}"
    - Badge: red dot on credits icon (until user clicks)
    - Notification center: "Credits added successfully" entry
  - **SMS notification (optional):**
    - Message: "SmartAIHub: 125 credits added. New balance: 500 credits. Ref: TXN-ABC"
    - Only if: user enabled SMS notifications in settings
  - **Invoice PDF generation:**
    - Library: PDFKit (Node.js)
    - Include:
      - Company logo and address
      - Invoice number: INV-{transaction_id}
      - Date: {completed_at}
      - Bill to: {user_name}, {user_email}
      - Item: "{package_name} - {credits} credits"
      - Amount: {price_thb} THB
      - Bonus: +{bonus_credits} credits (if any)
      - Total: {total_credits} credits
      - Payment method: PromptPay
      - Tax info (if applicable)
    - Store: storage/invoices/{year}/{month}/INV-{transaction_id}.pdf
    - Serve: via authenticated download link

- **US-013-AC27:** Prevent race conditions and duplicate allocations
  - **Scenario: User refreshes page multiple times**
    - Problem: Multiple allocation requests sent
    - Solution: Idempotency key (transaction_id)
    - Check: IF transaction.status == "completed" THEN skip allocation
  - **Scenario: Webhook fires multiple times**
    - Problem: Multiple completion events
    - Solution: Check status before processing
  - **Scenario: Two processes allocate simultaneously**
    - Problem: Credits allocated twice
    - Solution: Database row locking (SELECT FOR UPDATE)
  - **Implementation:**

```javascript
async function allocateCredits(transactionId) {
  const db = await startTransaction();
  try {
    // Lock transaction row
    const txn = await db.query('SELECT * FROM credit_transactions WHERE id = $1 FOR UPDATE', [
      transactionId,
    ]);

    // Idempotency check
    if (txn.status === 'completed') {
      await db.rollback();
      return { success: true, message: 'Already allocated' };
    }

    // Allocate credits
    await db.query('UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2', [
      txn.total_credits,
      txn.user_id,
    ]);

    // Mark complete
    await db.query(
      'UPDATE credit_transactions SET status = $1, completed_at = NOW() WHERE id = $2',
      ['completed', transactionId]
    );

    await db.commit();
    return { success: true };
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
```

**Technical Notes:**

- **Database isolation level:** SERIALIZABLE or REPEATABLE READ
- **Transaction timeout:** 5 seconds max
- **Retry logic:** No retries (idempotent, safe to call again)
- **Email service:** Nodemailer with SMTP
- **Queue:** Use job queue (Bull) for async email sending (don't block credit allocation)

---

### US-013-08: Manual Review Queue (Admin)

**As an** admin or support staff  
**I want to** review flagged transactions manually  
**So that** legitimate payments aren't wrongly rejected due to AI uncertainty

**Priority:** High  
**Estimated Effort:** 8 story points  
**Dependencies:** US-013-03, US-013-04, US-013-05

**Acceptance Criteria:**

- **US-013-AC28:** Auto-flag uncertain transactions for manual review
  - **Flagging triggers:**
    - ANY confidence score < 90% (recipient, amount, authenticity)
    - AI recommendation = "manual_review"
    - Duplicate check uncertain (hash similarity 90-95%)
    - Overpayment > 1000 THB (suspicious)
    - Multiple verification failures
  - **Create review queue entry:**
    - Table: manual_review_queue
    - Fields: transaction_id, flagged_at, flag_reason, priority
  - **Set priority:**
    - High: large amounts (>5000 THB), multiple flags
    - Normal: single low confidence score
    - Low: minor uncertainty
  - **Notification to admin team:**
    - Slack: Post to #payment-review channel
    - Message: "🔍 New payment review needed: TXN-ABC (Reason: Low authenticity score 85%)"
    - Email: Send to support@smartaihub.com
    - Only during: business hours (9 AM - 6 PM Bangkok time)
    - After hours: Queue for next day

- **US-013-AC29:** Admin dashboard displays comprehensive review information
  - **Slip image display:**
    - Show: full resolution image (original upload)
    - Zoom: click to enlarge, pinch-to-zoom on mobile
    - Download: button to download original file
    - Thumbnail: 800px width preview
  - **Extracted data display:**
    - **Section: Recipient**
      - Extracted PromptPay ID: "0812345678"
      - Expected PromptPay ID: "0812345678"
      - Match: ✓ Yes / ✗ No
      - Confidence: 98% (color-coded: green >90, yellow 80-90, red <80)
    - **Section: Amount**
      - Extracted amount: 249.00 THB
      - Expected amount: 199.00 THB
      - Status: ✓ Sufficient (overpaid 50 THB)
      - Confidence: 95%
    - **Section: Authenticity**
      - Logo detected: ✓ SCB
      - Layout matches: ✓ Yes
      - QR code valid: ✓ Yes
      - Timestamp: 2025-01-18 14:23 (5 minutes ago)
      - Overall score: 85% ⚠️
  - **AI reasoning display:**
    - Show: full AI explanation text
    - Example: "The slip appears authentic. Logo is clear and matches SCB branding. QR code validates correctly. However, some text appears slightly blurry which lowered confidence to 85%. Recommend manual verification."
    - Format: markdown rendering with syntax highlighting
  - **Duplicate check results:**
    - Similar slips found: 0 / 1 / Multiple
    - If found: show thumbnail of similar slip with similarity score
    - Original transaction: link to previous transaction (if duplicate)
  - **User information:**
    - Name: {user_name}
    - Email: {user_email}
    - Account created: {created_date}
    - Previous transactions: {count} (show list)
    - Total credits purchased: {total}
    - Rejection history: {count} rejections in last 30 days

- **US-013-AC30:** Admin can make decision with required justification
  - **Action buttons:**
    - **[Approve]** button (green):
      - Confirm: "Are you sure? Credits will be added immediately."
      - Require: reason dropdown + optional notes
      - Reasons: "Verified authentic", "Minor quality issue acceptable", "User provided additional proof"
    - **[Reject]** button (red):
      - Confirm: "User will be notified. This action cannot be undone."
      - Require: reason dropdown + required notes
      - Reasons: "Wrong recipient", "Insufficient amount", "Fake slip", "Duplicate", "Other (explain)"
    - **[Request More Info]** button (yellow):
      - Opens: email template to user
      - Template: "We need a clearer image of your payment slip. Please re-upload..."
      - User can: re-upload slip for same transaction
  - **Recording decision:**
    - Store: admin_id, decision, reason, notes, reviewed_at
    - Update: transaction.status = "approved" | "rejected"
    - Remove: from review queue
    - Audit: log in admin_actions table
  - **Post-decision actions:**
    - **If Approved:**
      - Execute: credit allocation (same as auto-approval)
      - Send: notification to user (success)
      - Log: "Manual approval by Admin John"
    - **If Rejected:**
      - Send: email to user with rejection reason
      - Log: "Manual rejection by Admin John: {reason}"
      - Block: cannot reuse same transaction ID
    - **If Request Info:**
      - Send: email with request
      - Keep: in review queue (lower priority)
      - Allow: user to re-upload

- **US-013-AC31:** System learns from manual reviews to improve AI
  - **Track metrics:**
    - Manual approval rate: approvals / (approvals + rejections)
    - False positive rate: auto-rejected but manually approved
    - False negative rate: auto-approved but should reject (rare)
  - **Identify patterns:**
    - Which banks: have most low-confidence results?
    - Which amounts: are most problematic?
    - Which users: get flagged repeatedly?
  - **Reporting:**
    - Weekly: email to product team
    - Metrics: approval rate, avg confidence scores, top flag reasons
    - Suggestions: "Lower Kbank logo confidence threshold to 85%"
  - **Threshold adjustments:**
    - If: false positive rate > 5% for specific check
    - Then: consider lowering confidence threshold
    - Example: If many authentic SCB slips score 85% (just below 90% threshold)
    - Action: Lower SCB authenticity threshold to 80%
  - **Future ML training:**
    - Collect: manually reviewed slips with labels (authentic/fake)
    - Use: to fine-tune AI model (Phase 2)
    - Goal: Reduce manual review rate from 10% to 5%

**Technical Notes:**

- **Admin panel:**
  - Route: /admin/payment-review
  - Auth: require admin role (RBAC)
  - Framework: React Admin or custom dashboard
- **Real-time updates:**
  - WebSocket: notify admins of new flags instantly
  - Polling: fallback if WebSocket unavailable (every 30 seconds)
- **SLA tracking:**
  - Store: flagged_at, reviewed_at
  - Calculate: review_duration = reviewed_at - flagged_at
  - Alert: if any item > 2 hours unreviewed during business hours
- **Batch actions:**
  - Allow: admin to select multiple similar items and approve/reject all
  - Use case: Same user uploads 3 slips for 3 transactions, all same issue

**Database Schema:**

```sql
CREATE TABLE manual_review_queue (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES credit_transactions(id),
  flagged_at TIMESTAMP DEFAULT NOW(),
  flag_reason TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal', -- high, normal, low
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  decision VARCHAR(20), -- approve, reject, request_info
  decision_reason TEXT,
  decision_notes TEXT
);

CREATE INDEX idx_review_queue_status ON manual_review_queue(reviewed_at) WHERE reviewed_at IS NULL;
```

---

## Business Rules

### BR-001: Payment Amount Constraints

- **Minimum payment:** 100 THB (prevent micro-transactions, reduce processing costs)
- **Maximum payment:** 50,000 THB per transaction (fraud prevention, AML compliance)
- **Overpayment handling:**
  - If overpayment < 10 THB: Ignore (accounting rounding, no bonus)
  - If overpayment >= 10 THB: Convert to bonus credits at package rate
  - Example: Package 100 credits for 199 THB (1.996 THB/credit). Overpaid 50 THB = 25 bonus credits.
- **Underpayment:** Any amount below expected is rejected (no partial payments)

### BR-002: Transaction Lifecycle and Expiration

- **Payment window:** 30 minutes from transaction initiation
  - User must: initiate payment within 30 minutes
  - After 30 min: QR code expires, must create new transaction
- **Slip upload window:** 24 hours from payment
  - User can: upload slip anytime within 24 hours after payment
  - Allows: users who pay but forget to upload immediately
- **Auto-expiration:** 24 hours after creation if no slip uploaded
  - Status: changes to "expired"
  - Action: no credits allocated
  - User: must create new transaction
- **Expired transaction cleanup:** 7 days after expiration
  - Action: soft delete (mark deleted_at, keep for audit)
  - Reason: free up database, maintain performance

### BR-003: AI Verification Confidence Thresholds

- **Overall confidence scoring:**
  - Formula: (recipient_conf + amount_conf + authenticity_score) / 3
  - Weighted: authenticity_score × 1.5 (most important)
  - Example: (95 + 90 + 85×1.5) / 3.5 = 91.4%
- **Decision thresholds:**
  - **Auto-approve:** overall >= 95% AND all individual >= 90%
  - **Manual review:** overall 80-94% OR any individual 80-89%
  - **Auto-reject:** overall < 80% OR any critical individual < 75%
- **Component thresholds:**
  - Recipient confidence: >= 90% (critical: wrong recipient = wrong company)
  - Amount confidence: >= 85% (important: but can verify manually easily)
  - Authenticity score: >= 95% (critical: fake slip = fraud)

### BR-004: Duplicate Slip Prevention

- **Image hash similarity threshold:** 95%
  - Calculation: 1 - (hamming_distance / 64)
  - Allows: minor crops, resizes, compression (5% tolerance)
  - Prevents: exact duplicates (same image)
- **Hash retention period:** 90 days
  - Reason: balance fraud prevention vs storage costs
  - Assumption: unlikely user keeps slip > 90 days
- **Suspicious pattern flagging:**
  - Same user + same amount + within 1 hour: flag for review
  - Different users + same slip: reject second user, alert security team
  - Same user + 3+ rejected slips in 24 hours: block user, require manual unblock

### BR-005: Slip Storage and Auto-Cleanup (Local Phase 1)

- **Storage location:** `storage/slips/{year}/{month}/`
  - Example: `storage/slips/2025/01/TXN-20250118-A7K9M_1705564800.jpg`
  - Organized by: year and month for easier management
- **File naming convention:** `{transaction_id}_{unix_timestamp}.{ext}`
  - transaction_id: ensures uniqueness
  - unix_timestamp: prevents filename collision if user re-uploads
  - ext: preserves original format (jpg, png, pdf)
- **File permissions:** 600 (owner read/write only)
  - Security: prevents unauthorized access via web server
  - Serve: only through authenticated API endpoint
- **Auto-delete policy:** Slips older than 30 days
  - Reason: compliance, privacy, storage management
  - Exception: Keep if transaction has dispute_open flag
  - Exception: Keep if transaction is under investigation
- **Cleanup schedule:** Daily at 2:00 AM server time (Bangkok UTC+7)
  - Cron: `0 2 * * * node scripts/cleanup-old-slips.js`
  - Process:
    1. Find: slips with created_at < NOW() - 30 days
    2. Check: transaction.dispute_open == false
    3. Delete: file from disk
    4. Log: deleted file path and count
    5. Update: transaction.slip_deleted_at = NOW()
- **Cleanup logging:**
  - Log to: storage/logs/slip-cleanup.log
  - Format: `[2025-01-18 02:00:05] Deleted 127 slips older than 30 days`
  - Alert: if deletion fails or count unusually high (>1000)
- **Thumbnail retention:** Delete thumbnails with original
  - Thumbnails: stored in `storage/slips/thumbnails/{transaction_id}.jpg`
  - Auto-delete: when original is deleted

### BR-006: Manual Review Service Level Agreement (SLA)

- **Business hours:** 9:00 AM - 6:00 PM Bangkok time (UTC+7)
- **SLA during business hours:** 2 hours maximum
  - Priority: high transactions reviewed within 1 hour
  - Priority: normal transactions within 2 hours
  - Priority: low transactions within 4 hours
- **SLA after business hours:** Next business day
  - Flagged after 6 PM: reviewed by 11 AM next day
  - Flagged on weekend: reviewed by 11 AM Monday
- **Public holidays:** Next business day (follow Thai calendar)
- **Notification to users:**
  - In-app: "Your payment is being reviewed. Expected within 2 hours."
  - Email: "We're reviewing your payment slip. You'll hear from us soon!"
- **Escalation:** If > 2 hours unreviewed, alert admin manager

---

## Non-Functional Requirements

### Performance Requirements

#### NFR-001: Response Time Targets (95th percentile)

- **Initiate purchase:** < 1 second
  - Includes: package lookup, transaction creation, QR generation
- **Generate PromptPay QR:** < 2 seconds
  - QR encoding + image rendering
- **Upload slip:** < 5 seconds
  - Upload time + file validation + storage
  - Assumes: 2-5 MB file, 10 Mbps connection
- **AI verification (complete flow):** < 30 seconds
  - OCR extraction: ~10 seconds
  - All checks (recipient + amount + authenticity): ~15 seconds
  - Duplicate check: ~2 seconds
  - Decision + logging: ~3 seconds
- **Credit allocation:** < 2 seconds
  - Database transaction + notifications
- **Manual review load:** < 3 seconds
  - Dashboard page load with slip image

#### NFR-002: Scalability Targets

- **Concurrent users:** Support 1,000 simultaneous active users
  - Active: users on payment/upload page
- **Daily verification volume:** Handle 10,000 verifications per day
  - Peak: 500 per hour (during lunch time 12-1 PM)
  - Average: 400 per hour (business hours)
- **Queue depth:** Maximum 100 pending verifications
  - If > 100: alert admin, scale workers
- **Storage projection:** 100 GB per year
  - Calculation: 10,000 slips/day × 365 days × 3 MB avg = ~110 GB
  - Plan for: 200 GB storage (includes logs, backups)

#### NFR-003: Availability and Uptime

- **Target uptime:** 99.5% (excluding planned maintenance)
  - Allowed downtime: 3.65 hours per month
- **Planned maintenance window:**
  - Schedule: Sunday 2:00 AM - 4:00 AM Bangkok time
  - Frequency: Monthly (first Sunday of month)
  - Duration: Max 2 hours
- **Failover strategy:**
  - If AI API down: Auto-route to manual review queue
  - If database down: Queue operations in Redis, process when DB recovers
  - If storage down: Queue uploads, process when storage available

### Security Requirements

#### NFR-004: Data Protection (Local Storage - Phase 1)

- **Slip storage security:**
  - **Location:** Outside web root directory
    - Path: `/var/app/storage/slips/` (NOT `/var/www/public/`)
    - Prevents: direct URL access
  - **File permissions:** 600 (rw-------)
    - Owner: application user only
    - Others: no access
  - **Serving method:** Authenticated API endpoint only
    - Endpoint: `GET /api/credits/slips/{transaction_id}/download`
    - Auth: Require valid JWT token + user owns transaction
    - Headers: `Content-Disposition: attachment`
- **PII protection in logs:**
  - Hash: phone numbers, citizen IDs
  - Example: Log "08123...78" instead of "0812345678"
  - Never log: full PromptPay IDs in plain text
- **Encryption at rest (Phase 2):**
  - Phase 1: Rely on file system permissions
  - Phase 2: Implement AES-256 encryption for slip files

#### NFR-005: Rate Limiting and Abuse Prevention

- **Purchase initiation:** 5 requests per hour per user
  - Prevents: spam transaction creation
  - Response if exceeded: HTTP 429 "Too many requests. Try again in X minutes."
- **Slip upload:** 3 uploads per transaction
  - Allows: user to fix wrong upload
  - After 3: block uploads, require support contact
- **Verification requests:** 10 per day per user
  - Includes: status polling
  - Polling interval: maximum once per 3 seconds
- **Admin review actions:** No limit
  - Admins: trusted, no rate limiting
- **IP-based rate limiting:**
  - Global: 100 requests per minute per IP
  - Prevents: DDoS, scraping

#### NFR-006: Fraud Detection and Prevention

- **Monitoring triggers:**
  - User with 3+ rejected slips in 24 hours: flag account
  - Same slip uploaded by different users: alert security team
  - Overpayment > 5000 THB: flag for review
  - Multiple transactions from same IP: monitor for patterns
- **Automated actions:**
  - 5+ rejected slips: Auto-block account, require manual unblock
  - Fake slip detected with >95% confidence: Block user for 24 hours
- **Suspicious IP detection:**
  - VPN/Tor exit nodes: Flag (don't block, as some users legitimately use VPNs)
  - Data center IPs: Flag (possible bots)
  - Residential proxies: Monitor
- **Alert channels:**
  - Slack: #security-alerts channel
  - Email: security@smartaihub.com
  - Dashboard: fraud monitoring page

### Monitoring and Observability

#### NFR-007: Metrics and KPIs

- **Track continuously:**
  - **Verification success rate:** (approved + manual_approved) / total
    - Target: > 95%
    - Alert if: < 90%
  - **Average verification time:** Mean time from upload to decision
    - Target: < 20 seconds
    - Alert if: > 30 seconds (95th percentile)
  - **Manual review rate:** flagged / total
    - Target: < 10%
    - Alert if: > 15%
  - **Duplicate detection rate:** duplicates_blocked / total_uploads
    - Expected: 0.5-2% (some users try to reuse)
  - **AI cost per verification:** API_cost / verifications
    - Track: OpenAI API tokens used
    - Budget: < 2 THB per verification
- **Business metrics:**
  - Daily revenue: sum(price_thb) for completed transactions
  - Conversion rate: completed / initiated
  - Average transaction value: mean(price_thb)
  - Credits sold per day: sum(credits)

#### NFR-008: Alerting and Incident Response

- **Critical alerts (immediate notification):**
  - Verification success rate drops below 90%
  - Queue depth exceeds 50 pending verifications
  - AI API error rate > 10%
  - Database connection failures
  - Storage disk usage > 90%
- **Warning alerts (notify within 1 hour):**
  - Verification time > 60 seconds (95th percentile)
  - Manual review rate > 15%
  - Duplicate detection failures
  - Unusual spike in transactions (potential fraud)
- **Notification channels:**
  - Critical: PagerDuty (SMS + phone call to on-call engineer)
  - Warning: Slack #alerts channel
  - Daily: Email digest to team

---

## Technical Implementation Notes

### Tech Stack

**Backend:**

- **Framework:** NestJS (Node.js/TypeScript)
  - Reason: Modern, TypeScript, good for async processing
- **Database:**
  - Primary: PostgreSQL 15+ (transactions, users, credits)
  - Cache: Redis 7+ (rate limiting, queue, session)
- **File Storage:** Local filesystem (Phase 1)
  - Path: `/var/app/storage/slips/`
  - Phase 2: Migrate to AWS S3 or DigitalOcean Spaces
- **Queue:** Bull (Redis-based job queue)
  - Use for: async verification processing, email sending
- **Scheduler:** node-cron
  - Use for: auto-cleanup, daily reports

**AI/ML:**

- **Primary:** OpenAI GPT-4 Vision API
  - Model: gpt-4-vision-preview
  - Use for: slip OCR, authenticity analysis
- **Fallback:** Anthropic Claude 3.5 Sonnet
  - Model: claude-3-5-sonnet-20241022
  - Switch if: OpenAI API down or cost optimization
- **Image Processing:** Sharp (Node.js)
  - Use for: resize, compress, thumbnail generation
- **QR Code:**
  - Generator: promptpay-qr (npm)
  - Decoder: jsQR (browser/Node.js)

**Frontend:**

- **Framework:** React 18+ with TypeScript
- **File Upload:** react-dropzone
  - Drag-drop, click, paste support
- **QR Display:** qrcode.react
- **State Management:** Zustand or Redux Toolkit
- **HTTP Client:** Axios with interceptors

**DevOps:**

- **Hosting:** DigitalOcean Droplet or AWS EC2
- **Database:** DigitalOcean Managed PostgreSQL
- **Monitoring:** Grafana + Prometheus
- **Logging:** Winston (Node.js) → Elasticsearch → Kibana (optional)
- **Deployment:** GitHub Actions CI/CD

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/smartaihub
REDIS_URL=redis://localhost:6379

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_TIMEOUT_SECONDS=30

# PromptPay
COMPANY_PROMPTPAY_ID=0812345678
PROMPTPAY_DISPLAY_NAME=Smart AI Hub Co Ltd

# Storage
STORAGE_PATH=/var/app/storage
SLIP_RETENTION_DAYS=30

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@smartaihub.com
SMTP_PASS=...

# Security
JWT_SECRET=...
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=5

# Features
MANUAL_REVIEW_ENABLED=true
AUTO_APPROVE_THRESHOLD=95
MANUAL_REVIEW_THRESHOLD=80
```

---

## Testing Strategy

### Test Coverage Targets

- **Unit tests:** > 80% code coverage
- **Integration tests:** All API endpoints
- **E2E tests:** Critical user flows
- **Load tests:** 1000 concurrent users

### Test Scenarios (Summary)

See detailed test cases in: `test-cases.md`

**Critical paths:**

- TC-001: Valid slip → auto-approve
- TC-002: Wrong recipient → reject
- TC-003: Insufficient amount → reject
- TC-004: Duplicate slip → reject
- TC-005: Fake slip → reject or manual review
- TC-006: Overpayment → approve with bonus
- TC-007: Expired transaction → reject
- TC-008: Low confidence → manual review
- TC-009: Manual review approve → credits added
- TC-010: Manual review reject → user notified

---

## Success Metrics (3 Months Post-Launch)

### Week 1 (Internal Beta)

- ✅ Zero critical bugs
- ✅ Verification accuracy > 90%
- ✅ Internal team feedback > 4/5

### Month 1

- ✅ 500+ successful transactions
- ✅ Verification accuracy > 95%
- ✅ Manual review rate < 10%
- ✅ False rejection rate < 1%
- ✅ Average verification time < 20 seconds

### Month 3

- ✅ 5,000+ successful transactions
- ✅ Verification accuracy > 96%
- ✅ Manual review rate < 8%
- ✅ User satisfaction > 4.5/5
- ✅ Feature adoption > 60% of active users
- ✅ Support tickets reduced by 80%

---

## Dependencies

### Internal Dependencies

- **FEAT-002: Credit System** (CRITICAL)
  - Must exist: credit_balance field in users table
  - Must exist: credit deduction/allocation functions
  - Must exist: credit transaction history
- **FEAT-001: User Management** (CRITICAL)
  - Must exist: user authentication (JWT)
  - Must exist: user roles (admin role for review queue)

### External Dependencies

- **OpenAI GPT-4 Vision API**
  - Access: API key required
  - Cost: ~$0.01-0.03 per image
  - Limit: Check rate limits, may need paid plan
- **Anthropic Claude API** (backup)
  - Access: API key required
  - Cost: Similar to OpenAI
- **PromptPay QR Library**
  - NPM: promptpay-qr
  - Standard: EMVCo
- **Company PromptPay Account**
  - Must have: active PromptPay account (phone or citizen ID)
  - Must have: account in company name
  - Must configure: in environment variables

---

## Risks and Mitigation

### Risk 1: Low AI Verification Accuracy

- **Impact:** High false rejections → user frustration, lost sales
- **Probability:** Medium (30-40%)
- **Mitigation:**
  - Extensive testing with 100+ real slip samples before launch
  - Manual review queue as safety net
  - Continuous monitoring and threshold tuning
  - Collect feedback and improve prompts
  - Consider fine-tuning model with labeled data (Phase 2)

### Risk 2: AI API Downtime or High Latency

- **Impact:** Cannot verify slips, users stuck waiting
- **Probability:** Low (5-10% uptime issues)
- **Mitigation:**
  - Use multiple providers (OpenAI + Anthropic)
  - Auto-fallback if primary API down
  - Queue requests, retry with exponential backoff
  - Manual review queue as ultimate fallback
  - Status page showing AI API health

### Risk 3: Sophisticated Fraud Attacks

- **Impact:** Financial loss from fake slips
- **Probability:** Medium (20-30% of users may attempt)
- **Mitigation:**
  - Multiple verification layers (recipient + amount + authenticity + duplicate)
  - QR code validation (hardest to fake)
  - Manual review for suspicious patterns
  - Rate limiting prevents mass attempts
  - Fraud monitoring dashboard
  - Block repeat offenders

### Risk 4: Privacy and Compliance Concerns

- **Impact:** Legal issues, user trust loss
- **Probability:** Low (10%)
- **Mitigation:**
  - Encrypt slips at rest (Phase 2)
  - Auto-delete after 30 days (PDPA compliance)
  - Hash PII in logs
  - Clear privacy policy and consent
  - Regular security audits

### Risk 5: Storage Costs Grow Too High

- **Impact:** High costs for storing millions of slips
- **Probability:** Medium (if we scale fast)
- **Mitigation:**
  - Auto-delete policy (30 days)
  - Compress images before storage
  - Migrate to cloud storage (S3) for cheaper archival (Phase 2)
  - Consider aggressive compression for old slips

---

## Future Enhancements (Out of Scope - Phase 2+)

### Phase 2: Real-time Bank API Integration

- Integrate with: PromptPay Gateway API (if available)
- No slip upload: Verify payments automatically via API
- Instant crediting: Credits added within seconds of payment
- Benefit: Better UX, no manual upload needed

### Phase 3: Multiple Payment Methods

- Credit card: Stripe, Omise
- Mobile banking: SCB Easy, Kbank Next
- International: PayPal, Wise

### Phase 4: Automated Refund Processing

- Self-service refunds: for rejected transactions
- Partial refunds: if overpaid significantly
- Refund timeline: 3-5 business days

### Phase 5: Machine Learning Model Training

- Collect: manually reviewed slips (labeled authentic/fake)
- Train: custom slip verification model
- Goal: 99% accuracy, reduce to < 5% manual review
- Cost: Lower than API calls long-term

### Phase 6: Blockchain Receipt Verification

- Issue: NFT receipt for each transaction
- Benefit: Immutable proof of payment
- Use case: Tax compliance, disputes

---

## Glossary

- **PromptPay:** Thailand's national instant payment system allowing transfers using mobile phone numbers or citizen IDs
- **Payment Slip:** Screenshot or photo of bank transfer confirmation showing payment details
- **QR Code:** Quick Response code, 2D barcode containing payment information in EMVCo format
- **Perceptual Hash (pHash):** Algorithm generating similar hashes for visually similar images, used for duplicate detection
- **EMVCo:** Global payment standard organization that defines PromptPay QR code format
- **OCR (Optical Character Recognition):** AI technology to extract text from images
- **LLM (Large Language Model):** AI models like GPT-4, Claude used for intelligent text/image analysis
- **Hamming Distance:** Number of differing bits between two binary strings, used to measure hash similarity
- **PDPA:** Personal Data Protection Act - Thailand's data privacy law
- **SLA (Service Level Agreement):** Commitment to specific service performance (e.g., 2-hour review time)

---

## Appendix

### A. Sample PromptPay QR Code Format

EMVCo Standard Payload:

```
00020101021129370016A000000677010111011300669812345678530376454041000.005802TH5913Smart AI Hub6304XXXX
```

Breakdown:

- `0002`: Payload format indicator
- `01`: Point of initiation method
- `29`: Merchant account (PromptPay)
  - `0016A000000677010111`: PromptPay identifier
  - `0113006698123456785`: PromptPay ID (phone: +66812345678)
- `5303764`: Currency (764 = THB)
- `5404199.00`: Amount (199.00 THB)
- `5802TH`: Country (Thailand)
- `5913Smart AI Hub`: Merchant name
- `6304XXXX`: CRC checksum

### B. Supported Thai Banks

| Bank                 | Code  | Logo Color | Slip Format ID |
| -------------------- | ----- | ---------- | -------------- |
| Siam Commercial Bank | SCB   | Purple     | scb-v2         |
| Kasikornbank         | KBANK | Green      | kbank-v3       |
| Bangkok Bank         | BBL   | Blue       | bbl-v2         |
| Krung Thai Bank      | KTB   | Light Blue | ktb-v1         |
| TMB Thanachart       | TMB   | Orange     | tmb-v2         |
| Bank of Ayudhya      | BAY   | Yellow     | bay-v2         |
| CIMB Thai            | CIMB  | Red        | cimb-v1        |
| United Overseas Bank | UOB   | Blue       | uob-v1         |

### C. Example API Error Codes

| Code     | Message                   | HTTP Status | User Action              |
| -------- | ------------------------- | ----------- | ------------------------ |
| SLIP_001 | File too large (max 10MB) | 400         | Compress or crop image   |
| SLIP_002 | Invalid file format       | 400         | Upload JPG, PNG, or PDF  |
| SLIP_003 | File corrupted            | 400         | Re-screenshot slip       |
| SLIP_004 | Wrong recipient           | 400         | Verify PromptPay ID      |
| SLIP_005 | Insufficient amount       | 400         | Pay correct amount       |
| SLIP_006 | Duplicate slip            | 409         | Cannot reuse slip        |
| SLIP_007 | Transaction expired       | 410         | Create new transaction   |
| SLIP_008 | Fake slip detected        | 400         | Upload authentic slip    |
| SLIP_009 | QR code invalid           | 400         | Ensure slip has valid QR |
| SLIP_010 | Cannot extract data       | 400         | Upload clearer image     |
| SLIP_011 | Slip too old (>24h)       | 400         | Upload recent slip       |
| SLIP_012 | Rate limit exceeded       | 429         | Wait before trying again |

### D. Manual Review Dashboard Mockup

```
╔═══════════════════════════════════════════════════════════════════╗
║ Payment Review Queue                                 [Refresh]    ║
╠═══════════════════════════════════════════════════════════════════╣
║ Pending: 3 | In Progress: 1 | Completed Today: 15                ║
╠═══════════════════════════════════════════════════════════════════╣
║ [All] [High Priority] [Normal] [Low]                              ║
╠═══════════════════════════════════════════════════════════════════╣
║ 🔴 TXN-20250118-A7K9M | user@email.com | 249 THB | 5 min ago     ║
║    Flag: Low authenticity (85%) | Amount: OK | Recipient: OK     ║
║    [View Details]                                                  ║
╟───────────────────────────────────────────────────────────────────╢
║ 🟡 TXN-20250118-B2C3D | user2@email.com | 499 THB | 1 hour ago   ║
║    Flag: Blurry amount (82%) | Authenticity: OK | Recipient: OK  ║
║    [View Details]                                                  ║
╚═══════════════════════════════════════════════════════════════════╝
```

Detail View:

```
╔═══════════════════════════════════════════════════════════════════╗
║ Review: TXN-20250118-A7K9M                          [Back to Queue]║
╠═══════════════════════════════════════════════════════════════════╣
║ User: john@example.com | Created: 2025-01-18 14:23:45            ║
║ Package: 100 credits (199 THB) | Paid: 249 THB (overpaid 50 THB)║
╠═══════════════════════════════════════════════════════════════════╣
║ Payment Slip:                    ║ Verification Results:          ║
║ [Image 800x1200px]               ║                                ║
║ [Download Original] [Zoom]       ║ ✅ Recipient: 98% confidence   ║
║                                  ║    Extracted: 0812345678       ║
║                                  ║    Expected: 0812345678        ║
║                                  ║                                ║
║                                  ║ ✅ Amount: 95% confidence      ║
║                                  ║    Extracted: 249.00 THB       ║
║                                  ║    Expected: 199.00 THB        ║
║                                  ║    Overpaid: 50 THB → +25 ₡    ║
║                                  ║                                ║
║                                  ║ ⚠️  Authenticity: 85%          ║
║                                  ║    Logo: ✓ SCB detected        ║
║                                  ║    QR Code: ✓ Valid            ║
║                                  ║    Timestamp: ✓ 5 min ago      ║
║                                  ║    Issue: Slight blur detected ║
║                                  ║                                ║
║                                  ║ ✅ Duplicate: No match         ║
╠══════════════════════════════════╩════════════════════════════════╣
║ AI Reasoning:                                                     ║
║ "The slip appears authentic. Logo is clear and matches SCB        ║
║  branding. QR code validates correctly and matches printed        ║
║  details. However, some text in the amount section appears        ║
║  slightly blurry which lowered confidence to 85%. Likely due      ║
║  to image compression. Recommend manual verification."            ║
╠═══════════════════════════════════════════════════════════════════╣
║ Decision:                                                          ║
║ [✓ Approve] [✗ Reject] [? Request More Info]                     ║
║ Reason: [Dropdown]                                                ║
║ Notes: [Text area]                                                ║
║ [Submit Decision]                                                  ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

**Document Control:**

- **Version:** 1.0.0
- **Status:** Draft (ready for review)
- **Last Updated:** 2025-01-18
- **Next Review:** 2025-02-18
- **Approvers:** Product Manager, Tech Lead, Security Officer

**Change Log:**

- 2025-01-18: Initial draft created
