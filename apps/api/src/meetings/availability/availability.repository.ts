import { prisma } from "@api/lib/prisma";
import type { CreateAvailability, UpdateAvailability } from "@armali/schemas";

export class AvailabilityRepository {
  async findById(id: string) {
    return prisma.availability.findUnique({
      where: { id },
      include: { base: true },
    });
  }

  async create({ data, userId }: { data: CreateAvailability; userId: string }) {
    return prisma.meetingBase.create({
      data: {
        type: data.type,
        kind: "AVAILABILITY",
        dayOfWeek: data.dayOfWeek,
        dateStart: data.dateStart,
        dateEnd: data.dateEnd,
        startTime: data.startTime,
        endTime: data.endTime,
        specificDate: data.specificDate,
        availabilty: {
          create: {
            contextType: data.contextType,
            ...(data.contextType === "USER"
              ? { userId: data.userId }
              : { veterinarianClinicId: data.veterinarianClinicId }),
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
        dayOfWeek: data.dayOfWeek,
        dateStart: data.dateStart,
        dateEnd: data.dateEnd,
        startTime: data.startTime,
        endTime: data.endTime,
        specificDate: data.specificDate,
        type: data.type,
      },
      include: { availabilty: true },
    });
  }

  async delete(id: string) {
    return prisma.meetingBase.delete({ where: { id } });
  }
}
