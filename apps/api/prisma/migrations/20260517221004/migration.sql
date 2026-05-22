/*
  Warnings:

  - You are about to drop the column `veterinarianClinicId` on the `availabilities` table. All the data in the column will be lost.
  - Added the required column `clinicId` to the `availabilities` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "availabilities" DROP CONSTRAINT "availabilities_veterinarianClinicId_fkey";

-- AlterTable
ALTER TABLE "availabilities" DROP COLUMN "veterinarianClinicId",
ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
