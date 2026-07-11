/*
  Warnings:

  - A unique constraint covering the columns `[userId,meetingId]` on the table `internal_meeting_participants` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "internal_meeting_participants_userId_meetingId_key" ON "internal_meeting_participants"("userId", "meetingId");
