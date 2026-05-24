/*
  Warnings:

  - You are about to drop the column `actId` on the `owned_pet_vaccines` table. All the data in the column will be lost.
  - You are about to drop the column `vaccinatedAt` on the `owned_pet_vaccines` table. All the data in the column will be lost.
  - Added the required column `medicalHistoryId` to the `owned_pet_vaccines` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "owned_pet_vaccines" DROP CONSTRAINT "owned_pet_vaccines_actId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pet_vaccines" DROP CONSTRAINT "owned_pet_vaccines_ownedPetId_fkey";

-- AlterTable
ALTER TABLE "owned_pet_vaccines" DROP COLUMN "actId",
DROP COLUMN "vaccinatedAt",
ADD COLUMN     "medicalHistoryId" TEXT NOT NULL,
ALTER COLUMN "ownedPetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_medicalHistoryId_fkey" FOREIGN KEY ("medicalHistoryId") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
