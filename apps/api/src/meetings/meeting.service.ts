import {
  AnimalMeeting,
  Availability,
  InternalMeeting,
  MeetingBase,
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
import { match } from "ts-pattern";
import { AnimalMeetingService } from "./animal-meeting";
import { MeetingBaseWithSpecific } from "./type";
import { flattenBase } from "./utils";
import { InternalMeetingService } from "./internal-meeting";
import { AvailabilityService } from "./availabilities";
import { ClinicService } from "@api/clinics/clinic.service";

const DEFAULT_SLOT_DURATION_MINUTES = 30;

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
      this.internalMeetingService.getInternalMeetings(
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
      this.internalMeetingService.getInternalMeetings(
        veterinarianId,
        start,
        end,
      ),
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
}
