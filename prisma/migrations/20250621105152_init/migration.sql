/*
  Warnings:

  - Added the required column `shiftId` to the `counters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stationId` to the `shifts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "counters" ADD COLUMN     "shiftId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "stationId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counters" ADD CONSTRAINT "counters_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
