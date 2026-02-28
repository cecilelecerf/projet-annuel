/*
  Warnings:

  - You are about to drop the column `mettingId` on the `owned_pet_health_conditions` table. All the data in the column will be lost.
  - You are about to drop the column `mettingId` on the `owned_pet_vaccines` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'DONE', 'CONFIRMED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "owned_pet_health_conditions" DROP CONSTRAINT "owned_pet_health_conditions_mettingId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pet_vaccines" DROP CONSTRAINT "owned_pet_vaccines_mettingId_fkey";

-- AlterTable
ALTER TABLE "client_profiles" ADD COLUMN     "secretaryProfileId" TEXT;

-- AlterTable
ALTER TABLE "owned_pet_health_conditions" DROP COLUMN "mettingId",
ADD COLUMN     "meetingId" TEXT;

-- AlterTable
ALTER TABLE "owned_pet_vaccines" DROP COLUMN "mettingId",
ADD COLUMN     "meetingId" TEXT;

-- DropEnum
DROP TYPE "MettingStatus";

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
