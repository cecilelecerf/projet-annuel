import type {
  AnimalId,
  CreateFreeMedicalHistory,
  CreateMettingMedicalHistory,
  UpdateMedicalHistory,
  VeterinarianClinicId,
} from "@armali/schemas";
import {
  ActType,
  AnimalMeeting,
  Animal,
  Act,
  AnimalMedicalHistory,
} from "../../prisma/generated/prisma/client";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const medicalHistoryInclude = {
  clinicAct: { include: { act: true } },
  act: true,
  performedBy: {
    include: {
      veterinarian: { include: { user: { include: { avatar: true } } } },
      clinic: true,
    },
  },
  surgery: true,
  hospitalization: { include: { dailyReports: true } },
  imaging: true,
  analysis: true,
  animalVaccine: true,
} as const;

export class AnimalMedicalHistoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findByClinic(clinicId: string) {
    return this.prisma.animalMedicalHistory.findMany({
      where: { clinicAct: { clinicId } },
      include: medicalHistoryInclude,
      orderBy: { performedAt: "asc" },
    });
  }

  async findByMeeting(meetingId: string) {
    return this.prisma.animalMedicalHistory.findMany({
      where: { animalMeeting: { meetingId } },
      include: medicalHistoryInclude,
      orderBy: { performedAt: "asc" },
    });
  }

  async findById(id: string) {
    return this.prisma.animalMedicalHistory.findUnique({
      where: { id },
      include: medicalHistoryInclude,
    });
  }

  async findByAnimalId(animalId: AnimalId) {
    return this.prisma.animalMedicalHistory.findMany({
      where: { animalId },
      include: medicalHistoryInclude,
      orderBy: { performedAt: "asc" },
    });
  }

  async create({
    data,
    animalMeetingId,
    animalId,
    actId,
    type,
    priceApplied,
    performedAt,
  }: {
    data:
      | (Pick<
          CreateMettingMedicalHistory,
          | "notes"
          | "clinicActId"
          | "surgery"
          | "hospitalization"
          | "imaging"
          | "analysis"
          | "vaccination"
          | "type"
        > & { performedById: VeterinarianClinicId })
      | Pick<
          CreateFreeMedicalHistory,
          | "notes"
          | "surgery"
          | "hospitalization"
          | "imaging"
          | "analysis"
          | "vaccination"
          | "type"
        >;
    animalMeetingId: AnimalMeeting["id"] | null;
    animalId: Animal["id"];
    actId: Act["id"];
    type: ActType;
  } & Pick<AnimalMedicalHistory, "priceApplied" | "performedAt">) {
    return this.prisma.animalMedicalHistory.create({
      data: {
        performedAt,
        notes: data.notes,
        priceApplied,
        animalMeetingId,
        clinicActId: data.type === "meeting" ? data.clinicActId : null,
        type,
        animalId,
        actId,
        performedById: data.type === "meeting" ? data.performedById : null,
        surgery: data.surgery ? { create: data.surgery } : undefined,
        hospitalization: data.hospitalization
          ? { create: data.hospitalization }
          : undefined,
        imaging: data.imaging ? { create: data.imaging } : undefined,
        analysis: data.analysis ? { create: data.analysis } : undefined,
        animalVaccine: data.vaccination
          ? {
              create: {
                vaccineId: data.vaccination.vaccineId,
                animalId,
              },
            }
          : undefined,
      },
      include: medicalHistoryInclude,
    });
  }

  /**
   * `clinicActId`/`type`/`priceApplied` sont recalculés côté service
   * (cohérence clinique, prix par défaut) puis passés ici tels quels —
   * le repository ne fait que persister.
   */
  async update(
    id: string,
    data: UpdateMedicalHistory,
    overrides?: { clinicActId?: string; type?: ActType },
  ) {
    return this.prisma.animalMedicalHistory.update({
      where: { id },
      data: {
        notes: data.notes,
        priceApplied: data.priceApplied,
        performedAt: data.performedAt,
        clinicActId: overrides?.clinicActId,
        type: overrides?.type,
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
        animalVaccine: data.vaccination
          ? {
              upsert: {
                create: { vaccineId: data.vaccination.vaccineId },
                update: { vaccineId: data.vaccination.vaccineId },
              },
            }
          : undefined,
      },
      include: medicalHistoryInclude,
    });
  }

  async delete(id: string) {
    return this.prisma.animalMedicalHistory.delete({ where: { id } });
  }
}
