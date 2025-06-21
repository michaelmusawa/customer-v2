/*
  Warnings:

  - You are about to drop the column `counterId` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `shiftId` on the `records` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "records" DROP CONSTRAINT "records_counterId_fkey";

-- DropForeignKey
ALTER TABLE "records" DROP CONSTRAINT "records_shiftId_fkey";

-- AlterTable
ALTER TABLE "records" DROP COLUMN "counterId",
DROP COLUMN "shiftId";
