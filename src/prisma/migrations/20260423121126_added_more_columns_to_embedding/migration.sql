/*
  Warnings:

  - You are about to drop the `FileEmbeddings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FileEmbeddings" DROP CONSTRAINT "FileEmbeddings_fileId_fkey";

-- DropTable
DROP TABLE "FileEmbeddings";

-- CreateTable
CREATE TABLE "FileEmbedding" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "clause" TEXT,
    "zone" TEXT,
    "topic" TEXT,
    "embedding" vector NOT NULL,
    "search_vector" tsvector NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileEmbedding_fileId_idx" ON "FileEmbedding"("fileId");

-- CreateIndex
CREATE INDEX "FileEmbedding_clause_idx" ON "FileEmbedding"("clause");

-- CreateIndex
CREATE INDEX "FileEmbedding_zone_idx" ON "FileEmbedding"("zone");

-- CreateIndex
CREATE INDEX "FileEmbedding_topic_idx" ON "FileEmbedding"("topic");

-- AddForeignKey
ALTER TABLE "FileEmbedding" ADD CONSTRAINT "FileEmbedding_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
