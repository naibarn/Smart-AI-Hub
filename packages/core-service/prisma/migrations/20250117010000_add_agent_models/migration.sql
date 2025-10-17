-- CreateTable
CREATE TYPE "AgentType" AS ENUM ('AGENTFLOW', 'CUSTOMGPT', 'GEMINI_GEM');

-- CreateTable
CREATE TYPE "AgentVisibility" AS ENUM ('PRIVATE', 'ORGANIZATION', 'AGENCY', 'PUBLIC');

-- CreateTable
CREATE TYPE "AgentStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "icon" VARCHAR(500),
    "type" "AgentType" NOT NULL,
    "visibility" "AgentVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "AgentStatus" NOT NULL DEFAULT 'DRAFT',
    "flow_definition" JSONB,
    "input_schema" JSONB,
    "output_schema" JSONB,
    "execution_config" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "external_url" VARCHAR(500),
    "created_by" UUID NOT NULL,
    "organization_id" UUID,
    "agency_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "data_type" VARCHAR(50) NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_approval_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "performed_by" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "input_data" JSONB NOT NULL,
    "output_data" JSONB,
    "tokens_used" INTEGER NOT NULL,
    "cost_in_credits" INTEGER NOT NULL,
    "execution_time" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_settings_key_key" ON "agent_settings"("key");

-- CreateIndex
CREATE INDEX "agents_created_by_idx" ON "agents"("created_by");

-- CreateIndex
CREATE INDEX "agents_type_idx" ON "agents"("type");

-- CreateIndex
CREATE INDEX "agents_visibility_idx" ON "agents"("visibility");

-- CreateIndex
CREATE INDEX "agents_status_idx" ON "agents"("status");

-- CreateIndex
CREATE INDEX "agents_organization_id_idx" ON "agents"("organization_id");

-- CreateIndex
CREATE INDEX "agents_agency_id_idx" ON "agents"("agency_id");

-- CreateIndex
CREATE INDEX "agent_approval_logs_agent_id_created_at_idx" ON "agent_approval_logs"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_approval_logs_performed_by_created_at_idx" ON "agent_approval_logs"("performed_by", "created_at");

-- CreateIndex
CREATE INDEX "agent_usage_logs_agent_id_created_at_idx" ON "agent_usage_logs"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_usage_logs_user_id_created_at_idx" ON "agent_usage_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_usage_logs_status_created_at_idx" ON "agent_usage_logs"("status", "created_at");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_settings" ADD CONSTRAINT "agent_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_approval_logs" ADD CONSTRAINT "agent_approval_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_approval_logs" ADD CONSTRAINT "agent_approval_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_usage_logs" ADD CONSTRAINT "agent_usage_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_usage_logs" ADD CONSTRAINT "agent_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;