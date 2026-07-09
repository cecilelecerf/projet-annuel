-- DropForeignKey
ALTER TABLE "races" DROP CONSTRAINT "races_petId_fkey";

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
