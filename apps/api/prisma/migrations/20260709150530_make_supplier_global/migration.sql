/*
  Warnings:

  - You are about to drop the column `clinicId` on the `suppliers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_clinicId_fkey";

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "clinicId";
