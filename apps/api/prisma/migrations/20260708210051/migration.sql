/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `analyses` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `imagings` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FileEntityType" ADD VALUE 'IMAGING';
ALTER TYPE "FileEntityType" ADD VALUE 'ANALYSIS';

-- AlterTable
ALTER TABLE "analyses" DROP COLUMN "fileUrl";

-- AlterTable
ALTER TABLE "imagings" DROP COLUMN "fileUrl";
