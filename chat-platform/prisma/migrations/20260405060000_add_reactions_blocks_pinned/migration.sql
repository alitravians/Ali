-- Add MENTION and REACTION to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MENTION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REACTION';

-- Add isPinned column to messages table
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: reactions
CREATE TABLE IF NOT EXISTS "reactions" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reactions_messageId_idx" ON "reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "reactions_userId_messageId_emoji_key" ON "reactions"("userId", "messageId", "emoji");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "reactions" ADD CONSTRAINT "reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: user_blocks
CREATE TABLE IF NOT EXISTS "user_blocks" (
    "id" TEXT NOT NULL,
    "blockedById" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_blocks_blockedById_blockedUserId_key" ON "user_blocks"("blockedById", "blockedUserId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
