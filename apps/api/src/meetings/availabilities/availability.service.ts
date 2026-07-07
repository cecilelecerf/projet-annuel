import { ConflictError, ForbiddenError, NotFoundError } from "@api/errors";
import type {
  CreateAvailability,
  MeetingRecurringId,
  UpdateAvailability,
} from "@armali/schemas";
import { AvailabilityRepository } from "./availability.repository";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { Availability, User } from "../../../prisma/generated/prisma/client";
import { match } from "ts-pattern";
import { RecurringService } from "../recurring-meeting/recurring-meeting.service";

export class AvailabilityService {
  constructor(
    private repository: AvailabilityRepository,
    private reccuringService: RecurringService,
  ) {}
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
    match(data)
      .with({ type: "PUNCTUAL" }, (d) => {
        if (!existing.meetingId)
          throw new ConflictError("MeetingId doesn't exist");
        const { ...rest } = d;
        return this.repository.updatePunctual({
          id: existing.meetingId,
          data: rest,
        });
      })
      .with({ type: "RECURRING" }, (d) => {
        if (!existing.recurringId)
          throw new ConflictError("RecurringId doesn't exist");
        const { recurringId: _, type: __, ...rest } = d;
        return this.reccuringService.update({
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
}
