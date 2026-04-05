-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ADMIN', 'TICKET', 'CHAT', 'PUNISHMENT', 'ITEM', 'BADGE', 'LEVEL', 'PROFILE', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'REACTION';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET';
ALTER TYPE "NotificationType" ADD VALUE 'BADGE';
ALTER TYPE "NotificationType" ADD VALUE 'LEVEL_UP';
ALTER TYPE "NotificationType" ADD VALUE 'XP';
ALTER TYPE "NotificationType" ADD VALUE 'PROFILE';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN';
ALTER TYPE "NotificationType" ADD VALUE 'ITEM';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "notifications" ADD COLUMN "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "notifications" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN "link" TEXT;

-- CreateIndex
CREATE INDEX "notifications_userId_category_idx" ON "notifications"("userId", "category");
