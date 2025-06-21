/*
  Warnings:

  - The primary key for the `EditedRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `attendantComment` on the `EditedRecord` table. All the data in the column will be lost.
  - You are about to drop the column `attendantId` on the `EditedRecord` table. All the data in the column will be lost.
  - The `id` column on the `EditedRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Record` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `billerId` to the `EditedRecord` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `recordId` on the `EditedRecord` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "EditedRecord" DROP CONSTRAINT "EditedRecord_attendantId_fkey";

-- DropForeignKey
ALTER TABLE "EditedRecord" DROP CONSTRAINT "EditedRecord_recordId_fkey";

-- DropForeignKey
ALTER TABLE "Record" DROP CONSTRAINT "Record_userId_fkey";

-- AlterTable
ALTER TABLE "EditedRecord" DROP CONSTRAINT "EditedRecord_pkey",
DROP COLUMN "attendantComment",
DROP COLUMN "attendantId",
ADD COLUMN     "billerComment" TEXT,
ADD COLUMN     "billerId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "recordId",
ADD COLUMN     "recordId" INTEGER NOT NULL,
ADD CONSTRAINT "EditedRecord_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Record";

-- CreateTable
CREATE TABLE "records" (
    "id" SERIAL NOT NULL,
    "ticket" TEXT NOT NULL,
    "recordType" TEXT,
    "name" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "subService" TEXT,
    "recordNumber" TEXT,
    "value" INTEGER NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "counterId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "counters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditedRecord" ADD CONSTRAINT "EditedRecord_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EditedRecord" ADD CONSTRAINT "EditedRecord_billerId_fkey" FOREIGN KEY ("billerId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
