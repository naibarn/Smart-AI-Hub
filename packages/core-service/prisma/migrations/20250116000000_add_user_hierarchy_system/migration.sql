-- Add UserTier enum
CREATE TYPE "UserTier" AS ENUM ('administrator', 'agency', 'organization', 'admin', 'general');

-- Add TransferType enum
CREATE TYPE "TransferType" AS ENUM ('manual', 'referral_reward', 'admin_adjustment');

-- Add TransferCurrency enum
CREATE TYPE "TransferCurrency" AS ENUM ('points', 'credits');

-- Add TransferStatus enum
CREATE TYPE "TransferStatus" AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Add RewardStatus enum
CREATE TYPE "RewardStatus" AS ENUM ('pending', 'completed', 'failed');

-- Add BlockAction enum
CREATE TYPE "BlockAction" AS ENUM ('block', 'unblock');

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

-- Create transfers table
CREATE TABLE "transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "type" "TransferType" NOT NULL,
    "currency" "TransferCurrency" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "TransferStatus" NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- Add indexes for transfers table
CREATE INDEX "transfers_sender_id_created_at_idx" ON "transfers"("sender_id", "created_at");
CREATE INDEX "transfers_receiver_id_created_at_idx" ON "transfers"("receiver_id", "created_at");

-- Create referral_rewards table
CREATE TABLE "referral_rewards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referrer_id" UUID NOT NULL,
    "referee_id" UUID NOT NULL,
    "referrer_tier" "UserTier" NOT NULL,
    "referee_tier" "UserTier" NOT NULL,
    "referrer_reward_points" INTEGER NOT NULL,
    "referee_reward_points" INTEGER NOT NULL,
    "agency_bonus_points" INTEGER,
    "agency_id" UUID,
    "status" "RewardStatus" NOT NULL DEFAULT 'pending',
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- Add indexes for referral_rewards table
CREATE INDEX "referral_rewards_referrer_id_created_at_idx" ON "referral_rewards"("referrer_id", "created_at");
CREATE INDEX "referral_rewards_referee_id_created_at_idx" ON "referral_rewards"("referee_id", "created_at");
CREATE INDEX "referral_rewards_agency_id_created_at_idx" ON "referral_rewards"("agency_id", "created_at");

-- Create agency_referral_configs table
CREATE TABLE "agency_referral_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" UUID NOT NULL,
    "organization_reward_points" INTEGER NOT NULL DEFAULT 5000,
    "admin_reward_points" INTEGER NOT NULL DEFAULT 3000,
    "general_reward_points" INTEGER NOT NULL DEFAULT 1000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_referral_configs_pkey" PRIMARY KEY ("id")
);

-- Create unique index for agency_referral_configs
CREATE UNIQUE INDEX "agency_referral_configs_agency_id_key" ON "agency_referral_configs"("agency_id");

-- Create block_logs table
CREATE TABLE "block_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "blocked_by" UUID NOT NULL,
    "action" "BlockAction" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_logs_pkey" PRIMARY KEY ("id")
);

-- Add indexes for block_logs table
CREATE INDEX "block_logs_user_id_created_at_idx" ON "block_logs"("user_id", "created_at");
CREATE INDEX "block_logs_blocked_by_created_at_idx" ON "block_logs"("blocked_by", "created_at");

-- Add foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_parent_agency_id_fkey" FOREIGN KEY ("parent_agency_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_parent_organization_id_fkey" FOREIGN KEY ("parent_organization_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transfers" ADD CONSTRAINT "transfers_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agency_referral_configs" ADD CONSTRAINT "agency_referral_configs_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "block_logs" ADD CONSTRAINT "block_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "block_logs" ADD CONSTRAINT "block_logs_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create trigger to update updated_at column for agency_referral_configs
CREATE OR REPLACE FUNCTION update_agency_referral_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER "agency_referral_configs_updated_at" BEFORE UPDATE ON "agency_referral_configs" FOR EACH ROW EXECUTE FUNCTION update_agency_referral_configs_updated_at();