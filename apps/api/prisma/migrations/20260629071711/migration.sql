/*
  Warnings:

  - You are about to drop the column `parentId` on the `meeting_base` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "meeting_base" DROP CONSTRAINT "meeting_base_parentId_fkey";

-- AlterTable
ALTER TABLE "meeting_base" DROP COLUMN "parentId",
ADD COLUMN     "recurringId" TEXT;

-- AddForeignKey
ALTER TABLE "meeting_base" ADD CONSTRAINT "meeting_base_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "meeting_recurring"("id") ON DELETE SET NULL ON UPDATE CASCADE;
