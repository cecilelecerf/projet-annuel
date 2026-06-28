-- DropForeignKey
ALTER TABLE "animal_medical_histories" DROP CONSTRAINT "animal_medical_histories_animalMeetingId_fkey";

-- DropForeignKey
ALTER TABLE "availabilities" DROP CONSTRAINT "availabilities_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "clinic_products" DROP CONSTRAINT "clinic_products_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "owned_pet_health_conditions" DROP CONSTRAINT "owned_pet_health_conditions_animalId_fkey";

-- DropForeignKey
ALTER TABLE "prescription_items" DROP CONSTRAINT "prescription_items_prescriptionId_fkey";

-- DropForeignKey
ALTER TABLE "prescriptions" DROP CONSTRAINT "prescriptions_animalMeetingId_fkey";

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_animalMeetingId_fkey" FOREIGN KEY ("animalMeetingId") REFERENCES "animal_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_animalMeetingId_fkey" FOREIGN KEY ("animalMeetingId") REFERENCES "animal_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
