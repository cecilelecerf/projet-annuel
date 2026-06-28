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
      where: { OR: [{ meetingId: id }, { recurringId: id }] },
      include: {
        meeting: true,
        animal: {
          include: {
            client: { include: { user: { omit: { password: true } } } },
            race: { include: { pet: true } },
          },
        },
        speciality: true,
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
        description: data.description,
        petWeight: data.petWeight,
        petSize: data.petSize,
        report: data.report,
        speciality: data.specialityId
          ? { connect: { id: data.specialityId } }
          : { disconnect: true },
        meeting: {
          update: {
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
          },
        },
      },
      include: { meeting: true, animal: true },
    });
  }

  async delete(id: string) {
    return prisma.meetingBase.delete({ where: { id } });
  }

  async findByClient(userId: User["id"]) {
    return prisma.animalMeeting.findMany({
      where: { animal: { client: { user: { id: userId } } } },
      include: {
        animal: {
          include: {
            race: { include: { pet: true } },
          },
        },
        meeting: true,
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
