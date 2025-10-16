-- Add UserTier enum
CREATE TYPE "UserTier" AS ENUM ('administrator', 'agency', 'organization', 'admin', 'general');

-- Add new fields to users table
ALTER TABLE "users" 
ADD COLUMN "tier" "UserTier" NOT NULL DEFAULT 'general',
ADD COLUMN "parent_agency_id" UUID,
ADD COLUMN "parent_organization_id" UUID,
ADD COLUMN "invite_code" VARCHAR(12) UNIQUE,
ADD COLUMN "invited_by" UUID,
ADD COLUMN "is_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "blocked_reason" TEXT,
ADD COLUMN "blocked_at" TIMESTAMP(3),
ADD COLUMN "blocked_by" UUID;

-- Add indexes for users table
CREATE INDEX "users_tier_idx" ON "users"("tier");
CREATE INDEX "users_parent_agency_id_idx" ON "users"("parent_agency_id");
CREATE INDEX "users_parent_organization_id_idx" ON "users"("parent_organization_id");
CREATE INDEX "users_invite_code_idx" ON "users"("invite_code");
CREATE INDEX "users_invited_by_idx" ON "users"("invited_by");

-- Add foreign key constraints (these will be null for auth service since it doesn't have the full user hierarchy)
-- These constraints are optional and can be added if needed for validation