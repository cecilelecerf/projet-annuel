import { prisma } from "@api/lib/prisma";
import type {
  CreateAnimalMeetingAct,
  UpdateAnimalMeetingAct,
} from "@armali/schemas";

const meetingActInclude = {
  clinicAct: { include: { act: true } },
  performedBy: {
    include: { veterinarian: { include: { user: true } } },
  },
  surgery: true,
  hospitalization: { include: { dailyReports: true } },
  imaging: true,
  analysis: true,
} as const;

export class AnimalMeetingActRepository {
  async findByMeeting(meetingId: string) {
    return prisma.animalMeetingAct.findMany({
      where: { animalMeeting: { meetingId } },
      include: meetingActInclude,
      orderBy: { performedAt: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.animalMeetingAct.findUnique({
      where: { id },
      include: meetingActInclude,
    });
  }

  async create(data: CreateAnimalMeetingAct) {
    return prisma.animalMeetingAct.create({
      data: {
        performedAt: data.performedAt,
        notes: data.notes,
        priceApplied: data.priceApplied,
        animalMeetingId: data.animalMeetingId,
        clinicActId: data.clinicActId,
        performedBy: data.performedByIds?.length
          ? {
              create: data.performedByIds.map((veterinarianId) => ({
                veterinarianId,
              })),
            }
          : undefined,
        surgery: data.surgery ? { create: data.surgery } : undefined,
        hospitalization: data.hospitalization
          ? { create: data.hospitalization }
          : undefined,
        imaging: data.imaging ? { create: data.imaging } : undefined,
        analysis: data.analysis ? { create: data.analysis } : undefined,
      },
      include: meetingActInclude,
    });
  }

  async update(id: string, data: UpdateAnimalMeetingAct) {
    return prisma.animalMeetingAct.update({
      where: { id },
      data: {
        notes: data.notes,
        priceApplied: data.priceApplied,
        performedAt: data.performedAt,
        surgery: data.surgery
          ? { upsert: { create: data.surgery, update: data.surgery } }
          : undefined,
        hospitalization: data.hospitalization
          ? {
              upsert: {
                create: data.hospitalization,
                update: data.hospitalization,
              },
            }
          : undefined,
        imaging: data.imaging
          ? { upsert: { create: data.imaging, update: data.imaging } }
          : undefined,
        analysis: data.analysis
          ? { upsert: { create: data.analysis, update: data.analysis } }
          : undefined,
      },
      include: meetingActInclude,
    });
  }

  async delete(id: string) {
    return prisma.animalMeetingAct.delete({ where: { id } });
  }
}
