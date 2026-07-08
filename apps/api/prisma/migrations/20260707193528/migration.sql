/*
  Warnings:

  - A unique constraint covering the columns `[photoId]` on the table `animals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imageId]` on the table `brands` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatarId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "animals" ADD COLUMN     "photoId" TEXT;

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "imageId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "animals_photoId_key" ON "animals"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_imageId_key" ON "brands"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatarId_key" ON "users"("avatarId");

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
