import { ForbiddenError, NotFoundError } from "@api/errors";
import { AnimalRepository } from "./animal.repository";
import type { CreateAnimal, UpdateAnimal, UserRole } from "@armali/schemas";

const STAFF_ROLES: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
];

const animalRepository = new AnimalRepository();

export class AnimalService {
  private isStaff(role: UserRole) {
    return STAFF_ROLES.includes(role);
  }

  private async assertAccess({
    petId,
    userId,
    role,
  }: {
    petId: string;
    userId: string;
    role: UserRole;
  }) {
    if (this.isStaff(role)) return;

    const pet = await animalRepository.findById(petId);
    if (!pet) throw new NotFoundError("Animal");
    if (pet.clientId !== userId) throw new ForbiddenError();
    return pet;
  }

  async getAll({ userId, role }: { userId: string; role: UserRole }) {
    if (this.isStaff(role)) return animalRepository.findAll();
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
    if (!this.isStaff(role) && targetUserId !== requesterId)
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
    if (!this.isStaff(role) && pet.clientId !== userId)
      throw new ForbiddenError();
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
    const clientId = this.isStaff(role)
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
}
