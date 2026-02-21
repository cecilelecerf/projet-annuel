-- DropForeignKey
ALTER TABLE "veterinarian_clinic" DROP CONSTRAINT "veterinarian_clinic_veterinarianId_fkey";

-- AddForeignKey
ALTER TABLE "veterinarian_clinic" ADD CONSTRAINT "veterinarian_clinic_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
