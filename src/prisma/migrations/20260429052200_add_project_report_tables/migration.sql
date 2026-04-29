-- Add generated project report storage used by the project workspace.
-- Idempotent because some hackathon dev databases were synced with `prisma db push`
-- before this migration was committed.

DO $$
BEGIN
    CREATE TYPE "ProjectReportStatus" AS ENUM ('PENDING', 'COMPLETED', 'PARTIAL', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProjectReport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "ProjectReportStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "summary" TEXT,
    "executiveSummary" TEXT,
    "findingsJson" JSONB,
    "factsJson" JSONB,
    "rulesJson" JSONB,
    "rawOutputJson" JSONB,
    "content" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjectReportFinding" (
    "id" TEXT NOT NULL,
    "projectReportId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "evidence" JSONB,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectReportFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjectReportCheckResult" (
    "id" TEXT NOT NULL,
    "projectReportId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "expected" JSONB,
    "actual" JSONB,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectReportCheckResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectReport_projectId_idx" ON "ProjectReport"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectReport_createdAt_idx" ON "ProjectReport"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectReport_projectId_version_key" ON "ProjectReport"("projectId", "version");
CREATE INDEX IF NOT EXISTS "ProjectReportFinding_projectReportId_idx" ON "ProjectReportFinding"("projectReportId");
CREATE INDEX IF NOT EXISTS "ProjectReportFinding_severity_idx" ON "ProjectReportFinding"("severity");
CREATE INDEX IF NOT EXISTS "ProjectReportCheckResult_projectReportId_idx" ON "ProjectReportCheckResult"("projectReportId");
CREATE INDEX IF NOT EXISTS "ProjectReportCheckResult_category_idx" ON "ProjectReportCheckResult"("category");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectReport_projectId_fkey') THEN
        ALTER TABLE "ProjectReport"
        ADD CONSTRAINT "ProjectReport_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectReportFinding_projectReportId_fkey') THEN
        ALTER TABLE "ProjectReportFinding"
        ADD CONSTRAINT "ProjectReportFinding_projectReportId_fkey"
        FOREIGN KEY ("projectReportId") REFERENCES "ProjectReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProjectReportCheckResult_projectReportId_fkey') THEN
        ALTER TABLE "ProjectReportCheckResult"
        ADD CONSTRAINT "ProjectReportCheckResult_projectReportId_fkey"
        FOREIGN KEY ("projectReportId") REFERENCES "ProjectReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
