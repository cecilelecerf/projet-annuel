-- DropForeignKey
ALTER TABLE "internal_meeting_participants" DROP CONSTRAINT "internal_meeting_participants_meetingId_fkey";

-- AddForeignKey
ALTER TABLE "internal_meeting_participants" ADD CONSTRAINT "internal_meeting_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "internal_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
