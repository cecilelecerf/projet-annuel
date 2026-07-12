/*
  Warnings:

  - A unique constraint covering the columns `[veterinarianId,clinicId]` on the table `veterinarian_clinics` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "veterinarian_clinics_id_clinicId_key";

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_clinics_veterinarianId_clinicId_key" ON "veterinarian_clinics"("veterinarianId", "clinicId");
