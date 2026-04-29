/*
  Warnings:

  - The values [CITY] on the enum `RuleCoverage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RuleCoverage_new" AS ENUM ('COUNTRY', 'COUNCIL', 'STATE');
ALTER TABLE "RuleFiles" ALTER COLUMN "coverage" TYPE "RuleCoverage_new" USING ("coverage"::text::"RuleCoverage_new");
ALTER TABLE "RuleLinks" ALTER COLUMN "coverage" TYPE "RuleCoverage_new" USING ("coverage"::text::"RuleCoverage_new");
ALTER TYPE "RuleCoverage" RENAME TO "RuleCoverage_old";
ALTER TYPE "RuleCoverage_new" RENAME TO "RuleCoverage";
DROP TYPE "public"."RuleCoverage_old";
COMMIT;
