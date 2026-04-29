/*
  Warnings:

  - You are about to drop the column `ruleId` on the `RuleEmbeddings` table. All the data in the column will be lost.
  - You are about to drop the `RuleLinks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RuleEmbeddings" DROP CONSTRAINT "RuleEmbeddings_ruleId_fkey";

-- AlterTable
ALTER TABLE "RuleEmbeddings" DROP COLUMN "ruleId";

-- DropTable
DROP TABLE "RuleLinks";
