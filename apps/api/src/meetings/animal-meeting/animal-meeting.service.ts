import { ForbiddenError, NotFoundError } from "@api/errors";
import type { CreateAnimalMeeting, UpdateAnimalMeeting } from "@armali/schemas";
import { AnimalMeetingRepository } from "./animal-meeting.repository";
import { UserRole } from "../../../prisma/generated/prisma/enums";

const animalMeetingRepository = new AnimalMeetingRepository();

export class AnimalMeetingService {
  async create({
    data,
    userId,
    role,
  }: {
    data: CreateAnimalMeeting;
    userId: string;
    role: UserRole;
  }) {
    return animalMeetingRepository.create({ data });
  }

  async getById({
    id,
    userId,
    role,
  }: {
    id: string;
    userId: string;
    role: UserRole;
  }) {
    const meeting = await animalMeetingRepository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    if (role === "CLIENT") {
      const isOwner = meeting.ownedPet.client.id === userId;
      if (!isOwner) throw new ForbiddenError();
    }

    return meeting;
  }

  async update({
    id,
    data,
    userId,
  }: {
    id: string;
    data: UpdateAnimalMeeting;
    userId: string;
  }) {
    const meeting = await animalMeetingRepository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    return animalMeetingRepository.update({ id: meeting.id, data });
  }

  async delete({ id }: { id: string }) {
    const meeting = await animalMeetingRepository.findById(id);
    if (!meeting) throw new NotFoundError("Rendez-vous");

    return animalMeetingRepository.delete(id);
  }
}
