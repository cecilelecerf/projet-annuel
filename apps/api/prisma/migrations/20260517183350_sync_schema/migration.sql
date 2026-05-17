/*
  Warnings:

  - You are about to drop the column `veterinarianId` on the `animal_meetings` table. All the data in the column will be lost.
  - Added the required column `veterinarianClinicId` to the `animal_meetings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "animal_meetings" DROP CONSTRAINT "animal_meetings_veterinarianId_fkey";

-- AlterTable
ALTER TABLE "animal_meetings" DROP COLUMN "veterinarianId",
ADD COLUMN     "veterinarianClinicId" TEXT NOT NULL,
ADD COLUMN     "veterinarianProfileId" TEXT;

-- AddForeignKey
ALTER TABLE "animal_meetings" ADD CONSTRAINT "animal_meetings_veterinarianClinicId_fkey" FOREIGN KEY ("veterinarianClinicId") REFERENCES "veterinarian_clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_meetings" ADD CONSTRAINT "animal_meetings_veterinarianProfileId_fkey" FOREIGN KEY ("veterinarianProfileId") REFERENCES "veterinarian_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
