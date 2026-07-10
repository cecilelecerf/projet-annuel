import {
  AnimalMeeting,
  Availability,
  InternalMeeting,
  MeetingBase,
  MeetingReccuring,
} from "../../prisma/generated/prisma/client";
import { MeetingRepository } from "./meeting.repository";
import type {
  ClinicId,
  MeetingId,
  UserId,
  UserRole,
  VeterinarianId,
} from "@armali/schemas";
import { NotFoundError } from "@api/errors";
import { AnimalMeetingService } from "./animal-meeting";
import { MeetingBaseWithSpecific } from "./type";
import { flattenBase } from "./utils";
import { InternalMeetingService } from "./internal-meeting";
import { AvailabilityService } from "./availabilities";
import { ClinicService } from "@api/clinics/clinic.service";
import { createEvents, EventAttributes } from "ics";
import dayjs from "dayjs";
import { RRULE_DAYS, RRULE_FREQ } from "./data";
import RRuleLib from "rrule";

const { RRule } = RRuleLib;
const DEFAULT_SLOT_DURATION_MINUTES = 30;
function toIcsDate(date: Date, time: Date) {
  const d = dayjs(date)
    .set("hour", time.getHours())
    .set("minute", time.getMinutes());

  return [d.year(), d.month() + 1, d.date(), d.hour(), d.minute()] as [
    number,
    number,
    number,
    number,
    number,
  ];
}

function toIcsDateTime(date: Date): [number, number, number, number, number] {
  const d = dayjs(date);

  return [d.year(), d.month() + 1, d.date(), d.hour(), d.minute()];
}
// ── Types ──────────────────────────────────────────────────────────────────────

export type FlatMeeting = MeetingBase &
  (AnimalMeeting | InternalMeeting | Availability);

export class MeetingService {
  constructor(
    private repository: MeetingRepository,
    private animalMeetingService: AnimalMeetingService,
    private internalMeetingService: InternalMeetingService,
    private availabilityService: AvailabilityService,
    private clinicService: ClinicService,
  ) {}

  flattenMeetingByBase(base: MeetingBaseWithSpecific): FlatMeeting {
    return flattenBase(base);
  }

  async getCalendar({
    userId,
    role,
    targetId,
    targetRole,
    start,
    end,
  }: {
    userId: UserId;
    targetId: UserId;
    targetRole: UserRole;
    role: UserRole;
    start: Date;
    end: Date;
  }) {
    const authorClinicIds = await this.clinicService.getClinicIdsByUserId({
      userId,
      role,
    });

    const animal =
      targetRole === "VETERINARIAN"
        ? await this.animalMeetingService.getAnimalMeetingsAsVet(
            targetId,
            start,
            end,
            authorClinicIds,
          )
        : [];

    const [internal, availabilities] = await Promise.all([
      this.internalMeetingService.getFlatsByUser(
        targetId,
        start,
        end,
        authorClinicIds,
      ),
      this.availabilityService.getAvailabilities({
        userId: targetId,
        start,
        end,
        clinicIds: authorClinicIds,
      }),
    ]);

    return {
      meetings: [...internal, ...animal],
      availabilities,
    };
  }

  async getMeetingById(id: MeetingId): Promise<FlatMeeting> {
    const meeting = await this.repository.findById(id);
    if (!meeting) throw new NotFoundError("Meeting");
    return this.flattenMeetingByBase(meeting as MeetingBaseWithSpecific);
  }

  async getVetSlots({
    veterinarianId,
    start,
    end,
    slotDurationMinutes = DEFAULT_SLOT_DURATION_MINUTES,
    clinicIds,
  }: {
    veterinarianId: VeterinarianId;
    start: Date;
    end: Date;
    slotDurationMinutes?: number;
    clinicIds: ClinicId[];
  }) {
    const [availabilities, internal, animal] = await Promise.all([
      this.availabilityService.getAvailabilities({
        userId: veterinarianId,
        start,
        end,
        clinicIds,
      }),
      this.internalMeetingService.getFlatsByUser(veterinarianId, start, end),
      this.animalMeetingService.getAnimalMeetingsAsVet(
        veterinarianId,
        start,
        end,
      ),
    ]);

    const occupied = [...internal, ...animal].map((m) => ({
      start: new Date(m.startTime),
      end: new Date(m.endTime),
      date: new Date(m.date),
    }));

    return availabilities.flatMap((a) =>
      this.availabilityService.sliceAvailabilityIntoSlots(
        a,
        occupied,
        slotDurationMinutes,
      ),
    );
  }

  async generateIcs(userId: UserId, role: UserRole) {
    const animalMeeting = await this.animalMeetingService.getAllByVet(userId);
    const events: EventAttributes[] = [];
    for (const meeting of animalMeeting) {
      if (!meeting || !meeting.meeting) continue;

      events.push({
        uid: meeting.meeting.id,
        title: meeting.speciality?.name ?? "Consultation générale",
        start: toIcsDate(meeting.meeting.date, meeting.meeting.startTime),
        duration: {
          minutes: dayjs(meeting.meeting.endTime).diff(
            meeting.meeting.startTime,
            "minutes",
          ),
        },
        description: `RDV avec : ${meeting.animal.name}\n${meeting.description ?? ""}`,
      });
    }

    const internalMeetings =
      await this.internalMeetingService.getAllByUser(userId);
    const speciefedInternal = internalMeetings.filter(
      (im) => im.meetingId && im.meeting && im.meeting?.type === "SPECIFIED",
    );

    speciefedInternal.forEach((meeting) => {
      if (!meeting.meeting) return;
      events.push({
        uid: meeting.id,
        title: meeting.title,
        start: toIcsDate(meeting.meeting.date, meeting.meeting.startTime),
        duration: {
          minutes: dayjs(meeting.meeting.endTime).diff(
            meeting.meeting.startTime,
            "minutes",
          ),
        },
        description: meeting.description ?? "",
      });
    });

    const recurrenceWithExclusion = internalMeetings.reduce<
      Record<
        string,
        {
          recurring: MeetingReccuring | null;
          internalMeeting: InternalMeeting;
          exclusions: MeetingBase[];
        }
      >
    >((acc, im) => {
      // Meeting spécifique indépendant
      if (im.meeting?.type === "SPECIFIED") {
        return acc;
      }

      // Création de la clé pour la récurrence
      if (im.recurringId) {
        acc[im.recurringId] ??= {
          recurring: im.recurring,
          internalMeeting: im,
          exclusions: [],
        };
      }

      // Override d'une occurrence
      if (im.meeting?.parentId && im.meeting.type === "EXCEPTION") {
        acc[im.meeting.parentId].exclusions.push(im.meeting);
      }

      return acc;
    }, {});

    Object.values(recurrenceWithExclusion).forEach((recurring) => {
      if (!recurring.recurring) return;
      const freq = RRULE_FREQ[recurring.recurring.frequency];
      const rule = new RRule({
        freq,
        byweekday: recurring.recurring.dayOfWeek.map((d) => RRULE_DAYS[d]),
        dtstart: new Date(
          dayjs(recurring.recurring.dateStart)
            .set("hour", recurring.recurring.startTime.getHours())
            .set("minute", recurring.recurring.startTime.getMinutes())
            .toISOString(),
        ),
        until: new Date(
          recurring.recurring.dateEnd.toISOString().split("T")[0] +
            "T23:59:59.000Z",
        ),
      });
      const firstOccurrence = rule.after(new Date(0), true);
      if (!firstOccurrence) return;
      const recurrenceRule = rule
        .toString()
        .split("\n")
        .find((line) => line.startsWith("RRULE:"))
        ?.replace("RRULE:", "");
      events.push({
        uid: recurring.recurring.id,
        title: recurring.internalMeeting.title ?? "",
        start: toIcsDate(firstOccurrence, recurring.recurring?.startTime),
        duration: {
          minutes: dayjs(recurring.recurring.endTime).diff(
            recurring.recurring.startTime,
            "minutes",
          ),
        },
        recurrenceRule,
        exclusionDates:
          recurring.exclusions.length > 0
            ? recurring.exclusions.map((d) => toIcsDateTime(d.date))
            : undefined,
      });
    });

    const { error, value } = createEvents(events);

    if (error) {
      throw error;
    }

    return value;
  }
}
