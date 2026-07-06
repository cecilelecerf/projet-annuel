/*
  Warnings:

  - A unique constraint covering the columns `[clinicId]` on the table `director_clinic_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "director_clinic_profiles_clinicId_key" ON "director_clinic_profiles"("clinicId");
