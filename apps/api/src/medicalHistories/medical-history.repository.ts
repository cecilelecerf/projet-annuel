import { prisma } from "@api/lib/prisma";
import type {
  CreateMedicalHistory,
  UpdateMedicalHistory,
} from "@armali/schemas";
import {
  ActType,
  AnimalMeeting,
  Animal,
  VeterinarianClinic,
  Act,
} from "../../prisma/generated/prisma/client";

const meetingActInclude = {
  clinicAct: { include: { act: true } },
  performedBy: {
    include: { veterinarian: { include: { user: true } } },
  },
  surgery: true,
  hospitalization: { include: { dailyReports: true } },
  imaging: true,
  analysis: true,
  animalVaccine: true,
} as const;

export class AnimalMedicalHistoryRepository {
  async findByMeeting(meetingId: string) {
    return prisma.animalMedicalHistory.findMany({
      where: { animalMeeting: { meetingId } },
      include: meetingActInclude,
      orderBy: { performedAt: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.animalMedicalHistory.findUnique({
      where: { id },
      include: meetingActInclude,
    });
  }

  async create({
    animalMeetingId,
    performedBy,
    data,
    type,
    animalId,
    actId,
  }: {
    animalMeetingId: AnimalMeeting["id"];
    performedBy: VeterinarianClinic["id"][];
    data: CreateMedicalHistory;
    type: ActType;
    animalId: Animal["id"];
    actId: Act["id"];
  }) {
    return prisma.animalMedicalHistory.create({
      data: {
        performedAt: data.performedAt,
        notes: data.notes,
        priceApplied: data.priceApplied,
        animalMeetingId: animalMeetingId,
        clinicActId: data.clinicActId,
        type,
        animalId,
        actId: actId,
        performedBy: performedBy.length
          ? {
              connect: performedBy.map((veterinarianId) => ({
                id: veterinarianId,
              })),
            }
          : undefined,
        surgery: data.surgery ? { create: data.surgery } : undefined,
        hospitalization: data.hospitalization
          ? { create: data.hospitalization }
          : undefined,
        imaging: data.imaging ? { create: data.imaging } : undefined,
        analysis: data.analysis ? { create: data.analysis } : undefined,
        animalVaccine: data.animalVaccine
          ? {
              create: {
                vaccineId: data.animalVaccine.vaccineId,
                animalId,
              },
            }
          : undefined,
      },
      include: meetingActInclude,
    });
  }

  async update(id: string, data: UpdateMedicalHistory) {
    return prisma.animalMedicalHistory.update({
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
    return prisma.animalMedicalHistory.delete({ where: { id } });
  }
}
