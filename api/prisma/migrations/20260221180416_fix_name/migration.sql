/*
  Warnings:

  - You are about to drop the column `client_id` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `clinic_id` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_at` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `product_clinic_id` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `unit_price` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `clinic_id` on the `veterinarian_clinic` table. All the data in the column will be lost.
  - You are about to drop the column `veterinarian_id` on the `veterinarian_clinic` table. All the data in the column will be lost.
  - You are about to drop the column `day_of_week` on the `veterinarian_clinic_average` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `veterinarian_clinic_average` table. All the data in the column will be lost.
  - You are about to drop the column `specific_date` on the `veterinarian_clinic_average` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `veterinarian_clinic_average` table. All the data in the column will be lost.
  - You are about to drop the column `veterinarian_clinic_id` on the `veterinarian_clinic_average` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[veterinarianId]` on the table `veterinarian_clinic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clinicId]` on the table `veterinarian_clinic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[veterinarianClinicId]` on the table `veterinarian_clinic_average` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productClinicId` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `veterinarian_clinic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `veterinarianId` to the `veterinarian_clinic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `veterinarian_clinic_average` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `veterinarian_clinic_average` table without a default value. This is not possible if the table is not empty.
  - Added the required column `veterinarianClinicId` to the `veterinarian_clinic_average` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_client_id_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_product_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_clinic" DROP CONSTRAINT "veterinarian_clinic_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_clinic" DROP CONSTRAINT "veterinarian_clinic_veterinarian_id_fkey";

-- DropForeignKey
ALTER TABLE "veterinarian_clinic_average" DROP CONSTRAINT "veterinarian_clinic_average_veterinarian_clinic_id_fkey";

-- DropIndex
DROP INDEX "veterinarian_clinic_clinic_id_key";

-- DropIndex
DROP INDEX "veterinarian_clinic_veterinarian_id_key";

-- DropIndex
DROP INDEX "veterinarian_clinic_average_veterinarian_clinic_id_key";

-- AlterTable
ALTER TABLE "order" DROP COLUMN "client_id",
DROP COLUMN "clinic_id",
DROP COLUMN "pickup_at",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "clinicId" TEXT NOT NULL,
ADD COLUMN     "pickupAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "order_item" DROP COLUMN "order_id",
DROP COLUMN "product_clinic_id",
DROP COLUMN "unit_price",
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "productClinicId" TEXT NOT NULL,
ADD COLUMN     "unitPrice" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "veterinarian_clinic" DROP COLUMN "clinic_id",
DROP COLUMN "veterinarian_id",
ADD COLUMN     "clinicId" TEXT NOT NULL,
ADD COLUMN     "veterinarianId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "veterinarian_clinic_average" DROP COLUMN "day_of_week",
DROP COLUMN "end_time",
DROP COLUMN "specific_date",
DROP COLUMN "start_time",
DROP COLUMN "veterinarian_clinic_id",
ADD COLUMN     "dayOfWeek" SMALLINT,
ADD COLUMN     "endTime" TIME(0) NOT NULL,
ADD COLUMN     "specificDate" DATE,
ADD COLUMN     "startTime" TIME(0) NOT NULL,
ADD COLUMN     "veterinarianClinicId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_clinic_veterinarianId_key" ON "veterinarian_clinic"("veterinarianId");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_clinic_clinicId_key" ON "veterinarian_clinic"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_clinic_average_veterinarianClinicId_key" ON "veterinarian_clinic_average"("veterinarianClinicId");

-- AddForeignKey
ALTER TABLE "veterinarian_clinic" ADD CONSTRAINT "veterinarian_clinic_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinic" ADD CONSTRAINT "veterinarian_clinic_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinic_average" ADD CONSTRAINT "veterinarian_clinic_average_veterinarianClinicId_fkey" FOREIGN KEY ("veterinarianClinicId") REFERENCES "veterinarian_clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_productClinicId_fkey" FOREIGN KEY ("productClinicId") REFERENCES "clinic_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
