-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "RuleCoverage" AS ENUM ('COUNTRY', 'CITY', 'COUNCIL');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "RuleFiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "coverage" "RuleCoverage" NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestedAt" TIMESTAMP(3),

    CONSTRAINT "RuleFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleLinks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "coverage" "RuleCoverage" NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestedAt" TIMESTAMP(3),

    CONSTRAINT "RuleLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleEmbeddings" (
    "id" TEXT NOT NULL,
    "fileId" TEXT,
    "ruleId" TEXT,
    "embedding" vector NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleEmbeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileEmbeddings" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "embedding" vector NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileEmbeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RuleFiles_name_id_idx" ON "RuleFiles"("name", "id");

-- CreateIndex
CREATE UNIQUE INDEX "RuleFiles_name_key" ON "RuleFiles"("name");

-- CreateIndex
CREATE INDEX "RuleLinks_name_id_idx" ON "RuleLinks"("name", "id");

-- CreateIndex
CREATE UNIQUE INDEX "RuleLinks_name_key" ON "RuleLinks"("name");

-- CreateIndex
CREATE INDEX "Files_name_id_idx" ON "Files"("name", "id");

-- CreateIndex
CREATE INDEX "FileEmbeddings_fileId_idx" ON "FileEmbeddings"("fileId");

-- AddForeignKey
ALTER TABLE "RuleEmbeddings" ADD CONSTRAINT "RuleEmbeddings_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "RuleFiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEmbeddings" ADD CONSTRAINT "RuleEmbeddings_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RuleLinks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileEmbeddings" ADD CONSTRAINT "FileEmbeddings_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
