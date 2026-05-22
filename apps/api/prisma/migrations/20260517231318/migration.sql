/*
  Warnings:

  - Added the required column `adminId` to the `internal_meetings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "internal_meetings" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "internal_meetings" ADD CONSTRAINT "internal_meetings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
