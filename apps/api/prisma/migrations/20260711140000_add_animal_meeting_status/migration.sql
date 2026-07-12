-- CreateEnum
CREATE TYPE "AnimalMeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterTable: animal_meetings - statut de la visite (planifiée / effectuée / annulée)
ALTER TABLE "animal_meetings" ADD COLUMN "status" "AnimalMeetingStatus" NOT NULL DEFAULT 'SCHEDULED';
