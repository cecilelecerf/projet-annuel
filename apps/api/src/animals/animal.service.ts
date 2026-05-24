import { ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalRepository } from "./animal.repository";
import type { CreateAnimal, UpdateAnimal, UserRole } from "@armali/schemas";
import { isStaff, STAFF_ROLES } from "@api/utils";
import dayjs from "dayjs";

const animalRepository = new AnimalRepository();

export class AnimalService {
  private async assertAccess({
    petId,
    userId,
    role,
  }: {
    petId: string;
    userId: string;
    role: UserRole;
  }) {
    if (isStaff(role)) return;

    const pet = await animalRepository.findById(petId);
    if (!pet) throw new NotFoundError("Animal");
    if (pet.clientId !== userId) throw new ForbiddenError();
    return pet;
  }

  async getAll({ userId, role }: { userId: string; role: UserRole }) {
    if (isStaff(role)) return animalRepository.findAll();
    return animalRepository.findByClientId(userId);
  }
  async getByUser({
    targetUserId,
    requesterId,
    role,
  }: {
    targetUserId: string;
    requesterId: string;
    role: UserRole;
  }) {
    if (!isStaff(role) && targetUserId !== requesterId)
      throw new ForbiddenError();
    return animalRepository.findByClientId(targetUserId);
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
    const pet = await animalRepository.findById(id);
    if (!pet) throw new NotFoundError("Animal");
    if (!isStaff(role) && pet.clientId !== userId) throw new ForbiddenError();
    return pet;
  }

  async create({
    data,
    userId,
    role,
  }: {
    data: CreateAnimal;
    userId: string;
    role: UserRole;
  }) {
    const clientId = isStaff(role)
      ? ((data as any).clientId ?? userId)
      : userId;

    return animalRepository.create({ ...data, clientId });
  }

  async update({
    id,
    data,
    userId,
    role,
  }: {
    id: string;
    data: UpdateAnimal;
    userId: string;
    role: UserRole;
  }) {
    await this.assertAccess({ petId: id, userId, role });
    return animalRepository.update(id, data);
  }

  async delete({
    id,
    userId,
    role,
  }: {
    id: string;
    userId: string;
    role: UserRole;
  }) {
    await this.assertAccess({ petId: id, userId, role });
    return animalRepository.delete(id);
  }
  async getVaccinesByAnimal(animalId: string) {
    const vaccines = await animalRepository.findVaccinesByAnimal(animalId);

    return vaccines.map((v) => {
      const nextDue = dayjs(v.act?.performedAt).add(
        v.vaccine.boosterInterval,
        "week",
      );
      const isUpToDate = nextDue.isAfter(dayjs());
      const daysUntilDue = nextDue.diff(dayjs(), "day");

      return {
        ...v,
        nextDue: nextDue.toDate(),
        isUpToDate,
        daysUntilDue,
      };
    });
  }
}
