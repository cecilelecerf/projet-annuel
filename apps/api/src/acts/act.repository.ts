import { prisma } from "@api/lib/prisma";
import type { CreateAct, UpdateAct } from "@armali/schemas";

export class ActRepository {
  async findAll() {
    return prisma.act.findMany({
      include: { clinicActs: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.act.findUnique({
      where: { id },
      include: { clinicActs: true },
    });
  }

  async create(data: CreateAct) {
    return prisma.act.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        basePrice: data.basePrice,
      },
    });
  }

  async update(id: string, data: UpdateAct) {
    return prisma.act.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        basePrice: data.basePrice,
      },
    });
  }

  async delete(id: string) {
    return prisma.act.delete({ where: { id } });
  }

  async findByMeeting(meetingId: string) {
    return prisma.animalMeetingAct.findMany({
      where: { animalMeetingId: meetingId },
      include: {
        clinicAct: { include: { act: true } },
        performedBy: {
          include: { veterinarian: { include: { user: true } } },
        },
        surgery: true,
        hospitalization: { include: { dailyReports: true } },
        imaging: true,
        analysis: true,
      },
      orderBy: { performedAt: "asc" },
    });
  }
}
