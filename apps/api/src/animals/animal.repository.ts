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

// ═══════════════════════════════════════════════════════════════
// Repository
// ═══════════════════════════════════════════════════════════════

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
}
