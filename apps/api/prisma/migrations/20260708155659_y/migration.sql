/*
  Warnings:

  - You are about to drop the column `attendingVeterinarianId` on the `animals` table. All the data in the column will be lost.
  - You are about to drop the column `veterinarianId` on the `hospitalization_reports` table. All the data in the column will be lost.
  - Added the required column `veterinarianClinicId` to the `hospitalization_reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "animals" DROP CONSTRAINT "animals_attendingVeterinarianId_fkey";

-- DropForeignKey
ALTER TABLE "hospitalization_reports" DROP CONSTRAINT "hospitalization_reports_veterinarianId_fkey";

-- AlterTable
ALTER TABLE "animals" DROP COLUMN "attendingVeterinarianId",
ADD COLUMN     "attendingVeterinarianClinicId" TEXT;

-- AlterTable
ALTER TABLE "hospitalization_reports" DROP COLUMN "veterinarianId",
ADD COLUMN     "veterinarianClinicId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "hospitalization_reports" ADD CONSTRAINT "hospitalization_reports_veterinarianClinicId_fkey" FOREIGN KEY ("veterinarianClinicId") REFERENCES "veterinarian_clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_attendingVeterinarianClinicId_fkey" FOREIGN KEY ("attendingVeterinarianClinicId") REFERENCES "veterinarian_clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
