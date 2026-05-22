import { ForbiddenError, NotFoundError } from "@api/errors";
import { OwnedPetRepository } from "./owned-pet.repository";
import type { CreateOwnedPet, UpdateOwnedPet, UserRole } from "@armali/schemas";

const STAFF_ROLES: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "DIRECTOR",
  "REFERANT",
  "ADMIN",
];

const ownedPetRepository = new OwnedPetRepository();

export class OwnedPetService {
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

    const pet = await ownedPetRepository.findById(petId);
    if (!pet) throw new NotFoundError("Animal");
    if (pet.clientId !== userId) throw new ForbiddenError();
    return pet;
  }

  async getAll({ userId, role }: { userId: string; role: UserRole }) {
    if (this.isStaff(role)) return ownedPetRepository.findAll();
    return ownedPetRepository.findByClientId(userId);
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
    return ownedPetRepository.findByClientId(targetUserId);
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
    const pet = await ownedPetRepository.findById(id);
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
    data: CreateOwnedPet;
    userId: string;
    role: UserRole;
  }) {
    const clientId = this.isStaff(role)
      ? ((data as any).clientId ?? userId)
      : userId;

    return ownedPetRepository.create({ ...data, clientId });
  }

  async update({
    id,
    data,
    userId,
    role,
  }: {
    id: string;
    data: UpdateOwnedPet;
    userId: string;
    role: UserRole;
  }) {
    await this.assertAccess({ petId: id, userId, role });
    return ownedPetRepository.update(id, data);
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
    return ownedPetRepository.delete(id);
  }
}
