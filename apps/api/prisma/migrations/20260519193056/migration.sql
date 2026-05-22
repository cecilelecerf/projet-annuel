-- CreateEnum
CREATE TYPE "MeetingFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "meeting_recurring" ADD COLUMN     "frequency" "MeetingFrequency" NOT NULL DEFAULT 'WEEKLY';
