import { prisma } from "@api/lib/prisma";
import type { CreateAnimal, UpdateAnimal } from "@armali/schemas";

export class AnimalRepository {
  async findAll() {
    return prisma.animal.findMany({
      include: { race: { include: { pet: true } }, client: true },
    });
  }

  async findByClientId(clientId: string) {
    return prisma.animal.findMany({
      where: { clientId },
      include: { race: { include: { pet: true } } },
    });
  }

  async findById(id: string) {
    return prisma.animal.findUnique({
      where: { id },
      include: {
        race: { include: { pet: true } },
        client: { include: { user: true } },
        animalConditionHealths: {
          include: { healthCondition: true },
        },
        attendingVeterinarian: { include: { user: true } },
        animalVaccine: true,
      },
    });
  }

  async create(data: CreateAnimal & { clientId: string }) {
    return prisma.animal.create({
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

  async update(id: string, data: UpdateAnimal) {
    return prisma.animal.update({
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
    return prisma.animal.delete({ where: { id } });
  }
}
