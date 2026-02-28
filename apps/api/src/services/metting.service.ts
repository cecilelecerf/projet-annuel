import { MettingRepository } from "@api/repositories/metting.repository";
import {
  mettingWithExceptionSchema,
  type MettingWithException,
} from "@schemas";
import { z } from "zod";

const mettingRepository = new MettingRepository();

export class MettingService {
  // ── Helpers privés ──────────────────────────────────────────────────────────

  private flattenBase({ base, ...rest }: { base: any; [key: string]: any }) {
    return { ...base, ...rest };
  }

  private parseAndExpand(raw: any[], start: Date, end: Date) {
    const parsed = z.array(mettingWithExceptionSchema).parse(raw);

    const recurring = parsed.filter((m) => m.type === "RECURRING");
    const nonRecurring = parsed
      .filter((m) => m.type !== "RECURRING")
      .map(({ exceptions, ...m }) => m);

    const expandedRecurring = recurring
      .flatMap((m) => this.expandRecurring({ metting: m, start, end }))
      .map(({ exceptions, ...m }) => m);

    return [...nonRecurring, ...expandedRecurring];
  }

  private extractInternalMeetings(participants: any[]) {
    return participants
      .filter((p) => p.metting)
      .map(({ metting: { base, ...meeting } }) => ({ ...base, ...meeting }));
  }

  // ── Par rôle ────────────────────────────────────────────────────────────────

  async getCalendarForVeterinarian(id: string, start: Date, end: Date) {
    const profile = await mettingRepository.getVeterinarianMeetings(
      id,
      start,
      end,
    );
    if (!profile) return null;

    const animalMeetings = profile.animalMeeting.map(this.flattenBase);
    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMettingParticipants,
    );
    // TODO: availabilities quand tu en auras besoin
    // const availabilities = profile.veterinarianClinic.flatMap(vc => vc.availabilities.map(...))

    return this.parseAndExpand(
      [...animalMeetings, ...internalMeetings],
      start,
      end,
    );
  }

  async getCalendarForSecretary(id: string, start: Date, end: Date) {
    const profile = await mettingRepository.getSecretaryMeetings(
      id,
      start,
      end,
    );
    if (!profile) return null;

    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMettingParticipants,
    );

    return this.parseAndExpand(internalMeetings, start, end);
  }

  async getCalendarForReferant(id: string, start: Date, end: Date) {
    const profile = await mettingRepository.getReferantMeetings(id, start, end);
    if (!profile) return null;

    const internalMeetings = this.extractInternalMeetings(
      profile.user.internalMettingParticipants,
    );

    return this.parseAndExpand(internalMeetings, start, end);
  }

  // ── Expand recurring ────────────────────────────────────────────────────────

  expandRecurring({
    metting,
    start,
    end,
  }: {
    metting: MettingWithException;
    start: Date;
    end: Date;
  }) {
    const occurrences = [];
    const current = new Date(
      metting.dateStart!.toISOString().split("T")[0] + "T00:00:00.000Z",
    );

    const exceptionDates = metting.exceptions
      .filter((e) => e.type === "EXCEPTION")
      .map((e) => e.specificDate?.toISOString().split("T")[0])
      .filter(Boolean);

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
}
