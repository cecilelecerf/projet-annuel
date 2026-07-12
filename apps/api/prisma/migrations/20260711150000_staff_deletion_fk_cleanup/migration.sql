-- Permet de supprimer un compte membre du personnel (référent/secrétaire) même
-- s'il a des disponibilités, des réunions internes ou des messages liés :
-- ces données lui appartiennent et sont supprimées avec lui.

-- AlterTable: availabilities.userId — cascade
ALTER TABLE "availabilities" DROP CONSTRAINT "availabilities_userId_fkey";
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: internal_meeting_participants.userId — cascade
ALTER TABLE "internal_meeting_participants" DROP CONSTRAINT "internal_meeting_participants_userId_fkey";
ALTER TABLE "internal_meeting_participants" ADD CONSTRAINT "internal_meeting_participants_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: internal_meetings.adminId — cascade
ALTER TABLE "internal_meetings" DROP CONSTRAINT "internal_meetings_adminId_fkey";
ALTER TABLE "internal_meetings" ADD CONSTRAINT "internal_meetings_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: owned_pet_health_conditions.addedById — préserve le dossier
-- médical, perd juste l'attribution si l'auteur est supprimé.
ALTER TABLE "owned_pet_health_conditions" ALTER COLUMN "addedById" DROP NOT NULL;
ALTER TABLE "owned_pet_health_conditions" DROP CONSTRAINT "owned_pet_health_conditions_addedById_fkey";
ALTER TABLE "owned_pet_health_conditions" ADD CONSTRAINT "owned_pet_health_conditions_addedById_fkey"
  FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: conversations.createdById — préserve la conversation et les
-- messages des autres membres, perd juste l'attribution du créateur.
ALTER TABLE "conversations" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_createdById_fkey";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
