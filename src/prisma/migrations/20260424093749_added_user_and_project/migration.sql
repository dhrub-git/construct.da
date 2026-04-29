/*
  Warnings:

  - You are about to drop the `RuleEmbeddings` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('NEW_DWELLING', 'HOME_EXTENSION', 'SECOND_STOREY_ADDITION', 'GARAGE_OR_CARPORT', 'GRANNY_FLAT', 'SWIMMING_POOL', 'CHANGE_OF_USE', 'DEMOLITION', 'SIGNAGE', 'RETAINING_WALL');

-- DropForeignKey
ALTER TABLE "FileEmbedding" DROP CONSTRAINT "FileEmbedding_fileId_fkey";

-- DropForeignKey
ALTER TABLE "RuleEmbeddings" DROP CONSTRAINT "RuleEmbeddings_fileId_fkey";

-- AlterTable
ALTER TABLE "FileEmbedding" ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "ruleFileId" TEXT,
ALTER COLUMN "fileId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Files" ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "userId" TEXT;

-- DropTable
DROP TABLE "RuleEmbeddings";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "clerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "council" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkUserId_idx" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project"("name");

-- CreateIndex
CREATE INDEX "FileEmbedding_projectId_idx" ON "FileEmbedding"("projectId");

-- CreateIndex
CREATE INDEX "FileEmbedding_search_vector_idx" ON "FileEmbedding" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "Files_projectId_idx" ON "Files"("projectId");

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileEmbedding" ADD CONSTRAINT "FileEmbedding_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileEmbedding" ADD CONSTRAINT "FileEmbedding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileEmbedding" ADD CONSTRAINT "FileEmbedding_ruleFileId_fkey" FOREIGN KEY ("ruleFileId") REFERENCES "RuleFiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
