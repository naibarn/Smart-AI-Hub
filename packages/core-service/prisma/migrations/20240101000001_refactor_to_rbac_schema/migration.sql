-- Step 1: Add new columns to existing tables
ALTER TABLE "roles" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "user_roles" ADD COLUMN "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "role_permissions" ADD COLUMN "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Rename emailVerified to verified in users table
ALTER TABLE "users" RENAME COLUMN "email_verified" TO "verified";

-- Step 3: Transform credit_accounts table structure
-- First, add the new balance column
ALTER TABLE "credit_accounts" ADD COLUMN "balance" INTEGER NOT NULL DEFAULT 0;

-- Migrate data from currentBalance to balance
UPDATE "credit_accounts" SET "balance" = "current_balance";

-- Drop old columns (we'll keep them for rollback initially)
-- ALTER TABLE "credit_accounts" DROP COLUMN "current_balance";
-- ALTER TABLE "credit_accounts" DROP COLUMN "total_purchased";
-- ALTER TABLE "credit_accounts" DROP COLUMN "total_used";

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "user_roles"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "user_roles"("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");
CREATE INDEX IF NOT EXISTS "idx_permissions_resource_action" ON "permissions"("resource", "action");