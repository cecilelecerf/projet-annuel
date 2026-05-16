import { MeetingRepository } from ".";
import type {
  AnimalMeeting,
  Availability,
  Clinic,
  InternalMeeting,
  InternalMeetingParticipant,
  MeetingBase,
  ReferentClinicProfile,
  SecretaryProfile,
  User,
  VeterinarianClinic,
} from "apps/api/prisma/generated/prisma/client";

type MeetingBaseWithExceptions = MeetingBase & {
  exceptions: MeetingBase[];
};

type AnimalMeetingWithBase = AnimalMeeting & {
  base: MeetingBaseWithExceptions;
};

type InternalMeetingWithBase = InternalMeeting & {
  base: MeetingBaseWithExceptions;
};
type AvailabilitiesWithBase = Availability & {
  base: MeetingBaseWithExceptions;
};

type ParticipantWithMeeting = InternalMeetingParticipant & {
  meeting: InternalMeetingWithBase;
};

export type FlatMeeting = Omit<MeetingBaseWithExceptions, never> &
  Partial<Omit<AnimalMeeting, "id">> &
  Partial<Omit<InternalMeeting, "id">> &
  Partial<Omit<AvailabilitiesWithBase, "id">> & {
    occurrenceDate?: Date;
  };

const meetingRepository = new MeetingRepository();

export class MeetingService {
  // ── Helpers privés ──────────────────────────────────────────────────────────

  private flattenMeeting({
    base,
    ...rest
  }:
    | AnimalMeetingWithBase
    | InternalMeetingWithBase
    | AvailabilitiesWithBase): FlatMeeting {
    return { ...base, ...rest };
  }

  private extractInternalMeetings(
    participants: ParticipantWithMeeting[],
  ): FlatMeeting[] {
    return participants
      .filter((p) => p.meeting)
      .map(({ meeting }) => this.flattenMeeting(meeting));
  }

  expandRecurring({
    meeting: meeting,
    start,
    end,
  }: {
    meeting: FlatMeeting;
    start: Date;
    end: Date;
  }): FlatMeeting[] {
    const occurrences: FlatMeeting[] = [];
    const current = new Date(
      meeting.dateStart!.toISOString().split("T")[0] + "T00:00:00.000Z",
    );

    const exceptionDates = meeting.exceptions
      .filter((e) => e.type === "EXCEPTION")
      .map((e) => e.specificDate?.toISOString().split("T")[0])
      .filter((d): d is string => d !== undefined);

    while (current <= end) {
      if (current >= start && current.getUTCDay() === meeting.dayOfWeek) {
        const dateStr = current.toISOString().split("T")[0];
        if (!exceptionDates.includes(dateStr)) {
          occurrences.push({
            ...meeting,
            specificDate: new Date(dateStr + "T00:00:00.000Z"),
            occurrenceDate: new Date(dateStr + "T00:00:00.000Z"),
            type: "SPECIFIED" as const,
          });
        }
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return occurrences;
  }

  private expandAll(
    flat: FlatMeeting[],
    start: Date,
    end: Date,
  ): FlatMeeting[] {
    const recurring = flat.filter((m) => m.type === "RECURRING");
    const nonRecurring = flat.filter((m) => m.type !== "RECURRING");

    const expanded = recurring.flatMap((m) =>
      this.expandRecurring({ meeting: m, start, end }),
    );
    return [...nonRecurring, ...expanded];
  }

  // ── Par rôle ────────────────────────────────────────────────────────────────

  async getMeetingsForVeterinarian(
    id: VeterinarianClinic["id"],
    start: Date,
    end: Date,
  ) {
    const profile = await meetingRepository.getVeterinarianMeetings(
      id,
      start,
      end,
    );
    if (!profile) return null;

    const animalMeetings = profile.animalMeeting.map((m) =>
      this.flattenMeeting(m as AnimalMeetingWithBase),
    );
    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMeetingParticipants as ParticipantWithMeeting[],
    );
    return this.expandAll([...animalMeetings, ...internalMeetings], start, end);
  }

  async getMeetingsForSecretary(
    id: SecretaryProfile["id"],
    start: Date,
    end: Date,
  ) {
    const profile = await meetingRepository.getSecretaryMeetings(
      id,
      start,
      end,
    );
    if (!profile) return null;

    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMeetingParticipants as ParticipantWithMeeting[],
    );

    return this.expandAll(internalMeetings, start, end);
  }

  async getMeetingsForReferant(
    id: ReferentClinicProfile["id"],
    start: Date,
    end: Date,
  ) {
    const profile = await meetingRepository.getReferantMeetings(id, start, end);
    if (!profile) return null;

    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMeetingParticipants as ParticipantWithMeeting[],
    );

    return this.expandAll(internalMeetings, start, end);
  }
  async getAllAvailibilities({
    id,
    start,
    end,
  }: {
    id: User["id"];
    start: Date;
    end: Date;
  }) {
    const profile = await meetingRepository.getAllAvailabilities({
      id,
      start,
      end,
    });
    if (!profile) return null;
    const availabilitiesUser: FlatMeeting[] = profile.availabilities.map(
      this.flattenMeeting,
    );
    let availabilitiesVeto: FlatMeeting[] = [];
    if (profile.veterinarianProfile) {
      availabilitiesVeto =
        profile.veterinarianProfile.veterinarianClinic.flatMap(
          ({ availabilities }) => availabilities.map(this.flattenMeeting),
        );
    }
    return [
      ...this.expandAll(availabilitiesUser, start, end),
      ...this.expandAll(availabilitiesVeto, start, end),
    ];
  }
  async getAvailibilitiesByClinic({
    id,
    clinicId,
    start,
    end,
  }: {
    id: User["id"];
    clinicId: Clinic["id"];
    start: Date;
    end: Date;
  }) {
    const profile = await meetingRepository.getAllAvailabilitiesByClinic({
      id,
      start,
      end,
      clinicId,
    });
    if (!profile) return null;

    const availabilities: FlatMeeting[] = profile.availabilities.map(
      this.flattenMeeting,
    );
    let availabilitiesVeto: FlatMeeting[] = [];
    if (profile.veterinarianProfile) {
      availabilitiesVeto =
        profile.veterinarianProfile.veterinarianClinic.flatMap(
          ({ availabilities }) => availabilities.map(this.flattenMeeting),
        );
    }
    return [
      ...this.expandAll(availabilities, start, end),
      ...this.expandAll(availabilitiesVeto, start, end),
    ];
  }
}
