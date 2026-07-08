import type { CreateAnimal, UpdateAnimal } from "@armali/schemas";
import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaClient } from "../../prisma/generated/prisma/client";

// ═══════════════════════════════════════════════════════════════
// Includes — définis une fois, réutilisés pour typer les retours
// ═══════════════════════════════════════════════════════════════

const findAllInclude = {
  race: { include: { pet: true } },
  client: true,
} satisfies Prisma.AnimalInclude;

export type AnimalListItem = Prisma.AnimalGetPayload<{
  include: typeof findAllInclude;
}>;

const findByClientIdInclude = {
  race: { include: { pet: true } },
} satisfies Prisma.AnimalInclude;

export type AnimalForClient = Prisma.AnimalGetPayload<{
  include: typeof findByClientIdInclude;
}>;

const findByIdInclude = {
  race: { include: { pet: true } },
  client: { include: { user: { include: { avatar: true } } } },
  animalConditionHealths: {
    include: { healthCondition: true },
  },
  attendingVeterinarianClinic: {
    include: {
      veterinarian: { include: { user: { include: { avatar: true } } } },
      clinic: true,
    },
  },
  animalVaccine: true,
} satisfies Prisma.AnimalInclude;

export type AnimalWithDetails = Prisma.AnimalGetPayload<{
  include: typeof findByIdInclude;
}>;

const createAndUpdateInclude = {
  race: { include: { pet: true } },
} satisfies Prisma.AnimalInclude;

export type CreatedOrUpdatedAnimal = Prisma.AnimalGetPayload<{
  include: typeof createAndUpdateInclude;
}>;

const findVaccinesByAnimalInclude = {
  vaccine: {
    include: { act: true },
  },
  medicalHistory: {
    select: { performedAt: true, clinicActId: true },
  },
} satisfies Prisma.AnimalVaccineInclude;

export type AnimalVaccineWithDetails = Prisma.AnimalVaccineGetPayload<{
  include: typeof findVaccinesByAnimalInclude;
}>;

// ═══════════════════════════════════════════════════════════════
// Repository
// ═══════════════════════════════════════════════════════════════

export class AnimalRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<AnimalListItem[]> {
    return this.prisma.animal.findMany({
      include: findAllInclude,
    });
  }

  async findByClientId(clientId: string): Promise<AnimalForClient[]> {
    return this.prisma.animal.findMany({
      where: { clientId },
      include: findByClientIdInclude,
    });
  }

  async findById(id: string): Promise<AnimalWithDetails | null> {
    return this.prisma.animal.findUnique({
      where: { id },
      include: findByIdInclude,
    });
  }

  async create(
    data: CreateAnimal & { clientId: string },
  ): Promise<CreatedOrUpdatedAnimal> {
    return this.prisma.animal.create({
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        description: data.description,
        activity: data.activity,
        clientId: data.clientId,
        raceId: data.raceId,
        attendingVeterinarianClinicId: data.attendingVeterinarianClinicId,
      },
      include: createAndUpdateInclude,
    });
  }

  async update(
    id: string,
    data: UpdateAnimal,
  ): Promise<CreatedOrUpdatedAnimal> {
    return this.prisma.animal.update({
      where: { id },
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        description: data.description,
        activity: data.activity,
        raceId: data.raceId,
        attendingVeterinarianClinicId: data.attendingVeterinarianClinicId,
      },
      include: createAndUpdateInclude,
    });
  }

  async delete(id: string): Promise<Prisma.AnimalGetPayload<object>> {
    return this.prisma.animal.delete({ where: { id } });
  }

  async findVaccinesByAnimal(
    animalId: string,
  ): Promise<AnimalVaccineWithDetails[]> {
    return this.prisma.animalVaccine.findMany({
      where: { animalId },
      include: findVaccinesByAnimalInclude,
      orderBy: { medicalHistory: { performedAt: "desc" } },
    });
  }
}
