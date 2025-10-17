-- DropForeignKey
ALTER TABLE "agent_usage_logs" DROP CONSTRAINT "agent_usage_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_usage_logs" DROP CONSTRAINT "agent_usage_logs_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_approval_logs" DROP CONSTRAINT "agent_approval_logs_performed_by_fkey";

-- DropForeignKey
ALTER TABLE "agent_approval_logs" DROP CONSTRAINT "agent_approval_logs_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_settings" DROP CONSTRAINT "agent_settings_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_agency_id_fkey";

-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_created_by_fkey";

-- DropIndex
DROP INDEX "agent_usage_logs_status_created_at_idx";

-- DropIndex
DROP INDEX "agent_usage_logs_user_id_created_at_idx";

-- DropIndex
DROP INDEX "agent_usage_logs_agent_id_created_at_idx";

-- DropIndex
DROP INDEX "agent_approval_logs_performed_by_created_at_idx";

-- DropIndex
DROP INDEX "agent_approval_logs_agent_id_created_at_idx";

-- DropIndex
DROP INDEX "agents_agency_id_idx";

-- DropIndex
DROP INDEX "agents_organization_id_idx";

-- DropIndex
DROP INDEX "agents_status_idx";

-- DropIndex
DROP INDEX "agents_visibility_idx";

-- DropIndex
DROP INDEX "agents_type_idx";

-- DropIndex
DROP INDEX "agents_created_by_idx";

-- DropIndex
DROP INDEX "agent_settings_key_key";

-- DropTable
DROP TABLE "agent_usage_logs";

-- DropTable
DROP TABLE "agent_approval_logs";

-- DropTable
DROP TABLE "agent_settings";

-- DropTable
DROP TABLE "agents";

-- DropEnum
DROP TYPE "ApprovalAction";

-- DropEnum
DROP TYPE "AgentStatus";

-- DropEnum
DROP TYPE "AgentVisibility";

-- DropEnum
DROP TYPE "AgentType";