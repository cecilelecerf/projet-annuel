/*
  Warnings:

  - You are about to drop the column `secretaryProfileId` on the `client_profiles` table. All the data in the column will be lost.
  - Added the required column `medicationName` to the `prescription_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "prescription_items" DROP CONSTRAINT "prescription_items_clinicProductId_fkey";

-- AlterTable
ALTER TABLE "client_profiles" DROP COLUMN "secretaryProfileId";

-- AlterTable
ALTER TABLE "prescription_items" ADD COLUMN     "medicationName" TEXT NOT NULL,
ALTER COLUMN "clinicProductId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_clinicProductId_fkey" FOREIGN KEY ("clinicProductId") REFERENCES "clinic_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
