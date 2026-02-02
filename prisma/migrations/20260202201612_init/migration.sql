/*
  Warnings:

  - You are about to drop the `Finance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Finance";

-- CreateTable
CREATE TABLE "test" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fiance" TEXT NOT NULL,

    CONSTRAINT "test_pkey" PRIMARY KEY ("id")
);
