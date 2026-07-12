import type {
  ClinicId,
  CreateAnimal,
  UpdateAnimal,
  VeterinarianId,
} from "@armali/schemas";
import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { vaccineDetailsInclude } from "@api/vaccines/vaccine.repository";
import { PaginationQueryDto } from "../../../../packages/schemas/src/pagination.schema";

// ═══════════════════════════════════════════════════════════════
// Includes — définis une fois, réutilisés pour typer les retours
// ═══════════════════════════════════════════════════════════════

const includeMeta = {
  race: { include: { pet: true } },
  client: { include: { user: { include: { avatar: true } } } },
  photo: true,
} satisfies Prisma.AnimalInclude;

export type AnimalWithMeta = Prisma.AnimalGetPayload<{
  include: typeof includeMeta;
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
  photo: true,
} satisfies Prisma.AnimalInclude;

export type AnimalWithDetails = Prisma.AnimalGetPayload<{
  include: typeof findByIdInclude;
}>;

const createAndUpdateInclude = {
  race: { include: { pet: true } },
  photo: true,
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

  async findAll() {
    return this.prisma.animal.findMany({
      include: includeMeta,
    });
  }

  async findByClientId(clientId: string): Promise<AnimalWithMeta[]> {
    return this.prisma.animal.findMany({
      where: { clientId },
      include: includeMeta,
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
        hasInsurance: data.hasInsurance,
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNumber: data.insurancePolicyNumber,
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
        hasInsurance: data.hasInsurance,
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNumber: data.insurancePolicyNumber,
      },
      include: createAndUpdateInclude,
    });
  }

  async delete(id: string): Promise<Prisma.AnimalGetPayload<object>> {
    return this.prisma.animal.delete({ where: { id } });
  }

  /** Marque l'animal comme décédé au lieu de le supprimer, pour conserver son historique médical. */
  async markDeceased(id: string): Promise<Prisma.AnimalGetPayload<object>> {
    return this.prisma.animal.update({
      where: { id },
      data: { status: "DECEASED" },
    });
  }

  async updatePhoto({
    animalId,
    photoId,
  }: {
    animalId: string;
    photoId: string;
  }): Promise<CreatedOrUpdatedAnimal> {
    return this.prisma.animal.update({
      where: { id: animalId },
      data: { photoId },
      include: createAndUpdateInclude,
    });
  }
  // TODO PAS AU BON ENDROIT -> repo animal doit renvoyer que des animals
  async findVaccinesByAnimal(
    animalId: string,
  ): Promise<AnimalVaccineWithDetails[]> {
    return this.prisma.animalVaccine.findMany({
      where: { animalId },
      include: findVaccinesByAnimalInclude,
      orderBy: { medicalHistory: { performedAt: "desc" } },
    });
  }

  async findPaginatedByAttendingVeterinarian(
    veterinarianId: VeterinarianId,
    pagination: PaginationQueryDto,
  ) {
    return await this.prisma.animal.findMany({
      where: { attendingVeterinarianClinic: { veterinarianId } },
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
      include: includeMeta,
      orderBy: { updatedAt: pagination.order },
    });
  }

  async countByAttendingVeterinarian(veterinarianId: VeterinarianId) {
    return this.prisma.animal.count({
      where: { attendingVeterinarianClinic: { veterinarianId } },
    });
  }

  async findPaginatedByAttendingClinic(
    clinicId: ClinicId,
    pagination: PaginationQueryDto,
  ) {
    return this.prisma.animal.findMany({
      where: { attendingVeterinarianClinic: { clinicId } },
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
      include: includeMeta,
      orderBy: { updatedAt: pagination.order },
    });
  }

  // ── Boutique client (déplacé depuis shop/shop.repository.ts) ────────────
  // TODO : delete du coup ?
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

  async findByEmergencyToken(token: string) {
    return this.prisma.animal.findUnique({
      where: { emergencyToken: token },
      include: {
        race: { include: { pet: true } },
        client: { include: { user: true } },
        animalConditionHealths: { include: { healthCondition: true } },
        attendingVeterinarianClinic: { include: { clinic: true } },
        photo: true,
      },
    });
  }
}
