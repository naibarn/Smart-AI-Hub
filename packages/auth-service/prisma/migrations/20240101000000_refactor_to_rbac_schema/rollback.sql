-- ROLLBACK MIGRATION: Refactor from RBAC schema back to original schema
-- WARNING: This migration will cause data loss for the new RBAC features
-- Only run this if you need to rollback to the previous schema

-- Step 1: Create old tables structure
CREATE TABLE "credit_accounts_old" (
    "user_id" UUID NOT NULL,
    "current_balance" INTEGER NOT NULL DEFAULT 0,
    "total_purchased" INTEGER NOT NULL DEFAULT 0,
    "total_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_accounts_old_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "credit_transactions_old" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_old_pkey" PRIMARY KEY ("id")
);

-- Step 2: Migrate data back to old structure
INSERT INTO "credit_accounts_old" ("user_id", "current_balance", "total_purchased", "total_used", "created_at", "updated_at")
SELECT 
    user_id,
    balance as current_balance,
    balance as total_purchased,
    0 as total_used,
    created_at,
    updated_at
FROM "credit_accounts";

INSERT INTO "credit_transactions_old" (
    "id", "user_id", "type", "amount", "balance_after", "description", "metadata", "created_at"
)
SELECT 
    ct.id,
    ca.user_id,
    ct.type,
    ct.amount,
    ct.balance_after,
    ct.description,
    ct.metadata,
    ct.created_at
FROM "credit_transactions" ct
JOIN "credit_accounts" ca ON ct.credit_account_id = ca.id;

-- Step 3: Add old columns back to users and roles tables
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "role_id" UUID;
ALTER TABLE "roles" ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '{}';

-- Step 4: Migrate user roles back to single role (take first role if multiple)
UPDATE "users" u
SET "role_id" = ur.role_id
FROM "user_roles" ur
WHERE u.id = ur.user_id
AND NOT EXISTS (
    SELECT 1 FROM "user_roles" ur2 
    WHERE ur2.user_id = u.id AND ur2.created_at < ur.created_at
);

-- Step 5: Migrate role permissions back to JSON format
UPDATE "roles" r
SET "permissions" = COALESCE(
    (
        SELECT jsonb_agg(p.name)
        FROM "role_permissions" rp
        JOIN "permissions" p ON rp.permission_id = p.id
        WHERE rp.role_id = r.id
    ),
    '[]'::jsonb
);

-- Step 6: Drop new tables and constraints
DROP TABLE IF EXISTS "credit_transactions";
DROP TABLE IF EXISTS "credit_accounts";
DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "role_permissions";
DROP TABLE IF EXISTS "permissions";
DROP TABLE IF EXISTS "usage_logs";

-- Step 7: Rename old tables back to original names
ALTER TABLE "credit_accounts_old" RENAME TO "credit_accounts";
ALTER TABLE "credit_transactions_old" RENAME TO "credit_transactions";

-- Step 8: Drop new columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "verified";
ALTER TABLE "roles" DROP COLUMN IF EXISTS "description";
ALTER TABLE "roles" DROP COLUMN IF EXISTS "is_system";
ALTER TABLE "roles" DROP COLUMN IF EXISTS "updated_at";

-- Step 9: Add old foreign key constraints back
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;