-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('administrator', 'agency', 'organization', 'admin', 'general');

-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM ('purchase', 'usage', 'exchange_from_credit', 'auto_topup_from_credit', 'daily_reward', 'admin_adjustment', 'refund');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('purchase', 'usage', 'refund', 'admin_adjustment', 'promo');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('manual', 'referral_reward', 'admin_adjustment');

-- CreateEnum
CREATE TYPE "TransferCurrency" AS ENUM ('points', 'credits');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "BlockAction" AS ENUM ('block', 'unblock');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "google_id" VARCHAR(255),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "tier" "UserTier" NOT NULL DEFAULT 'general',
    "parent_agency_id" UUID,
    "parent_organization_id" UUID,
    "invite_code" VARCHAR(12),
    "invited_by" UUID,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_reason" TEXT,
    "blocked_at" TIMESTAMP(3),
    "blocked_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "avatar_url" VARCHAR(500),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "credit_accounts" (
    "user_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_accounts_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_accounts" (
    "user_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_accounts_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "point_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_login_rewards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "reward_date" DATE NOT NULL,
    "points" INTEGER NOT NULL,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_login_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "credits" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_code_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "promo_code_id" UUID NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_code_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "stripe_session_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "service" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100),
    "tokens" INTEGER,
    "credits" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(20) NOT NULL DEFAULT 'credits',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_baselines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service" VARCHAR(50) NOT NULL,
    "route" VARCHAR(255) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "date" DATE NOT NULL,
    "p50" DOUBLE PRECISION NOT NULL,
    "p90" DOUBLE PRECISION NOT NULL,
    "p95" DOUBLE PRECISION NOT NULL,
    "p99" DOUBLE PRECISION NOT NULL,
    "avg" DOUBLE PRECISION NOT NULL,
    "count" INTEGER NOT NULL,
    "sla_tier" VARCHAR(20) NOT NULL,
    "sla_threshold" INTEGER NOT NULL,
    "sla_compliance" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "auto_topup_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "credits_deducted" INTEGER NOT NULL,
    "points_added" INTEGER NOT NULL,
    "trigger_reason" VARCHAR(50) NOT NULL,
    "balance_before" JSONB NOT NULL DEFAULT '{}',
    "balance_after" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_topup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "agency_id" UUID,
    "agent_id" UUID,
    "title" TEXT NOT NULL,
    "filename" VARCHAR(255),
    "file_type" VARCHAR(50),
    "file_size" INTEGER,
    "r2_bucket" VARCHAR(100) NOT NULL,
    "r2_key" TEXT NOT NULL,
    "vectorize_index" VARCHAR(100) NOT NULL,
    "vectorize_namespace" VARCHAR(100),
    "total_chunks" INTEGER NOT NULL DEFAULT 0,
    "access_level" VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    "shared_with_agent_ids" TEXT[],
    "allow_download" BOOLEAN NOT NULL DEFAULT true,
    "allow_copy" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "chunk_size" INTEGER,
    "vector_id" VARCHAR(255) NOT NULL,
    "embedding_model" VARCHAR(50) NOT NULL DEFAULT 'bge-base-en-v1.5',
    "page_number" INTEGER,
    "section_title" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "agent_id" UUID,
    "title" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_platforms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_models" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(150) NOT NULL,
    "model_type" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "capabilities" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model_id" UUID NOT NULL,
    "component_type" VARCHAR(50) NOT NULL,
    "unit_type" VARCHAR(50) NOT NULL,
    "cost_per_unit" DECIMAL(12,8) NOT NULL,
    "markup_percent" DECIMAL(5,2) NOT NULL,
    "price_per_unit" DECIMAL(12,8) NOT NULL,
    "credits_per_unit" DECIMAL(12,4) NOT NULL,
    "min_units" INTEGER,
    "tier_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "agent_id" UUID,
    "platform_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "session_id" UUID,
    "parent_call_id" UUID,
    "call_depth" INTEGER NOT NULL DEFAULT 0,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "total_tokens" INTEGER,
    "rag_embeddings" INTEGER NOT NULL DEFAULT 0,
    "rag_searches" INTEGER NOT NULL DEFAULT 0,
    "tool_calls" INTEGER NOT NULL DEFAULT 0,
    "nested_agent_calls" INTEGER NOT NULL DEFAULT 0,
    "llm_input_cost" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "llm_output_cost" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "rag_cost" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "tool_call_cost" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "nested_agent_cost" DECIMAL(12,8) NOT NULL DEFAULT 0,
    "total_cost_usd" DECIMAL(12,8) NOT NULL,
    "credits_charged" DECIMAL(12,4) NOT NULL,
    "points_charged" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "currency" VARCHAR(20) NOT NULL DEFAULT 'credits',
    "status" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "agent_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_estimations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "estimated_input_tokens" INTEGER,
    "estimated_output_tokens" INTEGER,
    "estimated_rag_ops" INTEGER NOT NULL DEFAULT 0,
    "estimated_tool_calls" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,8) NOT NULL,
    "estimated_credits" DECIMAL(12,4) NOT NULL,
    "user_balance" DECIMAL(12,4) NOT NULL,
    "has_enough_balance" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_estimations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(12,4) NOT NULL,
    "session_id" UUID,
    "status" VARCHAR(20) NOT NULL,
    "charged_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "long_description" TEXT,
    "creator_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "visibility" VARCHAR(20) NOT NULL,
    "organization_id" UUID,
    "status" VARCHAR(20) NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "install_count" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "icon_url" TEXT,
    "screenshot_urls" JSONB NOT NULL DEFAULT '[]',
    "tags" VARCHAR(50)[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "changelog" TEXT,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_hash" VARCHAR(64) NOT NULL,
    "is_latest" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "description" TEXT,
    "icon_name" VARCHAR(50),
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "title" VARCHAR(100),
    "comment" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_installations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skill_installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_invite_code_key" ON "users"("invite_code");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tier_idx" ON "users"("tier");

-- CreateIndex
CREATE INDEX "users_parent_agency_id_idx" ON "users"("parent_agency_id");

-- CreateIndex
CREATE INDEX "users_parent_organization_id_idx" ON "users"("parent_organization_id");

-- CreateIndex
CREATE INDEX "users_invite_code_idx" ON "users"("invite_code");

-- CreateIndex
CREATE INDEX "users_invited_by_idx" ON "users"("invited_by");

-- CreateIndex
CREATE UNIQUE INDEX "daily_login_rewards_user_id_reward_date_key" ON "daily_login_rewards"("user_id", "reward_date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_name_key" ON "exchange_rates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_usages_user_id_promo_code_id_key" ON "promo_code_usages"("user_id", "promo_code_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_session_id_key" ON "payments"("stripe_session_id");

-- CreateIndex
CREATE INDEX "usage_logs_user_id_created_at_idx" ON "usage_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "usage_logs_service_created_at_idx" ON "usage_logs"("service", "created_at");

-- CreateIndex
CREATE INDEX "usage_logs_model_created_at_idx" ON "usage_logs"("model", "created_at");

-- CreateIndex
CREATE INDEX "performance_baselines_service_date_idx" ON "performance_baselines"("service", "date");

-- CreateIndex
CREATE INDEX "performance_baselines_sla_tier_date_idx" ON "performance_baselines"("sla_tier", "date");

-- CreateIndex
CREATE INDEX "performance_baselines_date_idx" ON "performance_baselines"("date");

-- CreateIndex
CREATE UNIQUE INDEX "service_route_method_date" ON "performance_baselines"("service", "route", "method", "date");

-- CreateIndex
CREATE INDEX "transfers_sender_id_created_at_idx" ON "transfers"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "transfers_receiver_id_created_at_idx" ON "transfers"("receiver_id", "created_at");

-- CreateIndex
CREATE INDEX "referral_rewards_referrer_id_created_at_idx" ON "referral_rewards"("referrer_id", "created_at");

-- CreateIndex
CREATE INDEX "referral_rewards_referee_id_created_at_idx" ON "referral_rewards"("referee_id", "created_at");

-- CreateIndex
CREATE INDEX "referral_rewards_agency_id_created_at_idx" ON "referral_rewards"("agency_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "agency_referral_configs_agency_id_key" ON "agency_referral_configs"("agency_id");

-- CreateIndex
CREATE INDEX "block_logs_user_id_created_at_idx" ON "block_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "block_logs_blocked_by_created_at_idx" ON "block_logs"("blocked_by", "created_at");

-- CreateIndex
CREATE INDEX "auto_topup_logs_user_id_created_at_idx" ON "auto_topup_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "documents_organization_id_idx" ON "documents"("organization_id");

-- CreateIndex
CREATE INDEX "documents_agency_id_idx" ON "documents"("agency_id");

-- CreateIndex
CREATE INDEX "documents_agent_id_idx" ON "documents"("agent_id");

-- CreateIndex
CREATE INDEX "documents_access_level_idx" ON "documents"("access_level");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_document_id_chunk_index_key" ON "document_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "conversations_user_id_idx" ON "conversations"("user_id");

-- CreateIndex
CREATE INDEX "conversations_agent_id_idx" ON "conversations"("agent_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_platforms_name_key" ON "agent_platforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "agent_models_platform_id_name_key" ON "agent_models"("platform_id", "name");

-- CreateIndex
CREATE INDEX "pricing_rules_model_id_component_type_is_active_idx" ON "pricing_rules"("model_id", "component_type", "is_active");

-- CreateIndex
CREATE INDEX "pricing_rules_effective_from_effective_to_idx" ON "pricing_rules"("effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "agent_usage_logs_user_id_created_at_idx" ON "agent_usage_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_usage_logs_session_id_idx" ON "agent_usage_logs"("session_id");

-- CreateIndex
CREATE INDEX "agent_usage_logs_parent_call_id_idx" ON "agent_usage_logs"("parent_call_id");

-- CreateIndex
CREATE INDEX "agent_usage_logs_platform_id_model_id_created_at_idx" ON "agent_usage_logs"("platform_id", "model_id", "created_at");

-- CreateIndex
CREATE INDEX "cost_estimations_user_id_created_at_idx" ON "cost_estimations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "cost_estimations_expires_at_idx" ON "cost_estimations"("expires_at");

-- CreateIndex
CREATE INDEX "credit_reservations_user_id_status_idx" ON "credit_reservations"("user_id", "status");

-- CreateIndex
CREATE INDEX "credit_reservations_expires_at_idx" ON "credit_reservations"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "agent_skills_slug_key" ON "agent_skills"("slug");

-- CreateIndex
CREATE INDEX "agent_skills_creator_id_idx" ON "agent_skills"("creator_id");

-- CreateIndex
CREATE INDEX "agent_skills_category_id_idx" ON "agent_skills"("category_id");

-- CreateIndex
CREATE INDEX "agent_skills_platform_id_idx" ON "agent_skills"("platform_id");

-- CreateIndex
CREATE INDEX "agent_skills_status_visibility_idx" ON "agent_skills"("status", "visibility");

-- CreateIndex
CREATE INDEX "agent_skills_slug_idx" ON "agent_skills"("slug");

-- CreateIndex
CREATE INDEX "skill_versions_skill_id_is_latest_idx" ON "skill_versions"("skill_id", "is_latest");

-- CreateIndex
CREATE UNIQUE INDEX "skill_versions_skill_id_version_key" ON "skill_versions"("skill_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_name_key" ON "skill_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_slug_key" ON "skill_categories"("slug");

-- CreateIndex
CREATE INDEX "skill_reviews_skill_id_rating_idx" ON "skill_reviews"("skill_id", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "skill_reviews_skill_id_user_id_key" ON "skill_reviews"("skill_id", "user_id");

-- CreateIndex
CREATE INDEX "skill_installations_user_id_idx" ON "skill_installations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_installations_skill_id_user_id_key" ON "skill_installations"("skill_id", "user_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_accounts" ADD CONSTRAINT "point_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_login_rewards" ADD CONSTRAINT "daily_login_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code_usages" ADD CONSTRAINT "promo_code_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code_usages" ADD CONSTRAINT "promo_code_usages_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_referral_configs" ADD CONSTRAINT "agency_referral_configs_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_logs" ADD CONSTRAINT "block_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_topup_logs" ADD CONSTRAINT "auto_topup_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_models" ADD CONSTRAINT "agent_models_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "agent_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "agent_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_usage_logs" ADD CONSTRAINT "agent_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_usage_logs" ADD CONSTRAINT "agent_usage_logs_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "agent_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_usage_logs" ADD CONSTRAINT "agent_usage_logs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "agent_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_usage_logs" ADD CONSTRAINT "agent_usage_logs_parent_call_id_fkey" FOREIGN KEY ("parent_call_id") REFERENCES "agent_usage_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimations" ADD CONSTRAINT "cost_estimations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimations" ADD CONSTRAINT "cost_estimations_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "agent_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimations" ADD CONSTRAINT "cost_estimations_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "agent_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_reservations" ADD CONSTRAINT "credit_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "agent_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_versions" ADD CONSTRAINT "skill_versions_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "skill_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_reviews" ADD CONSTRAINT "skill_reviews_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_reviews" ADD CONSTRAINT "skill_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_installations" ADD CONSTRAINT "skill_installations_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_installations" ADD CONSTRAINT "skill_installations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_installations" ADD CONSTRAINT "skill_installations_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "skill_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

