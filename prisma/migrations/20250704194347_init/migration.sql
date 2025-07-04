/*
  Warnings:

  - A unique constraint covering the columns `[stationId,name]` on the table `shifts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "shifts_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "shifts_stationId_name_key" ON "shifts"("stationId", "name");
