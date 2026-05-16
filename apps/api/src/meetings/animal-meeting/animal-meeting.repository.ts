import { prisma } from "@api/lib/prisma";
import type { CreateAnimalMeeting, UpdateAnimalMeeting } from "@armali/schemas";

export class AnimalMeetingRepository {
  async findById(id: string) {
    return prisma.animalMeeting.findUnique({
      where: { id },
      include: {
        base: true,
        ownedPet: {
          include: {
            client: true,
          },
        },
        speciality: true,
      },
    });
  }

  async create({ data }: { data: CreateAnimalMeeting }) {
    return prisma.meetingBase.create({
      data: {
        type: data.type,
        kind: "ANIMAL",
        dayOfWeek: data.dayOfWeek,
        dateStart: data.dateStart,
        dateEnd: data.dateEnd,
        startTime: data.startTime,
        endTime: data.endTime,
        specificDate: data.specificDate,
        animalMeeting: {
          create: {
            description: data.description,
            specialityId: data.specialityId,
            ownedPetId: data.ownedPetId,
            veterinarianId: data.veterinarianId,
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
        base: {
          update: {
            dayOfWeek: data.dayOfWeek,
            dateStart: data.dateStart,
            dateEnd: data.dateEnd,
            startTime: data.startTime,
            endTime: data.endTime,
            specificDate: data.specificDate,
            type: data.type,
          },
        },
      },
      include: { base: true, ownedPet: true },
    });
  }

  async delete(id: string) {
    return prisma.meetingBase.delete({ where: { id } });
  }
}
