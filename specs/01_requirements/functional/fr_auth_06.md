# FR-AUTH-06: OAuth with Verification Codes

## Priority
High

## Description
Support OAuth flow with verification codes for Custom GPT integration

## Requirements
- Accept session parameter in OAuth initiation URL
- Generate verification code on successful authentication
- Display verification code on success page
- Map verification code to user session
- Support "return_to" parameter for different integration types
- Maintain backward compatibility with traditional OAuth flow

## Flow
1. Third-party service generates unique session ID
2. User is redirected to /auth/google?session={id}&return_to=chatgpt
3. User authenticates with Google
4. System generates verification code (VERIFIED-{random})
5. Success page displays verification code with copy button
6. User copies code and provides to third-party service
7. Third-party service uses code as session token

## Acceptance Criteria
- Verification codes are unique and secure
- Success page is user-friendly with Thai language
- Copy button works on all major browsers
- Session mapping is created correctly
- Traditional OAuth flow still works