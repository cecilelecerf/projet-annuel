-- CreateEnum
CREATE TYPE "AvailabilityContextType" AS ENUM ('USER', 'VETERINARIAN_CLINIC');

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "contextType" "AvailabilityContextType" NOT NULL,
    "userId" TEXT,
    "veterinarianClinicId" TEXT,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_id_fkey" FOREIGN KEY ("id") REFERENCES "metting_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_veterinarianClinicId_fkey" FOREIGN KEY ("veterinarianClinicId") REFERENCES "veterinarian_clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
