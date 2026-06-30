import { prisma } from "@api/lib/prisma";
import type {
  CreateAnimalMeeting,
  AnimalId,
  UpdateAnimalMeeting,
} from "@armali/schemas";
import {
  User,
  VeterinarianClinic,
} from "../../../prisma/generated/prisma/client";

export class AnimalMeetingRepository {
  async findById(id: string) {
    return prisma.animalMeeting.findFirst({
      where: { OR: [{ meetingId: id }] },
      include: {
        meeting: true,
        animal: {
          include: {
            client: { include: { user: { omit: { password: true } } } },
            race: { include: { pet: true } },
          },
        },
        speciality: true,
        veterinarianClinic: { include: { veterinarian: true, clinic: true } },
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
    return prisma.meetingBase.create({
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
    return prisma.animalMeeting.update({
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
              data: {
                ...(data.date && { date: data.date }),
                ...(data.startTime && { startTime: data.startTime }),
                ...(data.endTime && { endTime: data.endTime }),
              },
            },
          },
        }),
      },
      include: { meeting: true, animal: true },
    });
  }

  async delete(id: string) {
    return prisma.meetingBase.delete({ where: { id } });
  }

  async findByUser(userId: User["id"]) {
    return prisma.animalMeeting.findMany({
      where: {
        animal: { client: { user: { id: userId } } },
      },
      include: {
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
      },
    });
  }

  async findByAnimal(animalId: AnimalId) {
    return prisma.animalMeeting.findMany({
      where: { animalId: animalId },
      include: {
        meeting: true,
        animalMedicalHistories: {
          include: { clinicAct: { include: { act: true } } },
        },
      },
    });
  }
}
