/*
  Warnings:

  - You are about to drop the `owned_pets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "animal_medical_histories" DROP CONSTRAINT "animal_medical_histories_animalId_fkey";

-- DropForeignKey
ALTER TABLE "animal_meetings" DROP CONSTRAINT "animal_meetings_animalId_fkey";

-- DropForeignKey
ALTER TABLE "food_pets" DROP CONSTRAINT "food_pets_animalId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pet_health_conditions" DROP CONSTRAINT "owned_pet_health_conditions_animalId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pet_vaccines" DROP CONSTRAINT "owned_pet_vaccines_animalId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pets" DROP CONSTRAINT "owned_pets_attendingVeterinarianId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pets" DROP CONSTRAINT "owned_pets_clientId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pets" DROP CONSTRAINT "owned_pets_raceId_fkey";

-- DropTable
DROP TABLE "owned_pets";

-- CreateTable
CREATE TABLE "animals" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "activity" INTEGER,
    "attendingVeterinarianId" TEXT,
    "clientId" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_meetings" ADD CONSTRAINT "animal_meetings_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_attendingVeterinarianId_fkey" FOREIGN KEY ("attendingVeterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pets" ADD CONSTRAINT "food_pets_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
