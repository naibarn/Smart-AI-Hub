# FR-1: Multi-method Authentication

## Priority
P0 (Critical)

## Requirements
- Google OAuth 2.0 integration
- Email/password with BCRYPT (cost factor: 12)
- Email verification (6-digit OTP, 15-min expiry)
- Password reset with secure token
- JWT token-based sessions (access: 15min, refresh: 7 days)
- MFA support (TOTP) - Phase 2

## Acceptance Criteria
- Registration completion rate > 70%
- Login success rate > 99%
- Email verification within 5 minutes
- Password reset flow < 3 minutes