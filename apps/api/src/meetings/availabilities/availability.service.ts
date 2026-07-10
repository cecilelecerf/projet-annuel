import { ConflictError, ForbiddenError, NotFoundError } from "@api/errors";
import type {
  ClinicId,
  CreateAvailability,
  MeetingRecurringId,
  UpdateAvailability,
  UserId,
  VeterinarianId,
} from "@armali/schemas";
import { AvailabilityRepository } from "./availability.repository";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { Availability, User } from "../../../prisma/generated/prisma/client";
import { match } from "ts-pattern";
import { RecurringService } from "../recurring-meeting/recurring-meeting.service";
import { FlatMeeting } from "../meeting.service";
import { MeetingBaseWithSpecific, MeetingRecurringWithChildren } from "../type";
import { expandAll } from "../utils";
import { InternalMeetingService } from "../internal-meeting";
import { AnimalMeetingService } from "../animal-meeting";
import { VeterinarianProfileRepository } from "@api/veterinarians/veterinarian-profile.repository";

export class AvailabilityService {
  constructor(
    private repository: AvailabilityRepository,
    private reccuringService: RecurringService,
    private internalMeetingService: InternalMeetingService,
    private animalMeetingService: AnimalMeetingService,
    private veterinarianRepository: VeterinarianProfileRepository,
  ) {}
  private overlaps(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  async create({
    data,
    authorId,
    clinicId,
  }: {
    data: CreateAvailability;
    authorId: string;
    clinicId: string;
  }) {
    const availability = await match(data)
      .with(
        { type: "RECURRING" },
        async (d) =>
          await this.repository.createRecurring({
            data: d,
            authorId,
            clinicId,
          }),
      )
      .with(
        { type: "EXCEPTION" },
        async (d) =>
          await this.repository.createExeption({
            data: d,
            authorId,
            clinicId,
          }),
      )
      .with(
        { type: "SPECIFIED" },
        async (d) =>
          await this.repository.createPunctual({
            data: d,
            authorId,
            clinicId,
          }),
      )
      .exhaustive();

    return availability;
  }

  async update({
    id,
    data,
    userId,
    role,
  }: {
    id: Availability["id"];
    data: UpdateAvailability;
    userId: string;
    role: UserRole;
  }): Promise<Availability> {
    const existing = await this.getById({ id, role, userId });
    if (!existing) throw new NotFoundError("Disponibilité");
    if (existing.userId !== userId) throw new ForbiddenError();
    await match(data)
      .with({ type: "PUNCTUAL" }, async (d) => {
        if (!existing.meetingId)
          throw new ConflictError("MeetingId doesn't exist");
        const { ...rest } = d;
        return await this.repository.updatePunctual({
          id: existing.meetingId,
          data: rest,
        });
      })
      .with({ type: "RECURRING" }, async (d) => {
        if (!existing.recurringId)
          throw new ConflictError("RecurringId doesn't exist");
        const { recurringId: _, type: __, ...rest } = d;
        return await this.reccuringService.update({
          id: existing.recurringId as MeetingRecurringId,
          data: rest,
        });
      })
      .exhaustive();
    return await this.getById({ id: existing.id, role, userId });
  }

  async delete({ id, authorId }: { id: string; authorId: string }) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundError("Disponibilité");
    if (authorId && existing.userId !== authorId) throw new ForbiddenError();

    return this.repository.delete(id);
  }

  async getAll({ userId, date }: { userId: User["id"]; date: Date }) {
    return await this.repository.findByUser({ userId, date });
  }

  async getById({
    id,
    role,
    userId,
  }: {
    id: string;
    role: UserRole;
    userId: User["id"];
  }) {
    if (role === "CLIENT") throw new ForbiddenError();

    const meeting = await this.repository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");
    if (meeting.userId !== userId) throw new ForbiddenError();

    return meeting;
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
    clinicIds?: ClinicId[];
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

    return expandAll(flat, start, end);
  }

  sliceAvailabilityIntoSlots(
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

  async getAvailabilityTimeline({
    veterinarianId,
    start,
    end,
  }: {
    veterinarianId: VeterinarianId;
    start: Date;
    end: Date;
    userId: UserId;
    role: UserRole;
  }): Promise<{
    windows: { start: Date; end: Date }[];
    busy: { start: Date; end: Date }[];
  }> {
    const veterinarian =
      await this.veterinarianRepository.findById(veterinarianId);
    if (!veterinarian) throw new NotFoundError("Veterinarian");
    const clinicIds = veterinarian.veterinarianClinics.map(
      (vc) => vc.clinicId as ClinicId,
    );
    const [availabilities, internal, animal] = await Promise.all([
      this.getAvailabilities({
        userId: veterinarianId,
        start,
        end,
        clinicIds,
      }),
      this.internalMeetingService.getInternalMeetings(
        veterinarianId,
        start,
        end,
        clinicIds,
      ),
      this.animalMeetingService.getAnimalMeetingsAsVet(
        veterinarianId,
        start,
        end,
        clinicIds,
      ),
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
