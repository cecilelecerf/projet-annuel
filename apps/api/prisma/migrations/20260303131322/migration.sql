-- CreateEnum
CREATE TYPE "MedicalVisitType" AS ENUM ('HIRING', 'PERIODIC', 'RETURN', 'SPONTANEOUS', 'PRE_RETIREMENT');

-- CreateEnum
CREATE TYPE "MedicalVisitResult" AS ENUM ('FIT', 'FIT_WITH_RESTRICTIONS', 'UNFIT_TEMPORARY', 'UNFIT');

-- CreateTable
CREATE TABLE "medical_visits" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newVisitedAt" TIMESTAMP(3),
    "result" "MedicalVisitResult" NOT NULL,
    "restrictions" TEXT,
    "doctorName" TEXT NOT NULL,
    "doctorRpps" TEXT NOT NULL,
    "occupationalHealthService" TEXT NOT NULL,
    "certificateUrl" TEXT NOT NULL,

    CONSTRAINT "medical_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MedicalVisitToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MedicalVisitToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MedicalVisitToUser_B_index" ON "_MedicalVisitToUser"("B");

-- AddForeignKey
ALTER TABLE "_MedicalVisitToUser" ADD CONSTRAINT "_MedicalVisitToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "medical_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MedicalVisitToUser" ADD CONSTRAINT "_MedicalVisitToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
