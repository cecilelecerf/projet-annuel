import type {
  CreateAnimalMeeting,
  AnimalId,
  UpdateAnimalMeeting,
  UserId,
  ClinicId,
} from "@armali/schemas";
import {
  User,
  VeterinarianClinic,
  Prisma,
  PrismaClient,
} from "../../../prisma/generated/prisma/client";
import { baseFilter } from "../meeting.repository";

const findByUserInclude = {
  animal: {
    include: {
      race: { include: { pet: true } },
      client: {
        include: {
          user: { omit: { password: true }, include: { avatar: true } },
        },
      },
      photo: true,
    },
  },
  meeting: true,
  speciality: true,
  veterinarianClinic: {
    include: {
      veterinarian: {
        include: {
          user: { omit: { password: true }, include: { avatar: true } },
        },
      },
      clinic: true,
    },
  },
} satisfies Prisma.AnimalMeetingInclude;

export type AnimalMeetingForUser = Prisma.AnimalMeetingGetPayload<{
  include: typeof findByUserInclude;
}>;

export class AnimalMeetingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.animalMeeting.findFirst({
      where: { OR: [{ meetingId: id }] },
      include: {
        meeting: true,
        animal: {
          include: {
            client: {
              include: {
                user: { omit: { password: true }, include: { avatar: true } },
              },
            },
            race: { include: { pet: true } },
          },
        },
        speciality: true,
        veterinarianClinic: {
          include: {
            veterinarian: { include: { user: { include: { avatar: true } } } },
            clinic: true,
          },
        },
      },
    });
  }

  async create({
    data,
    veterinarianClinicId,
  }: {
    data: CreateAnimalMeeting;
    veterinarianClinicId: VeterinarianClinic["id"];
  }) {
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
      include: {
        animalMeeting: {
          include: {
            animal: true,
            speciality: true,
          },
        },
      },
    });
  }

  async update({ id, data }: { id: string; data: UpdateAnimalMeeting }) {
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
      include: {
        meeting: true,
        animal: true,
      },
    });
  }

  async delete(id: string): Promise<Prisma.MeetingBaseGetPayload<object>> {
    return this.prisma.meetingBase.delete({ where: { id } });
  }

  async findByClient(userId: User["id"]) {
    return this.prisma.animalMeeting.findMany({
      where: {
        animal: { client: { user: { id: userId } } },
      },
      include: findByUserInclude,
    });
  }

  async findByAnimal(animalId: AnimalId): Promise<AnimalMeetingForUser[]> {
    return this.prisma.animalMeeting.findMany({
      where: { animalId },
      include: findByUserInclude,
    });
  }

  async findByClientAndClinic(clientId: UserId, clinicIds: ClinicId[]) {
    return this.prisma.animalMeeting.findMany({
      where: {
        animal: { clientId },
        veterinarianClinic: { clinicId: { in: clinicIds } },
      },
    });
  }

  async findByVeterinarian(vet: UserId) {
    return this.prisma.animalMeeting.findMany({
      where: {
        veterinarianClinic: {
          veterinarian: { id: vet },
        },
      },
      include: { meeting: true, speciality: true, animal: true },
    });
  }

  async findByVeterinarianAndClinic(
    vetProfileId: string,
    start: Date,
    end: Date,
    clinicIds: ClinicId[],
  ) {
    return this.prisma.animalMeeting.findMany({
      where: {
        veterinarianClinic: {
          veterinarian: { id: vetProfileId },
          clinicId: { in: clinicIds },
        },
      },
      include: {
        meeting: {
          where: { ...baseFilter(start, end), parentId: null },
          include: {
            animalMeeting: { include: { speciality: true } },
          },
        },
      },
    });
  }

  // TODO : pas le bon repo
  async findByClinic(clinicId: string, start: Date, end: Date) {
    return this.prisma.animalMeeting.findMany({
      where: { veterinarianClinic: { clinicId } },
      include: {
        meeting: {
          where: { ...baseFilter(start, end), parentId: null },
          include: {
            animalMeeting: { include: { speciality: true } },
          },
        },
      },
    });
  } // ── Boutique client  ────────────
  async findLatestWeight(animalId: string) {
    return this.prisma.animalMeeting.findFirst({
      where: { animalId, petWeight: { not: null } },
      orderBy: { meeting: { date: "desc" } },
      select: { petWeight: true },
    });
  }

  async findReminderCandidates(rangeStart: Date, rangeEnd: Date) {
    return this.prisma.animalMeeting.findMany({
      where: {
        reminderSentAt: null,
        meeting: { date: { gte: rangeStart, lte: rangeEnd }, kind: "ANIMAL" },
      },
      include: {
        meeting: true,
        animal: { include: { client: { include: { user: true } } } },
      },
    });
  }

  async markReminderSent(id: string) {
    return this.prisma.animalMeeting.update({
      where: { id },
      data: { reminderSentAt: new Date() },
    });
  }
}
