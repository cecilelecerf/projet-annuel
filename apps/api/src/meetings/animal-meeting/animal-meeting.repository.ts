import type {
  CreateAnimalMeeting,
  AnimalId,
  UpdateAnimalMeeting,
} from "@armali/schemas";
import {
  User,
  VeterinarianClinic,
  Prisma,
} from "../../../prisma/generated/prisma/client";
import { PrismaClient } from "@prisma/client/extension";

// ═══════════════════════════════════════════════════════════════
// Includes — définis une fois, réutilisés pour typer les retours
// ═══════════════════════════════════════════════════════════════

const findByIdInclude = {
  meeting: true,
  animal: {
    include: {
      client: { include: { user: { omit: { password: true } } } },
      race: { include: { pet: true } },
    },
  },
  speciality: true,
  veterinarianClinic: { include: { veterinarian: true, clinic: true } },
} satisfies Prisma.AnimalMeetingInclude;

const createInclude = {
  animalMeeting: {
    include: {
      animal: true,
      speciality: true,
    },
  },
} satisfies Prisma.MeetingBaseInclude;

const updateInclude = {
  meeting: true,
  animal: true,
} satisfies Prisma.AnimalMeetingInclude;

const findByUserInclude = {
  animal: {
    include: {
      race: { include: { pet: true } },
      client: { include: { user: { omit: { password: true } } } },
    },
  },
  meeting: true,
  speciality: true,
  veterinarianClinic: {
    include: {
      veterinarian: { include: { user: { omit: { password: true } } } },
      clinic: true,
    },
  },
} satisfies Prisma.AnimalMeetingInclude;

const findByAnimalInclude = {
  meeting: true,
  animalMedicalHistories: {
    include: { clinicAct: { include: { act: true } } },
  },
} satisfies Prisma.AnimalMeetingInclude;

// ═══════════════════════════════════════════════════════════════
// Types de sortie — dérivés des includes ci-dessus, exportables
// ═══════════════════════════════════════════════════════════════

export type AnimalMeetingWithDetails = Prisma.AnimalMeetingGetPayload<{
  include: typeof findByIdInclude;
}>;

export type CreatedAnimalMeeting = Prisma.MeetingBaseGetPayload<{
  include: typeof createInclude;
}>;

export type UpdatedAnimalMeeting = Prisma.AnimalMeetingGetPayload<{
  include: typeof updateInclude;
}>;

export type AnimalMeetingForUser = Prisma.AnimalMeetingGetPayload<{
  include: typeof findByUserInclude;
}>;

export type AnimalMeetingForAnimal = Prisma.AnimalMeetingGetPayload<{
  include: typeof findByAnimalInclude;
}>;

// ═══════════════════════════════════════════════════════════════
// Repository
// ═══════════════════════════════════════════════════════════════

export class AnimalMeetingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<AnimalMeetingWithDetails | null> {
    return this.prisma.animalMeeting.findFirst({
      where: { OR: [{ meetingId: id }] },
      include: findByIdInclude,
    });
  }

  async create({
    data,
    veterinarianClinicId,
  }: {
    data: CreateAnimalMeeting;
    veterinarianClinicId: VeterinarianClinic["id"];
  }): Promise<CreatedAnimalMeeting> {
    return this.prisma.meetingBase.create({
      data: {
        kind: "ANIMAL",
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        animalMeeting: {
          create: {
            description: data.description,
            specialityId: data.specialityId,
            animalId: data.animalId,
            veterinarianClinicId,
          },
        },
      },
      include: createInclude,
    });
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: UpdateAnimalMeeting;
  }): Promise<UpdatedAnimalMeeting> {
    return this.prisma.animalMeeting.update({
      where: { id },
      data: {
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.petWeight !== undefined && { petWeight: data.petWeight }),
        ...(data.petSize !== undefined && { petSize: data.petSize }),
        ...(data.report !== undefined && { report: data.report }),
        ...(data.specialityId !== undefined && {
          speciality: data.specialityId
            ? { connect: { id: data.specialityId } }
            : { disconnect: true },
        }),
        ...((data.date || data.startTime || data.endTime) && {
          meeting: {
            update: {
              ...(data.date && { date: data.date }),
              ...(data.startTime && { startTime: data.startTime }),
              ...(data.endTime && { endTime: data.endTime }),
            },
          },
        }),
      },
      include: updateInclude,
    });
  }

  async delete(id: string): Promise<Prisma.MeetingBaseGetPayload<object>> {
    return this.prisma.meetingBase.delete({ where: { id } });
  }

  async findByClient(userId: User["id"]): Promise<AnimalMeetingForUser[]> {
    return this.prisma.animalMeeting.findMany({
      where: {
        animal: { client: { user: { id: userId } } },
      },
      include: findByUserInclude,
    });
  }

  async findByAnimal(animalId: AnimalId): Promise<AnimalMeetingForAnimal[]> {
    return this.prisma.animalMeeting.findMany({
      where: { animalId: animalId },
      include: findByAnimalInclude,
    });
  }
}
