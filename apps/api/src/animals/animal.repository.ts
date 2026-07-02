import type { CreateAnimal, UpdateAnimal } from "@armali/schemas";
import { PrismaClient } from "@prisma/client/extension";

export class AnimalRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.animal.findMany({
      include: { race: { include: { pet: true } }, client: true },
    });
  }

  async findByClientId(clientId: string) {
    return this.prisma.animal.findMany({
      where: { clientId },
      include: { race: { include: { pet: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.animal.findUnique({
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
    return this.prisma.animal.create({
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
    return this.prisma.animal.update({
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
    return this.prisma.animal.delete({ where: { id } });
  }

  async findVaccinesByAnimal(animalId: string) {
    return this.prisma.animalVaccine.findMany({
      where: { animalId },
      include: {
        vaccine: {
          include: { act: true },
        },
        medicalHistory: {
          select: { performedAt: true, clinicActId: true },
        },
      },
      orderBy: { medicalHistory: { performedAt: "desc" } },
    });
  }
}
