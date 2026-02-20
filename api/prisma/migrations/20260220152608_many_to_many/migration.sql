/*
  Warnings:

  - You are about to drop the `clinic_pet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clinic_speciality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `food` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `veterinarian_pet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `veterinarian_speciality` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "clinic_pet" DROP CONSTRAINT "clinic_pet_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "clinic_pet" DROP CONSTRAINT "clinic_pet_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "clinic_speciality" DROP CONSTRAINT "clinic_speciality_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "clinic_speciality" DROP CONSTRAINT "clinic_speciality_speciality_id_fkey";

-- DropForeignKey
ALTER TABLE "food" DROP CONSTRAINT "food_productId_fkey";

-- DropForeignKey
ALTER TABLE "food_health_condition" DROP CONSTRAINT "food_health_condition_foodId_fkey";

-- DropForeignKey
ALTER TABLE "food_pet" DROP CONSTRAINT "food_pet_foodId_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_pet" DROP CONSTRAINT "veterinarian_pet_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_pet" DROP CONSTRAINT "veterinarian_pet_veterinarian_id_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_speciality" DROP CONSTRAINT "veterinarian_speciality_speciality_id_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_speciality" DROP CONSTRAINT "veterinarian_speciality_veterinarian_id_fkey";

-- DropTable
DROP TABLE "clinic_pet";

-- DropTable
DROP TABLE "clinic_speciality";

-- DropTable
DROP TABLE "food";

-- DropTable
DROP TABLE "veterinarian_pet";

-- DropTable
DROP TABLE "veterinarian_speciality";

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caloriesPer100" DECIMAL(65,30),
    "proteinPer100" DECIMAL(65,30),
    "fatPercentage" DECIMAL(65,30),
    "fiberPercentage" DECIMAL(65,30),
    "moisturePercentage" DECIMAL(65,30),
    "type" "FoodType" NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClinicToSpeciality" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClinicToSpeciality_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ClinicToPet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClinicToPet_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SpecialityToVeterinarianProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SpecialityToVeterinarianProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PetToVeterinarianProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PetToVeterinarianProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "foods_productId_key" ON "foods"("productId");

-- CreateIndex
CREATE INDEX "_ClinicToSpeciality_B_index" ON "_ClinicToSpeciality"("B");

-- CreateIndex
CREATE INDEX "_ClinicToPet_B_index" ON "_ClinicToPet"("B");

-- CreateIndex
CREATE INDEX "_SpecialityToVeterinarianProfile_B_index" ON "_SpecialityToVeterinarianProfile"("B");

-- CreateIndex
CREATE INDEX "_PetToVeterinarianProfile_B_index" ON "_PetToVeterinarianProfile"("B");

-- AddForeignKey
ALTER TABLE "food_health_condition" ADD CONSTRAINT "food_health_condition_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pet" ADD CONSTRAINT "food_pet_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToSpeciality" ADD CONSTRAINT "_ClinicToSpeciality_A_fkey" FOREIGN KEY ("A") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToSpeciality" ADD CONSTRAINT "_ClinicToSpeciality_B_fkey" FOREIGN KEY ("B") REFERENCES "speciality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToPet" ADD CONSTRAINT "_ClinicToPet_A_fkey" FOREIGN KEY ("A") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToPet" ADD CONSTRAINT "_ClinicToPet_B_fkey" FOREIGN KEY ("B") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialityToVeterinarianProfile" ADD CONSTRAINT "_SpecialityToVeterinarianProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "speciality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialityToVeterinarianProfile" ADD CONSTRAINT "_SpecialityToVeterinarianProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetToVeterinarianProfile" ADD CONSTRAINT "_PetToVeterinarianProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetToVeterinarianProfile" ADD CONSTRAINT "_PetToVeterinarianProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
