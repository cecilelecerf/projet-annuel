import { prisma } from "@api/lib/prisma";
import type { CreateAvailability, UpdateAvailability } from "@armali/schemas";

export class AvailabilityRepository {
  async findById(id: string) {
    return prisma.availability.findUnique({
      where: { id },
      include: { meeting: true, user: true, veterinarianClinic: true },
    });
  }

  async create({
    data,
    authorId,
    veterinarianClinicId,
  }: {
    data: CreateAvailability;
    authorId?: string;
    veterinarianClinicId?: string;
  }) {
    return prisma.meetingBase.create({
      data: {
        kind: "AVAILABILITY",
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        availabilty: {
          create: {
            userId: authorId,
            veterinarianClinicId: veterinarianClinicId,
          },
        },
      },
      include: { availabilty: true },
    });
  }

  async update({ id, data }: { id: string; data: UpdateAvailability }) {
    return prisma.meetingBase.update({
      where: { id },
      data: {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      },
      include: { availabilty: true },
    });
  }

  async delete(id: string) {
    return prisma.meetingBase.delete({ where: { id } });
  }
}
