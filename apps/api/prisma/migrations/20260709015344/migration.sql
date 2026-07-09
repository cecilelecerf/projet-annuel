-- DropForeignKey
ALTER TABLE "acts" DROP CONSTRAINT "acts_vaccineId_fkey";

-- DropForeignKey
ALTER TABLE "animals" DROP CONSTRAINT "animals_clientId_fkey";

-- DropForeignKey
ALTER TABLE "vaccines" DROP CONSTRAINT "vaccines_petId_fkey";

-- AddForeignKey
ALTER TABLE "acts" ADD CONSTRAINT "acts_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
