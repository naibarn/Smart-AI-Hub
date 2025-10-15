-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "service" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "usage_logs_user_id_idx" ON "usage_logs"("user_id");

-- CreateIndex
CREATE INDEX "usage_logs_service_action_idx" ON "usage_logs"("service", "action");

-- AddColumn
ALTER TABLE "users" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;

-- AddColumn
ALTER TABLE "roles" ADD COLUMN "description" TEXT,
ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migration Step 1: Create new credit_accounts table with new structure
CREATE TABLE "credit_accounts_new" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_accounts_new_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_accounts_new_user_id_key" ON "credit_accounts_new"("user_id");

-- CreateIndex
CREATE INDEX "credit_accounts_new_user_id_idx" ON "credit_accounts_new"("user_id");

-- Migration Step 2: Migrate data from old credit_accounts to new credit_accounts_new
INSERT INTO "credit_accounts_new" ("id", "user_id", "balance", "created_at", "updated_at")
SELECT 
    gen_random_uuid() as id,
    user_id,
    current_balance as balance,
    created_at,
    updated_at
FROM "credit_accounts";

-- Migration Step 3: Create new credit_transactions table with new structure
CREATE TABLE "credit_transactions_new" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "credit_account_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_new_pkey" PRIMARY KEY ("id")
);

-- Migration Step 4: Migrate credit_transactions data with new foreign key reference
INSERT INTO "credit_transactions_new" (
    "id", "credit_account_id", "type", "amount", "balance_after", "description", "metadata", "created_at"
)
SELECT 
    ct.id,
    ca_new.id as credit_account_id,
    ct.type,
    ct.amount,
    ct.balance_after,
    ct.description,
    ct.metadata,
    ct.created_at
FROM "credit_transactions" ct
JOIN "credit_accounts" ca_old ON ct.user_id = ca_old.user_id
JOIN "credit_accounts_new" ca_new ON ca_old.user_id = ca_new.user_id;

-- Migration Step 5: Migrate user roles from single role to many-to-many relationship
INSERT INTO "user_roles" ("user_id", "role_id", "assigned_at")
SELECT 
    u.id as user_id,
    u.role_id as role_id,
    u.created_at as assigned_at
FROM "users" u
WHERE u.role_id IS NOT NULL;

-- Migration Step 6: Create default permissions if they don't exist
INSERT INTO "permissions" ("name", "resource", "action") VALUES
('users:create', 'users', 'create'),
('users:read', 'users', 'read'),
('users:update', 'users', 'update'),
('users:delete', 'users', 'delete'),
('credits:create', 'credits', 'create'),
('credits:read', 'credits', 'read'),
('credits:update', 'credits', 'update'),
('credits:delete', 'credits', 'delete'),
('roles:create', 'roles', 'create'),
('roles:read', 'roles', 'read'),
('roles:update', 'roles', 'update'),
('roles:delete', 'roles', 'delete')
ON CONFLICT DO NOTHING;

-- Migration Step 7: Assign permissions to existing roles based on their JSON permissions
-- This is a complex migration that converts JSON permissions to relational structure
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p.name = ANY(
    SELECT jsonb_array_elements_text(r.permissions)
)
ON CONFLICT DO NOTHING;

-- Migration Step 8: Drop old tables and rename new tables
DROP TABLE IF EXISTS "credit_transactions";
DROP TABLE IF EXISTS "credit_accounts";

ALTER TABLE "credit_accounts_new" RENAME TO "credit_accounts";
ALTER TABLE "credit_transactions_new" RENAME TO "credit_transactions";

-- Migration Step 9: Drop old columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified",
DROP COLUMN IF EXISTS "role_id";

ALTER TABLE "roles" DROP COLUMN IF EXISTS "permissions";

-- Migration Step 10: Add foreign key constraints
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_credit_account_id_fkey" FOREIGN KEY ("credit_account_id") REFERENCES "credit_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;