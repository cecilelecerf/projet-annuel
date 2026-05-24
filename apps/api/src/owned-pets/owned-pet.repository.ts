import { prisma } from "@api/lib/prisma";
import type { CreateOwnedPet, UpdateOwnedPet } from "@armali/schemas";

export class OwnedPetRepository {
  async findAll() {
    return prisma.ownedPet.findMany({
      include: { race: { include: { pet: true } }, client: true },
    });
  }

  async findByClientId(clientId: string) {
    return prisma.ownedPet.findMany({
      where: { clientId },
      include: { race: { include: { pet: true } } },
    });
  }

  async findById(id: string) {
    return prisma.ownedPet.findUnique({
      where: { id },
      include: {
        race: { include: { pet: true } },
        client: { include: { user: true } },
        ownedPetConditionHealths: {
          include: { healthCondition: true },
        },
        attendingVeterinarian: { include: { user: true } },
        ownedPetVaccine: true,
      },
    });
  }

  async create(data: CreateOwnedPet & { clientId: string }) {
    return prisma.ownedPet.create({
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        description: data.description,
        activity: data.activity,
        clientId: data.clientId,
        raceId: data.raceId,
        attendingVeterinarianId: data.attendingVeterinarianId,
      },
      include: { race: { include: { pet: true } } },
    });
  }

  async update(id: string, data: UpdateOwnedPet) {
    return prisma.ownedPet.update({
      where: { id },
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        description: data.description,
        activity: data.activity,
        raceId: data.raceId,
        attendingVeterinarianId: data.attendingVeterinarianId,
      },
      include: { race: { include: { pet: true } } },
    });
  }

  async delete(id: string) {
    return prisma.ownedPet.delete({ where: { id } });
  }
}
