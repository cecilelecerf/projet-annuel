import { ForbiddenError, NotFoundError } from "@api/errors";
import type { CreateAvailability, UpdateAvailability } from "@armali/schemas";
import { AvailabilityRepository } from "./availability.repository";

const availabilityRepository = new AvailabilityRepository();

export class AvailabilityService {
  async create({
    data,
    authorId,
    clinicId,
  }: {
    data: CreateAvailability;
    authorId: string;
    clinicId: string;
  }) {
    return availabilityRepository.create({
      data,
      authorId,
      clinicId,
    });
  }

  async update({
    id,
    data,
    userId,
  }: {
    id: string;
    data: UpdateAvailability;
    userId: string;
  }) {
    const existing = await availabilityRepository.findById(id);
    if (!existing) throw new NotFoundError("Disponibilité");
    if (existing.userId !== userId) throw new ForbiddenError();

    return availabilityRepository.update({ id, data });
  }

  async delete({ id, authorId }: { id: string; authorId: string }) {
    const existing = await availabilityRepository.findById(id);
    if (!existing) throw new NotFoundError("Disponibilité");
    if (authorId && existing.userId !== authorId) throw new ForbiddenError();

    return availabilityRepository.delete(id);
  }
}
