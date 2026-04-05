-- GitHub Monitor: Create enums
DO $$ BEGIN
  CREATE TYPE "GitHubEventType" AS ENUM ('PUSH', 'PULL_REQUEST', 'CHECK_RUN', 'CHECK_SUITE', 'CODE_SCAN_ALERT', 'SECRET_SCAN_ALERT', 'DEPENDABOT_ALERT', 'WORKFLOW_RUN', 'MANUAL_SYNC');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GitHubSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GitHubFileChangeType" AS ENUM ('ADDED', 'MODIFIED', 'DELETED', 'RENAMED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GitHubAlertType" AS ENUM ('CODE_SCAN', 'SECRET_SCAN', 'DEPENDABOT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GitHubAlertState" AS ENUM ('OPEN', 'FIXED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GitHubCheckStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GitHubCheckConclusion" AS ENUM ('SUCCESS', 'FAILURE', 'NEUTRAL', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'SKIPPED', 'STALE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GitHubFixType" AS ENUM ('DIRECT', 'PR');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GitHubFixStatus" AS ENUM ('PENDING', 'COMMITTED', 'MERGED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- GitHub App Config
CREATE TABLE IF NOT EXISTS "github_app_config" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "privateKey" TEXT NOT NULL,
  "installationId" TEXT NOT NULL,
  "webhookSecret" TEXT NOT NULL,
  "repoOwner" TEXT NOT NULL,
  "repoName" TEXT NOT NULL,
  "defaultBranch" TEXT NOT NULL DEFAULT 'main',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "github_app_config_pkey" PRIMARY KEY ("id")
);

-- GitHub Events
CREATE TABLE IF NOT EXISTS "github_events" (
  "id" TEXT NOT NULL,
  "eventType" "GitHubEventType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "actor" TEXT,
  "branch" TEXT,
  "commitSha" TEXT,
  "metadata" JSONB,
  "severity" "GitHubSeverity" NOT NULL DEFAULT 'INFO',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "github_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "github_events_eventType_idx" ON "github_events"("eventType");
CREATE INDEX IF NOT EXISTS "github_events_createdAt_idx" ON "github_events"("createdAt");

-- GitHub File Changes
CREATE TABLE IF NOT EXISTS "github_file_changes" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "changeType" "GitHubFileChangeType" NOT NULL,
  "oldPath" TEXT,
  "additions" INTEGER NOT NULL DEFAULT 0,
  "deletions" INTEGER NOT NULL DEFAULT 0,
  "commitSha" TEXT,
  "author" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "github_file_changes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "github_file_changes_eventId_idx" ON "github_file_changes"("eventId");
ALTER TABLE "github_file_changes" DROP CONSTRAINT IF EXISTS "github_file_changes_eventId_fkey";
ALTER TABLE "github_file_changes" ADD CONSTRAINT "github_file_changes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "github_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GitHub Alerts
CREATE TABLE IF NOT EXISTS "github_alerts" (
  "id" TEXT NOT NULL,
  "alertType" "GitHubAlertType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "severity" "GitHubSeverity" NOT NULL DEFAULT 'WARNING',
  "filePath" TEXT,
  "lineNumber" INTEGER,
  "state" "GitHubAlertState" NOT NULL DEFAULT 'OPEN',
  "githubAlertNumber" INTEGER,
  "ruleId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "github_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "github_alerts_alertType_idx" ON "github_alerts"("alertType");
CREATE INDEX IF NOT EXISTS "github_alerts_state_idx" ON "github_alerts"("state");

-- GitHub Checks
CREATE TABLE IF NOT EXISTS "github_checks" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "GitHubCheckStatus" NOT NULL,
  "conclusion" "GitHubCheckConclusion",
  "branch" TEXT,
  "commitSha" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "detailsUrl" TEXT,
  "output" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "github_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "github_checks_commitSha_idx" ON "github_checks"("commitSha");

-- GitHub Fixes
CREATE TABLE IF NOT EXISTS "github_fixes" (
  "id" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "oldContent" TEXT,
  "newContent" TEXT NOT NULL,
  "commitMessage" TEXT NOT NULL,
  "fixType" "GitHubFixType" NOT NULL,
  "branch" TEXT,
  "prNumber" INTEGER,
  "prUrl" TEXT,
  "performedBy" TEXT NOT NULL,
  "status" "GitHubFixStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "github_fixes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "github_fixes_performedBy_idx" ON "github_fixes"("performedBy");
ALTER TABLE "github_fixes" DROP CONSTRAINT IF EXISTS "github_fixes_performedBy_fkey";
ALTER TABLE "github_fixes" ADD CONSTRAINT "github_fixes_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
