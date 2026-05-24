import { prisma } from "@api/lib/prisma";
import type {
  CreateAnimalMeeting,
  OwnedPet,
  OwnedPetId,
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
        ownedPet: {
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
            ownedPetId: data.ownedPetId,
            veterinarianClinicId: veterinarianClinicId,
          },
        },
      },
      include: {
        animalMeeting: {
          include: {
            ownedPet: true,
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
      include: { meeting: true, ownedPet: true },
    });
  }

  async delete(id: string) {
    return prisma.meetingBase.delete({ where: { id } });
  }

  async findByClient(userId: User["id"]) {
    return prisma.animalMeeting.findMany({
      where: { ownedPet: { client: { user: { id: userId } } } },
      include: {
        ownedPet: {
          include: {
            race: { include: { pet: true } },
          },
        },
        meeting: true,
      },
    });
  }

  async findByAnimal(ownedPetId: OwnedPetId) {
    return prisma.animalMeeting.findMany({
      where: { ownedPetId: ownedPetId },
      include: {
        meeting: true,
        animalMeetingActs: {
          include: { clinicAct: { include: { act: true } } },
        },
      },
    });
  }
}
