/*
  Warnings:

  - You are about to drop the column `attendingVeterinarionId` on the `client_pet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "client_pet" DROP CONSTRAINT "client_pet_attendingVeterinarionId_fkey";

-- DropIndex
DROP INDEX "client_pet_attendingVeterinarionId_key";

-- DropIndex
DROP INDEX "client_pet_clientId_key";

-- DropIndex
DROP INDEX "client_pet_raceId_key";

-- DropIndex
DROP INDEX "races_petId_key";

-- AlterTable
ALTER TABLE "client_pet" DROP COLUMN "attendingVeterinarionId",
ADD COLUMN     "attendingVeterinarianId" TEXT,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "activity" DROP NOT NULL;

-- AlterTable
ALTER TABLE "clinic_profiles" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pets" ALTER COLUMN "picture" DROP NOT NULL;

-- AlterTable
ALTER TABLE "races" ALTER COLUMN "picture" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "picture" DROP NOT NULL;

-- CreateTable
CREATE TABLE "vaccines" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "recommendedAge" INTEGER NOT NULL,
    "boosterInterval" INTEGER NOT NULL,
    "mandatoryCountry" JSONB,
    "recommendedCountry" JSONB,
    "petId" TEXT NOT NULL,

    CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalPetVaccine" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientPetId" TEXT NOT NULL,
    "vaccineId" TEXT NOT NULL,
    "mettingId" TEXT,

    CONSTRAINT "PersonalPetVaccine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "petWeight" INTEGER,
    "petSize" INTEGER,
    "clientPetId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "Metting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "client_pet" ADD CONSTRAINT "client_pet_attendingVeterinarianId_fkey" FOREIGN KEY ("attendingVeterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPetVaccine" ADD CONSTRAINT "PersonalPetVaccine_clientPetId_fkey" FOREIGN KEY ("clientPetId") REFERENCES "client_pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPetVaccine" ADD CONSTRAINT "PersonalPetVaccine_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPetVaccine" ADD CONSTRAINT "PersonalPetVaccine_mettingId_fkey" FOREIGN KEY ("mettingId") REFERENCES "Metting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metting" ADD CONSTRAINT "Metting_clientPetId_fkey" FOREIGN KEY ("clientPetId") REFERENCES "client_pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metting" ADD CONSTRAINT "Metting_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
