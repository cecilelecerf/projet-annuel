-- CreateEnum
CREATE TYPE "ActType" AS ENUM ('VACCINATION', 'SURGERY', 'HOSPITALIZATION', 'IMAGING', 'ANALYSIS', 'NURSING', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "AnesthesiaType" AS ENUM ('LOCAL', 'GENERAL', 'SEDATION');

-- CreateEnum
CREATE TYPE "ImagingType" AS ENUM ('XRAY', 'ULTRASOUND', 'SCANNER', 'MRI');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('BLOOD', 'URINE', 'STOOL', 'BIOPSY', 'CYTOLOGY', 'OTHER');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RECEIVED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClinicRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "ConversationScope" AS ENUM ('CLINIC', 'DIRECTOR_NETWORK');

-- CreateEnum
CREATE TYPE "ConversationMemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "FoodHealthConditionRecommendation" AS ENUM ('RECOMMENDED', 'AVOID');

-- CreateEnum
CREATE TYPE "MeetingKind" AS ENUM ('AVAILABILITY', 'INTERNAL', 'ANIMAL');

-- CreateEnum
CREATE TYPE "MeetingFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('SPECIFIED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "VaccineRuleType" AS ENUM ('MANDATORY', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('KIBBLE', 'WET');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'READY', 'PICKED_UP', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'SECRETARY', 'VETERINARIAN', 'DIRECTOR', 'REFERENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "MedicalVisitType" AS ENUM ('HIRING', 'PERIODIC', 'RETURN', 'SPONTANEOUS', 'PRE_RETIREMENT');

-- CreateEnum
CREATE TYPE "MedicalVisitResult" AS ENUM ('FIT', 'FIT_WITH_RESTRICTIONS', 'UNFIT_TEMPORARY', 'UNFIT');

-- CreateTable
CREATE TABLE "acts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ActType" NOT NULL,
    "basePrice" DECIMAL(8,2) NOT NULL,
    "vaccineId" TEXT,

    CONSTRAINT "acts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_acts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DECIMAL(8,2) NOT NULL,
    "actId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "clinic_acts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_medical_histories" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ActType" NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "priceApplied" DECIMAL(8,2),
    "animalMeetingId" TEXT,
    "actId" TEXT NOT NULL,
    "clinicActId" TEXT,
    "animalId" TEXT NOT NULL,

    CONSTRAINT "animal_medical_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surgeries" (
    "id" TEXT NOT NULL,
    "anesthesiaType" "AnesthesiaType" NOT NULL,
    "duration" INTEGER,
    "complications" TEXT,
    "postOpInstructions" TEXT,

    CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalizations" (
    "id" TEXT NOT NULL,
    "admittedAt" TIMESTAMP(3) NOT NULL,
    "dischargedAt" TIMESTAMP(3),
    "boxNumber" TEXT,

    CONSTRAINT "hospitalizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalization_reports" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,
    "weight" DECIMAL(5,2),
    "temperature" DECIMAL(4,2),
    "hospitalizationId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "hospitalization_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagings" (
    "id" TEXT NOT NULL,
    "imagingType" "ImagingType" NOT NULL,
    "bodyPart" TEXT,
    "findings" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "imagings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "analysisType" "AnalysisType" NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "laboratory" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "interpretation" TEXT,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "animalMeetingId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" INTEGER,
    "instructions" TEXT,
    "prescriptionId" TEXT NOT NULL,
    "clinicProductId" TEXT,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals_vaccines" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vaccineId" TEXT NOT NULL,
    "animalId" TEXT,

    CONSTRAINT "animals_vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT NOT NULL,
    "openingHours" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "directorId" TEXT NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ClinicRequestStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "description" TEXT,
    "directorId" TEXT NOT NULL,

    CONSTRAINT "clinic_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialities" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "specialities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_clinics" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "veterinarianId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "animalMedicalHistoryId" TEXT,

    CONSTRAINT "veterinarian_clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ConversationType" NOT NULL,
    "scope" "ConversationScope" NOT NULL,
    "name" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "clinicId" TEXT,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "ConversationMemberRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_conditions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "petId" TEXT NOT NULL,

    CONSTRAINT "health_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owned_pet_health_conditions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,
    "diagnosedAt" TIMESTAMP(3) NOT NULL,
    "healthConditionId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "meetingId" TEXT,
    "addedById" TEXT NOT NULL,

    CONSTRAINT "owned_pet_health_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_health_conditions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recommendation" "FoodHealthConditionRecommendation" NOT NULL,
    "foodId" TEXT NOT NULL,
    "healthConditionId" TEXT NOT NULL,

    CONSTRAINT "food_health_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_recurring" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateStart" DATE NOT NULL,
    "dateEnd" DATE NOT NULL,
    "frequency" "MeetingFrequency" NOT NULL DEFAULT 'WEEKLY',
    "dayOfWeek" SMALLINT[],
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "kind" "MeetingKind" NOT NULL,

    CONSTRAINT "meeting_recurring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_base" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ScheduleType" NOT NULL DEFAULT 'SPECIFIED',
    "date" DATE NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "kind" "MeetingKind" NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "meeting_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "recurringId" TEXT,
    "meetingId" TEXT,
    "userId" TEXT,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_meeting_participants" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL,

    CONSTRAINT "internal_meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recurringId" TEXT,
    "meetingId" TEXT,
    "adminId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "internal_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_meetings" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "petWeight" DECIMAL(5,2),
    "petSize" DECIMAL(5,2),
    "report" TEXT,
    "meetingId" TEXT,
    "specialityId" TEXT,
    "animalId" TEXT NOT NULL,
    "veterinarianClinicId" TEXT,

    CONSTRAINT "animal_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "activity" INTEGER,
    "outdoorAccess" BOOLEAN NOT NULL DEFAULT false,
    "animalContact" BOOLEAN NOT NULL DEFAULT false,
    "attendingVeterinarianId" TEXT,
    "clientId" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "picture" TEXT,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "petId" TEXT NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_country_rules" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "minAge" INTEGER NOT NULL,
    "type" "VaccineRuleType" NOT NULL,
    "vaccineId" TEXT NOT NULL,

    CONSTRAINT "vaccine_country_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccines" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recommendedAge" INTEGER NOT NULL,
    "boosterInterval" INTEGER NOT NULL,
    "petId" TEXT NOT NULL,

    CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_reviews" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "clientId" TEXT NOT NULL,
    "veterinarianClinicId" TEXT NOT NULL,

    CONSTRAINT "veterinarian_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "qrCode" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "picture" TEXT,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caloriesPer100" DECIMAL(65,30),
    "proteinPer100" DECIMAL(65,30),
    "fatPercentage" DECIMAL(65,30),
    "fiberPercentage" DECIMAL(65,30),
    "moisturePercentage" DECIMAL(65,30),
    "type" "FoodType" NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "logo" TEXT,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_products" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minimumRequired" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "clinicId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "clientProfileId" TEXT,

    CONSTRAINT "clinic_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_pets" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "day" SMALLINT NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3),
    "quantity" DECIMAL(65,30) NOT NULL,
    "hours" TIMESTAMP(3) NOT NULL,
    "foodId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,

    CONSTRAINT "food_pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "pickupAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "productClinicId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "email" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "picture" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_profiles" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "bio" TEXT,

    CONSTRAINT "veterinarian_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarian_identities" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "birthCity" TEXT,
    "birthDepartment" TEXT,
    "birthCountry" TEXT,
    "nationality" TEXT,
    "inseNumber" TEXT,
    "diploma" TEXT,
    "diplomaObtainedAt" TIMESTAMP(3),
    "rppsNumber" TEXT,
    "orderRegisteredAt" TIMESTAMP(3),
    "practiceAuthorization" BOOLEAN NOT NULL DEFAULT false,
    "proPhone" TEXT,
    "veterinarianId" TEXT NOT NULL,

    CONSTRAINT "veterinarian_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banking_infos" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iban" TEXT,
    "bic" TEXT,
    "domiciliation" TEXT,
    "beneficiary" TEXT,
    "veterinarianId" TEXT,
    "secretaryId" TEXT,
    "referentId" TEXT,

    CONSTRAINT "banking_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secretary_profiles" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "secretary_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "director_clinic_profiles" (
    "id" TEXT NOT NULL,

    CONSTRAINT "director_clinic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referent_clinic_profiles" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "referent_clinic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "_ClinicToSpeciality" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClinicToSpeciality_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ClinicToPet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClinicToPet_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SpecialityToVeterinarianProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SpecialityToVeterinarianProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PetToVeterinarianProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PetToVeterinarianProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MedicalVisitToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MedicalVisitToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "acts_vaccineId_key" ON "acts"("vaccineId");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_acts_actId_clinicId_key" ON "clinic_acts"("actId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "clinics_siret_key" ON "clinics"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "clinics_directorId_key" ON "clinics"("directorId");

-- CreateIndex
CREATE UNIQUE INDEX "specialities_name_key" ON "specialities"("name");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "conversation_members_userId_idx" ON "conversation_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_members_conversationId_userId_key" ON "conversation_members"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_recurringId_key" ON "availabilities"("recurringId");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_meetingId_key" ON "availabilities"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "internal_meetings_recurringId_key" ON "internal_meetings"("recurringId");

-- CreateIndex
CREATE UNIQUE INDEX "internal_meetings_meetingId_key" ON "internal_meetings"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "animal_meetings_meetingId_key" ON "animal_meetings"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "vaccine_country_rules_vaccineId_country_type_key" ON "vaccine_country_rules"("vaccineId", "country", "type");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_reviews_clientId_veterinarianClinicId_key" ON "veterinarian_reviews"("clientId", "veterinarianClinicId");

-- CreateIndex
CREATE UNIQUE INDEX "foods_productId_key" ON "foods"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_profiles_licenseNumber_key" ON "veterinarian_profiles"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarian_identities_veterinarianId_key" ON "veterinarian_identities"("veterinarianId");

-- CreateIndex
CREATE UNIQUE INDEX "banking_infos_veterinarianId_key" ON "banking_infos"("veterinarianId");

-- CreateIndex
CREATE UNIQUE INDEX "banking_infos_secretaryId_key" ON "banking_infos"("secretaryId");

-- CreateIndex
CREATE UNIQUE INDEX "banking_infos_referentId_key" ON "banking_infos"("referentId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "otp_codes_userId_idx" ON "otp_codes"("userId");

-- CreateIndex
CREATE INDEX "_ClinicToSpeciality_B_index" ON "_ClinicToSpeciality"("B");

-- CreateIndex
CREATE INDEX "_ClinicToPet_B_index" ON "_ClinicToPet"("B");

-- CreateIndex
CREATE INDEX "_SpecialityToVeterinarianProfile_B_index" ON "_SpecialityToVeterinarianProfile"("B");

-- CreateIndex
CREATE INDEX "_PetToVeterinarianProfile_B_index" ON "_PetToVeterinarianProfile"("B");

-- CreateIndex
CREATE INDEX "_MedicalVisitToUser_B_index" ON "_MedicalVisitToUser"("B");

-- AddForeignKey
ALTER TABLE "acts" ADD CONSTRAINT "acts_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_acts" ADD CONSTRAINT "clinic_acts_actId_fkey" FOREIGN KEY ("actId") REFERENCES "acts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_acts" ADD CONSTRAINT "clinic_acts_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_animalMeetingId_fkey" FOREIGN KEY ("animalMeetingId") REFERENCES "animal_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_actId_fkey" FOREIGN KEY ("actId") REFERENCES "acts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_clinicActId_fkey" FOREIGN KEY ("clinicActId") REFERENCES "clinic_acts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_medical_histories" ADD CONSTRAINT "animal_medical_histories_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalization_reports" ADD CONSTRAINT "hospitalization_reports_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "hospitalizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalization_reports" ADD CONSTRAINT "hospitalization_reports_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagings" ADD CONSTRAINT "imagings_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_animalMeetingId_fkey" FOREIGN KEY ("animalMeetingId") REFERENCES "animal_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_clinicProductId_fkey" FOREIGN KEY ("clinicProductId") REFERENCES "clinic_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals_vaccines" ADD CONSTRAINT "animals_vaccines_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals_vaccines" ADD CONSTRAINT "animals_vaccines_id_fkey" FOREIGN KEY ("id") REFERENCES "animal_medical_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals_vaccines" ADD CONSTRAINT "animals_vaccines_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "director_clinic_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_requests" ADD CONSTRAINT "clinic_requests_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "director_clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinics" ADD CONSTRAINT "veterinarian_clinics_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinics" ADD CONSTRAINT "veterinarian_clinics_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_clinics" ADD CONSTRAINT "veterinarian_clinics_animalMedicalHistoryId_fkey" FOREIGN KEY ("animalMedicalHistoryId") REFERENCES "animal_medical_histories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_conditions" ADD CONSTRAINT "health_conditions_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_healthConditionId_fkey" FOREIGN KEY ("healthConditionId") REFERENCES "health_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "animal_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_health_conditions" ADD CONSTRAINT "food_health_conditions_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_health_conditions" ADD CONSTRAINT "food_health_conditions_healthConditionId_fkey" FOREIGN KEY ("healthConditionId") REFERENCES "health_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_base" ADD CONSTRAINT "meeting_base_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "meeting_recurring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "meeting_recurring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_meeting_participants" ADD CONSTRAINT "internal_meeting_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "internal_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_meeting_participants" ADD CONSTRAINT "internal_meeting_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_meetings" ADD CONSTRAINT "internal_meetings_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "meeting_recurring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_meetings" ADD CONSTRAINT "internal_meetings_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_meetings" ADD CONSTRAINT "internal_meetings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_meetings" ADD CONSTRAINT "internal_meetings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_meetings" ADD CONSTRAINT "animal_meetings_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_meetings" ADD CONSTRAINT "animal_meetings_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "specialities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_meetings" ADD CONSTRAINT "animal_meetings_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_meetings" ADD CONSTRAINT "animal_meetings_veterinarianClinicId_fkey" FOREIGN KEY ("veterinarianClinicId") REFERENCES "veterinarian_clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_attendingVeterinarianId_fkey" FOREIGN KEY ("attendingVeterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_country_rules" ADD CONSTRAINT "vaccine_country_rules_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_reviews" ADD CONSTRAINT "veterinarian_reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_reviews" ADD CONSTRAINT "veterinarian_reviews_veterinarianClinicId_fkey" FOREIGN KEY ("veterinarianClinicId") REFERENCES "veterinarian_clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_products" ADD CONSTRAINT "clinic_products_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pets" ADD CONSTRAINT "food_pets_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_pets" ADD CONSTRAINT "food_pets_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productClinicId_fkey" FOREIGN KEY ("productClinicId") REFERENCES "clinic_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_profiles" ADD CONSTRAINT "veterinarian_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarian_identities" ADD CONSTRAINT "veterinarian_identities_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_infos" ADD CONSTRAINT "banking_infos_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "veterinarian_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_infos" ADD CONSTRAINT "banking_infos_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "secretary_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_infos" ADD CONSTRAINT "banking_infos_referentId_fkey" FOREIGN KEY ("referentId") REFERENCES "referent_clinic_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretary_profiles" ADD CONSTRAINT "secretary_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretary_profiles" ADD CONSTRAINT "secretary_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_clinic_profiles" ADD CONSTRAINT "director_clinic_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referent_clinic_profiles" ADD CONSTRAINT "referent_clinic_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referent_clinic_profiles" ADD CONSTRAINT "referent_clinic_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToSpeciality" ADD CONSTRAINT "_ClinicToSpeciality_A_fkey" FOREIGN KEY ("A") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToSpeciality" ADD CONSTRAINT "_ClinicToSpeciality_B_fkey" FOREIGN KEY ("B") REFERENCES "specialities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToPet" ADD CONSTRAINT "_ClinicToPet_A_fkey" FOREIGN KEY ("A") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicToPet" ADD CONSTRAINT "_ClinicToPet_B_fkey" FOREIGN KEY ("B") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialityToVeterinarianProfile" ADD CONSTRAINT "_SpecialityToVeterinarianProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "specialities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialityToVeterinarianProfile" ADD CONSTRAINT "_SpecialityToVeterinarianProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetToVeterinarianProfile" ADD CONSTRAINT "_PetToVeterinarianProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetToVeterinarianProfile" ADD CONSTRAINT "_PetToVeterinarianProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "veterinarian_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MedicalVisitToUser" ADD CONSTRAINT "_MedicalVisitToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "medical_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MedicalVisitToUser" ADD CONSTRAINT "_MedicalVisitToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
