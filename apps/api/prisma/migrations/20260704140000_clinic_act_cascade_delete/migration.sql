-- Allow deleting a Clinic to cascade-delete its ClinicAct pricing rows
ALTER TABLE "clinic_acts" DROP CONSTRAINT "clinic_acts_clinicId_fkey";
ALTER TABLE "clinic_acts" ADD CONSTRAINT "clinic_acts_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
