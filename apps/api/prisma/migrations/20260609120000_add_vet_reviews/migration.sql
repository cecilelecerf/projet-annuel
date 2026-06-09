-- CreateTable
CREATE TABLE "vet_reviews" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "clientId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "vet_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vet_reviews_clientId_veterinarianId_key" ON "vet_reviews"("clientId", "veterinarianId");

-- AddForeignKey
ALTER TABLE "vet_reviews" ADD CONSTRAINT "vet_reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_reviews" ADD CONSTRAINT "vet_reviews_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
