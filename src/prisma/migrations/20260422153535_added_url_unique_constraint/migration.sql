/*
  Warnings:

  - A unique constraint covering the columns `[name,url]` on the table `RuleFiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,url]` on the table `RuleLinks` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RuleFiles_name_key";

-- DropIndex
DROP INDEX "RuleLinks_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "RuleFiles_name_url_key" ON "RuleFiles"("name", "url");

-- CreateIndex
CREATE UNIQUE INDEX "RuleLinks_name_url_key" ON "RuleLinks"("name", "url");
