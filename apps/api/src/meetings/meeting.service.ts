import type { Weekday, Frequency } from "rrule";
import RRuleLib from "rrule";
const { RRule, RRuleSet } = RRuleLib;
import {
  AnimalMeeting,
  Availability,
  Clinic,
  InternalMeeting,
  InternalMeetingParticipant,
  MeetingBase,
  MeetingReccuring,
} from "../../prisma/generated/prisma/client";
import { MeetingRepository } from "./meeting.repository";
import type { ClinicId, UserRole } from "@armali/schemas";
import { NotFoundError } from "@api/errors";
import { match } from "ts-pattern";

const DEFAULT_SLOT_DURATION_MINUTES = 30;

// ── Types ──────────────────────────────────────────────────────────────────────

type MeetingBaseWithSpecific = MeetingBase & {
  animalMeeting: AnimalMeeting | null;
  internalMeeting:
    | (InternalMeeting & { participants: InternalMeetingParticipant[] })
    | null;
  availabilty: (Availability & { clinic: Clinic }) | null;
};

type MeetingRecurringWithChildren = MeetingReccuring & {
  animalMeeting: AnimalMeeting | null;
  internalMeeting:
    | (InternalMeeting & { participants: InternalMeetingParticipant[] })
    | null;
  availabilty: (Availability & { clinic: Clinic }) | null;
  childrens: MeetingBaseWithSpecific[];
};

export type FlatMeeting = MeetingBase &
  (AnimalMeeting | InternalMeeting | Availability);

const RRULE_DAYS: Weekday[] = [
  RRule.SU,
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
];

const RRULE_FREQ: Record<string, Frequency> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
};

export class MeetingService {
  constructor(private repository: MeetingRepository) {}

  private isUpcoming(date: Date) {
    return new Date(date) >= new Date();
  }
  private isRecurring(
    m: MeetingBaseWithSpecific | MeetingRecurringWithChildren,
  ): m is MeetingRecurringWithChildren {
    return "dateStart" in m;
  }

  // ── Flatten ────────────────────────────────────────────────────────────────

  private flattenBase({
    animalMeeting,
    internalMeeting,
    availabilty,
    ...rest
  }: MeetingBaseWithSpecific): FlatMeeting {
    if (animalMeeting) return { ...animalMeeting, ...rest };
    if (internalMeeting) return { ...internalMeeting, ...rest };
    if (availabilty) return { ...availabilty, ...rest };
    throw new Error(`MeetingBase ${rest.id} has no specific type`);
  }

  flattenMeetingByBase(base: MeetingBaseWithSpecific): FlatMeeting {
    return this.flattenBase(base);
  }

  // ── Expand ─────────────────────────────────────────────────────────────────

  expandRecurring({
    reccuring,
    start,
    end,
  }: {
    reccuring: MeetingRecurringWithChildren;
    start: Date;
    end: Date;
  }) {
    const exceptionDates = (reccuring.childrens ?? [])
      .filter((c) => c.type === "EXCEPTION")
      .map((c) => c.date!)
      .filter(Boolean);

    const overrideMap = (reccuring.childrens ?? [])
      .filter((c) => c.type === "SPECIFIED")
      .reduce<Record<string, MeetingBaseWithSpecific>>((acc, c) => {
        const dateStr = c.date?.toISOString().split("T")[0];
        if (dateStr) acc[dateStr] = c as MeetingBaseWithSpecific;
        return acc;
      }, {});
    const freq = RRULE_FREQ[reccuring.frequency];
    const rule = new RRule({
      freq,
      byweekday: reccuring.dayOfWeek.map((d) => RRULE_DAYS[d]),
      dtstart: new Date(
        reccuring.dateStart.toISOString().split("T")[0] + "T00:00:00.000Z",
      ),
      until: new Date(
        reccuring.dateEnd.toISOString().split("T")[0] + "T23:59:59.000Z",
      ),
    });
    const ruleSet = new RRuleSet();
    ruleSet.rrule(rule);
    exceptionDates.forEach((d) => ruleSet.exdate(d));

    const occurrences = ruleSet.between(start, end, true);

    return occurrences.map((date) => {
      const dateStr = date.toISOString().split("T")[0];

      if (overrideMap[dateStr]) {
        return this.flattenBase(overrideMap[dateStr]);
      }

      let t: AnimalMeeting | InternalMeeting | Availability | undefined;
      if (reccuring.animalMeeting) t = reccuring.animalMeeting;
      else if (reccuring.internalMeeting) t = reccuring.internalMeeting;
      else if (reccuring.availabilty) t = reccuring.availabilty;

      if (!t)
        throw new Error(
          `RecurringMeetingBase ${reccuring.id} has no specific type`,
        );

      return {
        ...t,
        id: reccuring.id,
        parentId: reccuring.id,
        createdAt: reccuring.createdAt,
        updatedAt: reccuring.updatedAt,
        startTime: reccuring.startTime,
        endTime: reccuring.endTime,
        kind: reccuring.kind,
        date: new Date(dateStr + "T00:00:00.000Z"),
        type: "SPECIFIED" as const,
      };
    });
  }

  private expandAll(
    flat: (MeetingBaseWithSpecific | MeetingRecurringWithChildren)[],
    start: Date,
    end: Date,
  ): FlatMeeting[] {
    const recurrings: MeetingRecurringWithChildren[] = [];
    const nonRecurring: MeetingBaseWithSpecific[] = [];
    flat.forEach((item) => {
      if (this.isRecurring(item)) recurrings.push(item);
      else nonRecurring.push(item);
    });
    return [
      ...nonRecurring.map((m) => this.flattenBase(m)),
      ...recurrings.flatMap((m) =>
        this.expandRecurring({ reccuring: m, start, end }),
      ),
    ];
  }

  // ── Par ressource ──────────────────────────────────────────────────────────

  async getInternalMeetings(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<FlatMeeting[]> {
    const participants = await this.repository.getInternalMeetings(
      userId,
      start,
      end,
    );
    const flat = participants.flatMap(
      ({
        meeting: { recurring, meeting },
      }): (MeetingBaseWithSpecific | MeetingRecurringWithChildren)[] => {
        if (recurring) return [recurring as MeetingRecurringWithChildren];
        if (meeting) return [meeting as MeetingBaseWithSpecific];
        return [];
      },
    );
    return this.expandAll(flat, start, end);
  }

  async getAnimalMeetingsAsVet(
    vetProfileId: string,
    start: Date,
    end: Date,
  ): Promise<FlatMeeting[]> {
    const meetings = await this.repository.getAnimalMeetingsAsVet(
      vetProfileId,
      start,
      end,
    );
    const flat = meetings.flatMap(({ meeting }): MeetingBaseWithSpecific[] => {
      if (!meeting) return [];
      return [meeting as MeetingBaseWithSpecific];
    });
    return this.expandAll(flat, start, end);
  }

  async getAnimalMeetingsAsClient(
    clientProfileId: string,
    start: Date,
    end: Date,
  ): Promise<FlatMeeting[]> {
    const meetings = await this.repository.getAnimalMeetingsAsClient(
      clientProfileId,
      start,
      end,
    );

    const flat = meetings.flatMap(({ meeting }): MeetingBaseWithSpecific[] => {
      if (meeting) return [meeting as MeetingBaseWithSpecific];
      return [];
    });

    return this.expandAll(flat, start, end);
  }

  async getAnimalMeetingsByClinic(
    clinicId: string,
    start: Date,
    end: Date,
  ): Promise<FlatMeeting[]> {
    const meetings = await this.repository.getAnimalMeetingsByClinic(
      clinicId,
      start,
      end,
    );
    const flat = meetings.flatMap(({ meeting }): MeetingBaseWithSpecific[] => {
      if (!meeting) return [];
      return [meeting as MeetingBaseWithSpecific];
    });
    return this.expandAll(flat, start, end);
  }

  async getAvailabilities({
    userId,
    start,
    end,
    clinicIds,
  }: {
    userId: string;
    start: Date;
    end: Date;
    clinicIds?: string[];
  }): Promise<FlatMeeting[]> {
    const avails = await this.repository.getAvailabilities({
      userId,
      start,
      end,
      clinicIds,
    });
    const flat = avails.flatMap(
      ({
        recurring,
        meeting,
      }): (MeetingBaseWithSpecific | MeetingRecurringWithChildren)[] => {
        if (recurring) return [recurring as MeetingRecurringWithChildren];
        if (meeting) return [meeting as MeetingBaseWithSpecific];
        return [];
      },
    );

    return this.expandAll(flat, start, end);
  }

  async getCalendar({
    userId,
    role,
    vetProfileId,
    clientProfileId,
    clinicIds,
    start,
    end,
  }: {
    userId: string;
    role: UserRole;
    vetProfileId?: string;
    clientProfileId?: string;
    clinicIds?: string[];
    start: Date;
    end: Date;
  }) {
    const [internal, animal, availabilities] = await Promise.all([
      this.getInternalMeetings(userId, start, end),

      match(role)
        .with("VETERINARIAN", () =>
          vetProfileId
            ? this.getAnimalMeetingsAsVet(vetProfileId, start, end)
            : Promise.resolve([]),
        )
        .with("CLIENT", () =>
          clientProfileId
            ? this.getAnimalMeetingsAsClient(clientProfileId, start, end)
            : Promise.resolve([]),
        )
        .otherwise(() => Promise.resolve([])),
      this.getAvailabilities({ userId, start, end, clinicIds }),
    ]);
    return {
      meetings: [...internal, ...animal],
      availabilities,
    };
  }

  async getMeeting(id: string): Promise<FlatMeeting> {
    const meeting = await this.repository.getMeetingById(id);
    if (!meeting) throw new NotFoundError("Meeting");
    return this.flattenMeetingByBase(meeting as MeetingBaseWithSpecific);
  }

  private overlaps(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  private sliceAvailabilityIntoSlots(
    availability: FlatMeeting,
    occupied: { start: Date; end: Date }[],
    slotDurationMinutes: number,
  ): { startTime: Date; endTime: Date }[] {
    const result: { startTime: Date; endTime: Date; date: Date }[] = [];
    const slotMs = slotDurationMinutes * 60 * 1000;

    let cursor = new Date(availability.startTime);
    const end = new Date(availability.endTime);

    while (cursor.getTime() + slotMs <= end.getTime()) {
      const slotEnd = new Date(cursor.getTime() + slotMs);
      const isTaken = occupied.some((o) =>
        this.overlaps(cursor, slotEnd, o.start, o.end),
      );

      if (!isTaken) {
        result.push({
          startTime: new Date(cursor),
          endTime: slotEnd,
          date: availability.date,
        });
      }

      cursor = slotEnd;
    }
    return result;
  }

  async getVetSlots({
    veterinarianId,
    start,
    end,
    slotDurationMinutes = DEFAULT_SLOT_DURATION_MINUTES,
    clinicIds,
  }: {
    veterinarianId: string;
    start: Date;
    end: Date;
    slotDurationMinutes?: number;
    clinicIds: ClinicId[];
  }) {
    const [availabilities, internal, animal] = await Promise.all([
      this.getAvailabilities({ userId: veterinarianId, start, end, clinicIds }),
      this.getInternalMeetings(veterinarianId, start, end),
      this.getAnimalMeetingsAsVet(veterinarianId, start, end),
    ]);

    const occupied = [...internal, ...animal].map((m) => ({
      start: new Date(m.startTime),
      end: new Date(m.endTime),
      date: new Date(m.date),
    }));

    return availabilities.flatMap((a) =>
      this.sliceAvailabilityIntoSlots(a, occupied, slotDurationMinutes),
    );
  }

  async getAvailabilityTimeline({
    veterinarianId,
    clinicIds,
    start,
    end,
  }: {
    veterinarianId: string;
    clinicIds: string[];
    start: Date;
    end: Date;
  }): Promise<{
    windows: { start: Date; end: Date }[];
    busy: { start: Date; end: Date }[];
  }> {
    const [availabilities, internal, animal] = await Promise.all([
      this.getAvailabilities({ userId: veterinarianId, start, end, clinicIds }),
      this.getInternalMeetings(veterinarianId, start, end),
      this.getAnimalMeetingsAsVet(veterinarianId, start, end),
    ]);
    const windows = availabilities.map((a) => ({
      start: new Date(a.startTime),
      end: new Date(a.endTime),
    }));

    const busy = [...internal, ...animal].map((m) => ({
      start: new Date(m.startTime),
      end: new Date(m.endTime),
    }));

    return { windows, busy };
  }
}
