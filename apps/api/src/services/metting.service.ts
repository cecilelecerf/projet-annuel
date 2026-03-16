import { MettingRepository } from "@api/repositories/calendar.repository";
import type {
  AnimalMetting,
  Availability,
  Clinic,
  InternalMetting,
  InternalMettingParticipant,
  MettingBase,
  ReferentClinicProfile,
  SecretaryProfile,
  User,
  VeterinarianClinic,
} from "apps/api/prisma/generated/prisma/client";

type MettingBaseWithExceptions = MettingBase & {
  exceptions: MettingBase[];
};

type AnimalMeetingWithBase = AnimalMetting & {
  base: MettingBaseWithExceptions;
};

type InternalMeetingWithBase = InternalMetting & {
  base: MettingBaseWithExceptions;
};
type AvailabilitiesWithBase = Availability & {
  base: MettingBaseWithExceptions;
};

type ParticipantWithMetting = InternalMettingParticipant & {
  metting: InternalMeetingWithBase;
};

export type FlatMetting = Omit<MettingBaseWithExceptions, never> &
  Partial<Omit<AnimalMetting, "id">> &
  Partial<Omit<InternalMetting, "id">> &
  Partial<Omit<AvailabilitiesWithBase, "id">> & {
    occurrenceDate?: Date;
  };

const mettingRepository = new MettingRepository();

export class MettingService {
  // ── Helpers privés ──────────────────────────────────────────────────────────

  private flattenMeeting({
    base,
    ...rest
  }:
    | AnimalMeetingWithBase
    | InternalMeetingWithBase
    | AvailabilitiesWithBase): FlatMetting {
    return { ...base, ...rest };
  }

  private extractInternalMeetings(
    participants: ParticipantWithMetting[],
  ): FlatMetting[] {
    return participants
      .filter((p) => p.metting)
      .map(({ metting }) => this.flattenMeeting(metting));
  }

  expandRecurring({
    metting,
    start,
    end,
  }: {
    metting: FlatMetting;
    start: Date;
    end: Date;
  }): FlatMetting[] {
    const occurrences: FlatMetting[] = [];
    const current = new Date(
      metting.dateStart!.toISOString().split("T")[0] + "T00:00:00.000Z",
    );

    const exceptionDates = metting.exceptions
      .filter((e) => e.type === "EXCEPTION")
      .map((e) => e.specificDate?.toISOString().split("T")[0])
      .filter((d): d is string => d !== undefined);

    while (current <= end) {
      if (current >= start && current.getUTCDay() === metting.dayOfWeek) {
        const dateStr = current.toISOString().split("T")[0];
        if (!exceptionDates.includes(dateStr)) {
          occurrences.push({
            ...metting,
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
    flat: FlatMetting[],
    start: Date,
    end: Date,
  ): FlatMetting[] {
    const recurring = flat.filter((m) => m.type === "RECURRING");
    const nonRecurring = flat.filter((m) => m.type !== "RECURRING");

    const expanded = recurring.flatMap((m) =>
      this.expandRecurring({ metting: m, start, end }),
    );
    return [...nonRecurring, ...expanded];
  }

  // ── Par rôle ────────────────────────────────────────────────────────────────

  async getMettingsForVeterinarian(
    id: VeterinarianClinic["id"],
    start: Date,
    end: Date,
  ) {
    const profile = await mettingRepository.getVeterinarianMeetings(
      id,
      start,
      end,
    );
    if (!profile) return null;

    const animalMeetings = profile.animalMeeting.map((m) =>
      this.flattenMeeting(m as AnimalMeetingWithBase),
    );
    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMettingParticipants as ParticipantWithMetting[],
    );
    return this.expandAll([...animalMeetings, ...internalMeetings], start, end);
  }

  async getMettingsForSecretary(
    id: SecretaryProfile["id"],
    start: Date,
    end: Date,
  ) {
    const profile = await mettingRepository.getSecretaryMeetings(
      id,
      start,
      end,
    );
    if (!profile) return null;

    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMettingParticipants as ParticipantWithMetting[],
    );

    return this.expandAll(internalMeetings, start, end);
  }

  async getMettingsForReferant(
    id: ReferentClinicProfile["id"],
    start: Date,
    end: Date,
  ) {
    const profile = await mettingRepository.getReferantMeetings(id, start, end);
    if (!profile) return null;

    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMettingParticipants as ParticipantWithMetting[],
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
    const profile = await mettingRepository.getAllAvailabilities({
      id,
      start,
      end,
    });
    if (!profile) return null;
    const availabilitiesUser: FlatMetting[] = profile.availabilities.map(
      this.flattenMeeting,
    );
    let availabilitiesVeto: FlatMetting[] = [];
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
    const profile = await mettingRepository.getAllAvailabilitiesByClinic({
      id,
      start,
      end,
      clinicId,
    });
    if (!profile) return null;

    const availabilities: FlatMetting[] = profile.availabilities.map(
      this.flattenMeeting,
    );
    let availabilitiesVeto: FlatMetting[] = [];
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
