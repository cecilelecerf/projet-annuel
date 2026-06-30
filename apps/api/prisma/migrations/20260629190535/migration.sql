/*
  Warnings:

  - You are about to drop the column `recurringId` on the `animal_meetings` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "animal_meetings" DROP CONSTRAINT "animal_meetings_recurringId_fkey";

-- DropIndex
DROP INDEX "animal_meetings_recurringId_key";

-- AlterTable
ALTER TABLE "animal_meetings" DROP COLUMN "recurringId";
