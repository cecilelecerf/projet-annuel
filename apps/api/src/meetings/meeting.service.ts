import {
  AnimalMeeting,
  Availability,
  InternalMeeting,
  InternalMeetingParticipant,
  MeetingBase,
  MeetingReccuring,
} from "../../prisma/generated/prisma/client";
import { MeetingRepository } from "./meeting.repository";
import type { UserRole } from "@armali/schemas";

// ── Types ──────────────────────────────────────────────────────────────────────

type MeetingBaseWithSpecific = MeetingBase & {
  animalMeeting: AnimalMeeting | null;
  internalMeeting:
    | (InternalMeeting & { participants: InternalMeetingParticipant[] })
    | null;
  availabilty: Availability | null;
};

type MeetingRecurringWithChildren = MeetingReccuring & {
  animalMeeting: AnimalMeeting | null;
  internalMeeting:
    | (InternalMeeting & { participants: InternalMeetingParticipant[] })
    | null;
  availabilty: Availability | null;
  childrens: MeetingBaseWithSpecific[];
};

export type FlatMeeting = MeetingBase &
  (AnimalMeeting | InternalMeeting | Availability);

const meetingRepository = new MeetingRepository();

export class MeetingService {
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
  }): FlatMeeting[] {
    const occurrences: FlatMeeting[] = [];
    const current = new Date(
      reccuring.dateStart.toISOString().split("T")[0] + "T00:00:00.000Z",
    );
    const rangeEnd = new Date(
      reccuring.dateEnd.toISOString().split("T")[0] + "T00:00:00.000Z",
    );

    const exceptionDates = (reccuring.childrens ?? [])
      .filter((c) => c.type === "EXCEPTION")
      .map((c) => c.date?.toISOString().split("T")[0])
      .filter(Boolean);

    const overrideMap = (reccuring.childrens ?? [])
      .filter((c) => c.type === "SPECIFIED")
      .reduce<Record<string, MeetingBaseWithSpecific>>((acc, c) => {
        const dateStr = c.date?.toISOString().split("T")[0];
        if (dateStr) acc[dateStr] = c as MeetingBaseWithSpecific;
        return acc;
      }, {});

    while (current <= rangeEnd) {
      if (current >= start && current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        const dow = current.getUTCDay();

        if (
          reccuring.dayOfWeek.includes(dow) &&
          !exceptionDates.includes(dateStr)
        ) {
          if (overrideMap[dateStr]) {
            occurrences.push(this.flattenBase(overrideMap[dateStr]));
          } else {
            let t: AnimalMeeting | InternalMeeting | Availability | undefined;
            if (reccuring.animalMeeting) t = reccuring.animalMeeting;
            else if (reccuring.internalMeeting) t = reccuring.internalMeeting;
            else if (reccuring.availabilty) t = reccuring.availabilty;
            if (!t)
              throw new Error(
                `RecurringMeetingBase ${reccuring.id} has no specific type`,
              );

            occurrences.push({
              ...t,
              id: reccuring.id,
              createdAt: reccuring.createdAt,
              updatedAt: reccuring.updatedAt,
              startTime: reccuring.startTime,
              endTime: reccuring.endTime,
              kind: reccuring.kind,
              date: new Date(dateStr + "T00:00:00.000Z"),
              type: "SPECIFIED",
              parentId: null,
            });
          }
        }
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return occurrences;
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
    const participants = await meetingRepository.getInternalMeetings(
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
    const meetings = await meetingRepository.getAnimalMeetingsAsVet(
      vetProfileId,
      start,
      end,
    );

    const flat = meetings.flatMap(
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

  async getAnimalMeetingsAsClient(
    clientProfileId: string,
    start: Date,
    end: Date,
  ): Promise<FlatMeeting[]> {
    const meetings = await meetingRepository.getAnimalMeetingsAsClient(
      clientProfileId,
      start,
      end,
    );

    const flat = meetings.flatMap(
      ({
        meeting,
        recurring,
      }): (MeetingBaseWithSpecific | MeetingRecurringWithChildren)[] => {
        if (recurring) return [recurring as MeetingRecurringWithChildren];
        if (meeting) return [meeting as MeetingBaseWithSpecific];
        return [];
      },
    );

    return this.expandAll(flat, start, end);
  }

  async getAvailabilities({
    userId,
    start,
    end,
  }: {
    userId: string;
    start: Date;
    end: Date;
  }): Promise<FlatMeeting[]> {
    const avails = await meetingRepository.getAvailabilities({
      userId,
      start,
      end,
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

  async getAvailabilitiesByClinic({
    clinicId,
    start,
    end,
  }: {
    clinicId: string;
    start: Date;
    end: Date;
  }): Promise<FlatMeeting[]> {
    const avails = await meetingRepository.getAvailabilitiesByClinic({
      clinicId,
      start,
      end,
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

  // ── Calendrier agrégé ──────────────────────────────────────────────────────

  async getCalendar({
    userId,
    role,
    vetProfileId,
    clientProfileId,
    clinicId,
    start,
    end,
  }: {
    userId: string;
    role: UserRole;
    vetProfileId?: string;
    clientProfileId?: string;
    clinicId?: string;
    start: Date;
    end: Date;
  }) {
    const [internal, animal, availabilities] = await Promise.all([
      this.getInternalMeetings(userId, start, end),
      role === "VETERINARIAN" && vetProfileId
        ? this.getAnimalMeetingsAsVet(vetProfileId, start, end)
        : role === "CLIENT" && clientProfileId
          ? this.getAnimalMeetingsAsClient(clientProfileId, start, end)
          : Promise.resolve([]),
      clinicId
        ? this.getAvailabilitiesByClinic({ clinicId, start, end })
        : this.getAvailabilities({ userId, start, end }),
    ]);

    return {
      meetings: [...internal, ...animal],
      availabilities,
    };
  }
}
