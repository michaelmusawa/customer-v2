/*
  Warnings:

  - You are about to drop the column `billerComment` on the `EditedRecord` table. All the data in the column will be lost.
  - You are about to drop the column `counter` on the `EditedRecord` table. All the data in the column will be lost.
  - You are about to drop the column `shift` on the `EditedRecord` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `EditedRecord` table. All the data in the column will be lost.
  - You are about to drop the column `supervisorComment` on the `EditedRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EditedRecord" DROP COLUMN "billerComment",
DROP COLUMN "counter",
DROP COLUMN "shift",
DROP COLUMN "status",
DROP COLUMN "supervisorComment",
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "reason" TEXT;
