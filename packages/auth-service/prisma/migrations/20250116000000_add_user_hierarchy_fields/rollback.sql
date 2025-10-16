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

-- Drop enum
DROP TYPE IF EXISTS "UserTier";