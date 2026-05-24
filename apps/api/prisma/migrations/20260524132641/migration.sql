/*
  Warnings:

  - You are about to drop the `animal_meeting_act_performers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `animal_meeting_acts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `vaccinatedAt` to the `owned_pet_vaccines` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "analyses" DROP CONSTRAINT "analyses_id_fkey";

-- DropForeignKey
ALTER TABLE "animal_meeting_act_performers" DROP CONSTRAINT "animal_meeting_act_performers_animalMeetingActId_fkey";

-- DropForeignKey
ALTER TABLE "animal_meeting_act_performers" DROP CONSTRAINT "animal_meeting_act_performers_veterinarianId_fkey";

-- DropForeignKey
ALTER TABLE "animal_meeting_acts" DROP CONSTRAINT "animal_meeting_acts_animalMeetingId_fkey";

-- DropForeignKey
ALTER TABLE "animal_meeting_acts" DROP CONSTRAINT "animal_meeting_acts_clinicActId_fkey";

-- DropForeignKey
ALTER TABLE "hospitalizations" DROP CONSTRAINT "hospitalizations_id_fkey";

-- DropForeignKey
ALTER TABLE "imagings" DROP CONSTRAINT "imagings_id_fkey";

-- DropForeignKey
ALTER TABLE "owned_pet_vaccines" DROP CONSTRAINT "owned_pet_vaccines_actId_fkey";

-- DropForeignKey
ALTER TABLE "surgeries" DROP CONSTRAINT "surgeries_id_fkey";

-- AlterTable
ALTER TABLE "owned_pet_vaccines" ADD COLUMN     "vaccinatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "veterinarian_profiles" ADD COLUMN     "animalMedicalHistoryId" TEXT;

-- DropTable
DROP TABLE "animal_meeting_act_performers";

-- DropTable
DROP TABLE "animal_meeting_acts";

-- CreateTable
CREATE TABLE "animal_medical_histories" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ActType" NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "priceApplied" DECIMAL(8,2),
    "animalMeetingId" TEXT,
    "clinicActId" TEXT,
    "ownedPetId" TEXT NOT NULL,

    CONSTRAINT "animal_medical_histories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_animalMeetingId_fkey" FOREIGN KEY ("animalMeetingId") REFERENCES "animal_meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_clinicActId_fkey" FOREIGN KEY ("clinicActId") REFERENCES "clinic_acts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagings" ADD CONSTRAINT "imagings_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccines" ADD CONSTRAINT "owned_pet_vaccines_actId_fkey" FOREIGN KEY ("actId") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_profiles" ADD CONSTRAINT "veterinarian_profiles_animalMedicalHistoryId_fkey" FOREIGN KEY ("animalMedicalHistoryId") REFERENCES "animal_medical_histories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
