/*
  Warnings:

  - You are about to drop the `personal_pet_vaccine` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `specialityId` to the `mettings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MettingStatus" AS ENUM ('PENDING', 'DONE', 'CONFIRMED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "personal_pet_vaccine" DROP CONSTRAINT "personal_pet_vaccine_mettingId_fkey";

-- DropForeignKey
ALTER TABLE "personal_pet_vaccine" DROP CONSTRAINT "personal_pet_vaccine_ownedPetId_fkey";

-- DropForeignKey
ALTER TABLE "personal_pet_vaccine" DROP CONSTRAINT "personal_pet_vaccine_vaccineId_fkey";

-- AlterTable
ALTER TABLE "mettings" ADD COLUMN     "report" TEXT,
ADD COLUMN     "specialityId" TEXT NOT NULL;

-- DropTable
DROP TABLE "personal_pet_vaccine";

-- CreateTable
CREATE TABLE "health_condition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "petId" TEXT NOT NULL,

    CONSTRAINT "health_condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owned_pet_health_condition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,
    "diagnosedAt" TIMESTAMP(3) NOT NULL,
    "healthConditionId" TEXT NOT NULL,
    "ownedPetId" TEXT NOT NULL,
    "mettingId" TEXT,
    "addedById" TEXT NOT NULL,

    CONSTRAINT "owned_pet_health_condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_health_condition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foodId" TEXT NOT NULL,
    "healthConditionId" TEXT NOT NULL,

    CONSTRAINT "food_health_condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owned_pet_vaccine" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownedPetId" TEXT NOT NULL,
    "vaccineId" TEXT NOT NULL,
    "mettingId" TEXT,

    CONSTRAINT "owned_pet_vaccine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "health_condition" ADD CONSTRAINT "health_condition_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_condition" ADD CONSTRAINT "owned_pet_health_condition_healthConditionId_fkey" FOREIGN KEY ("healthConditionId") REFERENCES "health_condition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_condition" ADD CONSTRAINT "owned_pet_health_condition_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_condition" ADD CONSTRAINT "owned_pet_health_condition_mettingId_fkey" FOREIGN KEY ("mettingId") REFERENCES "mettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_condition" ADD CONSTRAINT "owned_pet_health_condition_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_health_condition" ADD CONSTRAINT "food_health_condition_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_health_condition" ADD CONSTRAINT "food_health_condition_healthConditionId_fkey" FOREIGN KEY ("healthConditionId") REFERENCES "health_condition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccine" ADD CONSTRAINT "owned_pet_vaccine_ownedPetId_fkey" FOREIGN KEY ("ownedPetId") REFERENCES "owned_pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccine" ADD CONSTRAINT "owned_pet_vaccine_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_vaccine" ADD CONSTRAINT "owned_pet_vaccine_mettingId_fkey" FOREIGN KEY ("mettingId") REFERENCES "mettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mettings" ADD CONSTRAINT "mettings_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "speciality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
