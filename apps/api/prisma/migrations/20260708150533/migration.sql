/*
  Warnings:

  - You are about to drop the column `picture` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `animalMedicalHistoryId` on the `veterinarian_clinics` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "veterinarian_clinics" DROP CONSTRAINT "veterinarian_clinics_animalMedicalHistoryId_fkey";

-- AlterTable
ALTER TABLE "animal_medical_histories" ADD COLUMN     "performedById" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "picture";

-- AlterTable
ALTER TABLE "veterinarian_clinics" DROP COLUMN "animalMedicalHistoryId";

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "veterinarian_clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
