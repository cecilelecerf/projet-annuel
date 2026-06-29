/*
  Warnings:

  - You are about to drop the column `recurringId` on the `meeting_base` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "meeting_base" DROP CONSTRAINT "meeting_base_recurringId_fkey";

-- AlterTable
ALTER TABLE "meeting_base" DROP COLUMN "recurringId",
ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "meeting_base" ADD CONSTRAINT "meeting_base_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "meeting_recurring"("id") ON DELETE SET NULL ON UPDATE CASCADE;
