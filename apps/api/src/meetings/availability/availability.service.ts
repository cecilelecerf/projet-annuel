import { ForbiddenError, NotFoundError } from "@api/errors";
import type { CreateAvailability, UpdateAvailability } from "@armali/schemas";
import { AvailabilityRepository } from "./availability.repository";

const availabilityRepository = new AvailabilityRepository();

export class AvailabilityService {
  async create({ data, userId }: { data: CreateAvailability; userId: string }) {
    return availabilityRepository.create({ data, userId });
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

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await availabilityRepository.findById(id);
    if (!existing) throw new NotFoundError("Disponibilité");
    if (existing.userId !== userId) throw new ForbiddenError();

    return availabilityRepository.delete(id);
  }
}
