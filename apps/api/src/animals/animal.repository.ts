import type { CreateAnimal, UpdateAnimal } from "@armali/schemas";
import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { vaccineDetailsInclude } from "@api/vaccines/vaccine.repository";

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
    include: vaccineDetailsInclude,
  },
  medicalHistory: {
    select: { performedAt: true, clinicActId: true },
  },
} satisfies Prisma.AnimalVaccineInclude;

export type AnimalVaccineWithDetails = Prisma.AnimalVaccineGetPayload<{
  include: typeof findVaccinesByAnimalInclude;
}>;

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

  // ── Boutique client (déplacé depuis shop/shop.repository.ts) ────────────

  async findClinicIdsForClient(clientUserId: string): Promise<string[]> {
    const animals = await this.prisma.animal.findMany({
      where: { clientId: clientUserId },
      select: {
        attendingVeterinarianClinic: { select: { clinicId: true } },
        animalMeeting: {
          select: {
            veterinarianClinic: { select: { clinicId: true } },
          },
        },
      },
    });

    const clinicIds = new Set<string>();
    for (const animal of animals) {
      if (animal.attendingVeterinarianClinic) {
        clinicIds.add(animal.attendingVeterinarianClinic.clinicId);
      }
      for (const meeting of animal.animalMeeting) {
        if (meeting.veterinarianClinic?.clinicId) {
          clinicIds.add(meeting.veterinarianClinic.clinicId);
        }
      }
    }
    return [...clinicIds];
  }

  async findNamesByClientId(clientId: string) {
    return this.prisma.animal.findMany({
      where: { clientId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async findOwnershipInfo(animalId: string) {
    return this.prisma.animal.findUnique({
      where: { id: animalId },
      select: { id: true, clientId: true, dateOfBirth: true, activity: true },
    });
  }
}