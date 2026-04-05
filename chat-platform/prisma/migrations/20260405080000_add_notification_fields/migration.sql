-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "NotificationCategory" AS ENUM ('ADMIN', 'TICKET', 'CHAT', 'PUNISHMENT', 'ITEM', 'BADGE', 'LEVEL', 'PROFILE', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum (idempotent)
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MENTION'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REACTION'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TICKET'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BADGE'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEVEL_UP'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'XP'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROFILE'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ITEM'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterTable (idempotent)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "link" TEXT;

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "notifications_userId_category_idx" ON "notifications"("userId", "category");
