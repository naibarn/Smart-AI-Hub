-- Drop foreign key constraints
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_parent_agency_id_fkey";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_parent_organization_id_fkey";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_invited_by_fkey";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_blocked_by_fkey";

ALTER TABLE "transfers" DROP CONSTRAINT IF EXISTS "transfers_sender_id_fkey";
ALTER TABLE "transfers" DROP CONSTRAINT IF EXISTS "transfers_receiver_id_fkey";

ALTER TABLE "referral_rewards" DROP CONSTRAINT IF EXISTS "referral_rewards_referrer_id_fkey";
ALTER TABLE "referral_rewards" DROP CONSTRAINT IF EXISTS "referral_rewards_referee_id_fkey";
ALTER TABLE "referral_rewards" DROP CONSTRAINT IF EXISTS "referral_rewards_agency_id_fkey";

ALTER TABLE "agency_referral_configs" DROP CONSTRAINT IF EXISTS "agency_referral_configs_agency_id_fkey";

ALTER TABLE "block_logs" DROP CONSTRAINT IF EXISTS "block_logs_user_id_fkey";
ALTER TABLE "block_logs" DROP CONSTRAINT IF EXISTS "block_logs_blocked_by_fkey";

-- Drop tables
DROP TABLE IF EXISTS "block_logs";
DROP TABLE IF EXISTS "agency_referral_configs";
DROP TABLE IF EXISTS "referral_rewards";
DROP TABLE IF EXISTS "transfers";

-- Drop indexes from users table
DROP INDEX IF EXISTS "users_tier_idx";
DROP INDEX IF EXISTS "users_parent_agency_id_idx";
DROP INDEX IF EXISTS "users_parent_organization_id_idx";
DROP INDEX IF EXISTS "users_invite_code_idx";
DROP INDEX IF EXISTS "users_invited_by_idx";

-- Drop columns from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "tier";
ALTER TABLE "users" DROP COLUMN IF EXISTS "parent_agency_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "parent_organization_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "invite_code";
ALTER TABLE "users" DROP COLUMN IF EXISTS "invited_by";
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_blocked";
ALTER TABLE "users" DROP COLUMN IF EXISTS "blocked_reason";
ALTER TABLE "users" DROP COLUMN IF EXISTS "blocked_at";
ALTER TABLE "users" DROP COLUMN IF EXISTS "blocked_by";

-- Drop enums
DROP TYPE IF EXISTS "UserTier";
DROP TYPE IF EXISTS "TransferType";
DROP TYPE IF EXISTS "TransferCurrency";
DROP TYPE IF EXISTS "TransferStatus";
DROP TYPE IF EXISTS "RewardStatus";
DROP TYPE IF EXISTS "BlockAction";

-- Drop trigger function
DROP FUNCTION IF EXISTS update_agency_referral_configs_updated_at();