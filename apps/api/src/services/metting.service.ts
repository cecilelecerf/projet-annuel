import { MettingRepository } from "@api/repositories/metting.repository";
import type {
  AnimalMetting,
  InternalMetting,
  InternalMettingParticipant,
  MettingBase,
  ReferentClinicProfile,
  SecretaryProfile,
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

type ParticipantWithMetting = InternalMettingParticipant & {
  metting: InternalMeetingWithBase;
};

export type FlatMetting = Omit<MettingBaseWithExceptions, never> &
  Partial<Omit<AnimalMetting, "id">> &
  Partial<Omit<InternalMetting, "id">> & {
    occurrenceDate?: Date;
  };

const mettingRepository = new MettingRepository();

export class MettingService {
  // ── Helpers privés ──────────────────────────────────────────────────────────

  private flattenAnimalMeeting({
    base,
    ...rest
  }: AnimalMeetingWithBase): FlatMetting {
    return { ...base, ...rest };
  }

  private flattenInternalMeeting({
    base,
    ...rest
  }: InternalMeetingWithBase): FlatMetting {
    return { ...base, ...rest };
  }

  private extractInternalMeetings(
    participants: ParticipantWithMetting[],
  ): FlatMetting[] {
    return participants
      .filter((p) => p.metting)
      .map(({ metting }) => this.flattenInternalMeeting(metting));
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

  async getCalendarForVeterinarian(
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
      this.flattenAnimalMeeting(m as AnimalMeetingWithBase),
    );
    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMettingParticipants as ParticipantWithMetting[],
    );

    return this.expandAll([...animalMeetings, ...internalMeetings], start, end);
  }

  async getCalendarForSecretary(
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

  async getCalendarForReferant(
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
}
