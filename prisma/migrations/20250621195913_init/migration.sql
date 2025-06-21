/*
  Warnings:

  - A unique constraint covering the columns `[shiftId,name]` on the table `counters` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "counters_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "counters_shiftId_name_key" ON "counters"("shiftId", "name");
