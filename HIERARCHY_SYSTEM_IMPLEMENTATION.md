# Multi-Tier User Hierarchy and Referral System Implementation

## Overview

This document describes the implementation of a comprehensive multi-tier user hierarchy and referral system for Smart AI Hub. The system implements a 5-tier hierarchy with strict visibility rules, transfer capabilities, referral functionality, and block/unblock features.

## System Architecture

### User Tiers

The system implements the following 5-tier hierarchy:

1. **Administrator** - Highest tier, can see all users
2. **Agency** - Can see organizations, admins, and generals under them
3. **Organization** - Can see admins and generals in their organization
4. **Admin** - Can see generals in the same organization
5. **General** - Can only see themselves

### Visibility Rules

The visibility system is security-critical and prevents data leaks:

- **Administrator**: Can see all users in the system
- **Agency**: Can see organizations, admins, and generals directly under them
- **Organization**: Can see admins and generals in their organization only
- **Admin**: Can see generals in the same organization only
- **General**: Can only see their own profile

## Database Schema Changes

### Core Service Schema Updates

#### User Model Enhancements
```sql
-- New fields added to users table
ALTER TABLE users ADD COLUMN tier VARCHAR(20) NOT NULL DEFAULT 'general';
ALTER TABLE users ADD COLUMN parent_agency_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN parent_organization_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN invite_code VARCHAR(8) UNIQUE;
ALTER TABLE users ADD COLUMN invited_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN invite_code_used VARCHAR(8);
```

#### New Models

1. **Transfer Model**
```sql
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(10) NOT NULL, -- 'points' or 'credits'
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

2. **ReferralReward Model**
```sql
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referee_id UUID NOT NULL REFERENCES users(id),
  referrer_tier VARCHAR(20) NOT NULL,
  referee_tier VARCHAR(20) NOT NULL,
  referrer_reward_points INTEGER NOT NULL,
  referee_reward_points INTEGER NOT NULL,
  agency_bonus_points INTEGER DEFAULT 0,
  agency_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

3. **AgencyReferralConfig Model**
```sql
CREATE TABLE agency_referral_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES users(id),
  organization_reward_points INTEGER NOT NULL DEFAULT 1000,
  admin_reward_points INTEGER NOT NULL DEFAULT 500,
  general_reward_points INTEGER NOT NULL DEFAULT 200,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

4. **BlockLog Model**
```sql
CREATE TABLE block_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id),
  blocked_id UUID NOT NULL REFERENCES users(id),
  blocker_tier VARCHAR(20) NOT NULL,
  blocked_tier VARCHAR(20) NOT NULL,
  block_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  unblocked_at TIMESTAMP
);
```

## API Endpoints

### Transfer System
- `POST /api/v1/transfer/points` - Transfer points to another user
- `POST /api/v1/transfer/credits` - Transfer credits to another user
- `GET /api/v1/transfer/history` - View transfer history
- `GET /api/v1/transfer/validate` - Check if transfer is allowed

### Referral System
- `GET /api/v1/referral/invite-link` - Get invite link and QR code
- `GET /api/v1/referral/stats` - Get referral statistics
- `POST /api/v1/referral/register` - Register with invite code
- `GET /api/v1/referral/rewards` - Get referral rewards history

### Block System
- `POST /api/v1/block/block` - Block a user
- `POST /api/v1/block/unblock` - Unblock a user
- `GET /api/v1/block/blocked` - Get list of blocked users
- `GET /api/v1/block/check/:targetUserId` - Check if blocked by target user

### Hierarchy System
- `GET /api/v1/hierarchy/members` - Get hierarchy members with visibility filters
- `GET /api/v1/hierarchy/stats` - Get hierarchy statistics
- `GET /api/v1/hierarchy/users/:userId` - Get user details with visibility checks
- `GET /api/v1/hierarchy/tree` - Get hierarchy tree structure

## Security Features

### Visibility Check Middleware

The `visibilityCheckRaw.ts` middleware is the most critical security component:

```typescript
export async function checkUserVisibility(
  currentUserId: string,
  targetUserId: string
): Promise<boolean>
```

This function enforces strict visibility rules based on user hierarchy and prevents unauthorized data access.

### Rate Limiting

Custom rate limiters are implemented for different operations:

- **Transfer operations**: 10 transfers per minute for regular users
- **Referral registration**: 3 registrations per minute for guests
- **Block operations**: 5 blocks per minute for regular users
- **Hierarchy operations**: 30 requests per minute for regular users

### Data Sanitization

The `sanitizeUserData` function removes sensitive information based on viewer's tier:

- **Administrator**: Can see all user data
- **Agency**: Can see limited information about users under them
- **Organization**: Can see basic info about their members
- **Admin**: Can see very limited information
- **General**: Can only see their own data

## Implementation Files

### Controllers
- `packages/core-service/src/controllers/transfer.controller.ts`
- `packages/core-service/src/controllers/referral.controller.ts`
- `packages/core-service/src/controllers/block.controller.ts`
- `packages/core-service/src/controllers/hierarchy.controller.ts`

### Routes
- `packages/core-service/src/routes/transfer.routes.ts`
- `packages/core-service/src/routes/referral.routes.ts`
- `packages/core-service/src/routes/block.routes.ts`
- `packages/core-service/src/routes/hierarchy.routes.ts`

### Middleware
- `packages/core-service/src/middleware/visibilityCheckRaw.ts` - Critical security component

### Utilities
- `packages/core-service/src/utils/referralUtils.ts`

### Database Migrations
- `packages/core-service/prisma/migrations/20250116000000_add_user_hierarchy_system/`
- `packages/auth-service/prisma/migrations/20250116000000_add_user_hierarchy_system/`

## Referral Reward System

### Reward Calculation

Rewards are calculated based on referrer and referee tiers:

| Referrer Tier | Referee Tier | Referrer Reward | Referee Reward | Agency Bonus |
|---------------|--------------|-----------------|----------------|--------------|
| Administrator | Any | 1000 | 500-1000 | 0 |
| Agency | Organization | 500 | 300 | 200 |
| Agency | Admin | 500 | 150 | 200 |
| Agency | General | 500 | 100 | 200 |
| Organization | Admin | 300 | 150 | 0 |
| Organization | General | 300 | 100 | 0 |
| Admin | General | 200 | 100 | 0 |
| General | - | Not allowed | - | 0 |

### Invite Code System

- 8-character unique codes generated using `randomBytes(6)`
- Case-insensitive storage and validation
- Automatic generation on first request
- QR code generation for easy sharing

## Transfer System

### Transfer Rules

1. **Visibility Check**: Users can only transfer to users they can see
2. **Hierarchy Rules**: Higher tier users can transfer to lower tier users
3. **Rate Limiting**: Prevents abuse with custom rate limiters
4. **Transaction Safety**: All transfers use database transactions
5. **Validation**: Comprehensive validation before processing

### Transfer Types

- **Points Transfer**: Transfer loyalty points between users
- **Credits Transfer**: Transfer monetary credits between users

## Block System

### Block Rules

1. **Hierarchy Enforcement**: Users can only block users of lower tier
2. **Visibility Check**: Can only block users within visibility scope
3. **Rate Limiting**: Prevents mass blocking
4. **Audit Trail**: Complete log of block/unblock actions

### Block Effects

- Blocked users cannot initiate transfers to blocker
- Blocked users are hidden from member lists
- Block status is checked in all user interactions

## Testing Considerations

### Security Tests

1. **Visibility Bypass Attempts**: Test that users cannot access data outside their hierarchy
2. **Transfer Authorization**: Test that transfers respect hierarchy rules
3. **Rate Limiting**: Test that rate limits prevent abuse
4. **Data Sanitization**: Test that sensitive data is properly filtered

### Functional Tests

1. **Referral Flow**: Complete referral registration and reward distribution
2. **Transfer Flow**: Point and credit transfers with validation
3. **Block Flow**: Block/unblock operations with proper restrictions
4. **Hierarchy Navigation**: Tree structure and member list visibility

## Deployment Notes

### Database Migration

Run migrations in order:
1. Core service migration
2. Auth service migration
3. Verify schema consistency

### Environment Variables

Required environment variables:
- `INVITE_BASE_URL`: Base URL for invite links
- Database connection strings for both services
- Redis configuration for rate limiting

### Monitoring

Monitor these metrics:
- Transfer success/failure rates
- Referral conversion rates
- Block operation frequency
- Visibility check failures (security alerts)

## Future Enhancements

### Planned Features

1. **Advanced Analytics**: Detailed hierarchy performance metrics
2. **Automated Tier Promotion**: Rules-based tier advancement
3. **Enhanced Referral Tracking**: Multi-level referral commissions
4. **Transfer Limits**: Configurable limits based on tier
5. **Audit Logs**: Comprehensive audit trail for all operations

### Security Improvements

1. **Multi-factor Authentication**: For sensitive operations
2. **IP-based Restrictions**: Additional security layer
3. **Anomaly Detection**: AI-powered suspicious activity detection
4. **Data Encryption**: End-to-end encryption for sensitive data

## Conclusion

This implementation provides a robust, secure, and scalable multi-tier user hierarchy system with comprehensive referral, transfer, and blocking capabilities. The security-first approach ensures data privacy while maintaining system usability.

The visibility check middleware is the cornerstone of the system's security, preventing unauthorized data access and maintaining strict hierarchy boundaries. All operations are designed with security considerations, rate limiting, and comprehensive audit trails.