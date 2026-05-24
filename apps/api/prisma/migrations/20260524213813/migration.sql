-- DropForeignKey
ALTER TABLE "animal_medical_histories" DROP CONSTRAINT "animal_medical_histories_animalId_fkey";

-- DropForeignKey
ALTER TABLE "animal_meetings" DROP CONSTRAINT "animal_meetings_animalId_fkey";

-- DropForeignKey
ALTER TABLE "animals_vaccines" DROP CONSTRAINT "animals_vaccines_animalId_fkey";

-- DropForeignKey
ALTER TABLE "food_pets" DROP CONSTRAINT "food_pets_animalId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pet_health_conditions" DROP CONSTRAINT "owned_pet_health_conditions_meetingId_fkey";

-- AlterTable
ALTER TABLE "animals" ADD COLUMN     "animalContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "outdoorAccess" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals_vaccines" ADD CONSTRAINT "animals_vaccines_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "animal_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_meetings" ADD CONSTRAINT "animal_meetings_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pets" ADD CONSTRAINT "food_pets_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
