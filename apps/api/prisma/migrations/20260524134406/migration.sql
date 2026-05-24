/*
  Warnings:

  - You are about to drop the column `animalMedicalHistoryId` on the `veterinarian_profiles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "veterinarian_profiles" DROP CONSTRAINT "veterinarian_profiles_animalMedicalHistoryId_fkey";

-- AlterTable
ALTER TABLE "veterinarian_clinics" ADD COLUMN     "animalMedicalHistoryId" TEXT;

-- AlterTable
ALTER TABLE "veterinarian_profiles" DROP COLUMN "animalMedicalHistoryId";

-- AddForeignKey
ALTER TABLE "veterinarian_clinics" ADD CONSTRAINT "veterinarian_clinics_animalMedicalHistoryId_fkey" FOREIGN KEY ("animalMedicalHistoryId") REFERENCES "animal_medical_histories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
