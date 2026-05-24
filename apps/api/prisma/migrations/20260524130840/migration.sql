/*
  Warnings:

  - You are about to drop the column `meetingId` on the `owned_pet_vaccines` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "owned_pet_vaccines" DROP CONSTRAINT "owned_pet_vaccines_meetingId_fkey";

-- AlterTable
ALTER TABLE "owned_pet_vaccines" DROP COLUMN "meetingId",
ADD COLUMN     "actId" TEXT;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_actId_fkey" FOREIGN KEY ("actId") REFERENCES "animal_meeting_acts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
