import {
  AnimalMeeting,
  Availability,
  Clinic,
  InternalMeeting,
  InternalMeetingParticipant,
  MeetingBase,
  MeetingReccuring,
} from "../../prisma/generated/prisma/client";

export type MeetingBaseWithSpecific = MeetingBase & {
  animalMeeting: AnimalMeeting | null;
  internalMeeting:
    | (InternalMeeting & { participants: InternalMeetingParticipant[] })
    | null;
  availabilty: (Availability & { clinic: Clinic }) | null;
};

export type MeetingRecurringWithChildren = MeetingReccuring & {
  animalMeeting: AnimalMeeting | null;
  internalMeeting:
    | (InternalMeeting & { participants: InternalMeetingParticipant[] })
    | null;
  availabilty: (Availability & { clinic: Clinic }) | null;
  childrens: MeetingBaseWithSpecific[];
};
