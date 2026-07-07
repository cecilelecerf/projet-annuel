import type { CreatePrescription, UpdatePrescription } from "@armali/schemas";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const prescriptionInclude = {
  items: {
    include: { clinicProduct: true },
  },
  veterinarian: {
    include: { user: true },
  },
} as const;

export class PrescriptionRepository {
  constructor(private prisma: PrismaClient) {}

  async findByMeeting(meetingId: string) {
    return this.prisma.prescription.findMany({
      where: { animalMeeting: { meetingId } },
      include: prescriptionInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: prescriptionInclude,
    });
  }

  async create(data: CreatePrescription) {
    return this.prisma.prescription.create({
      data: {
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        notes: data.notes,
        animalMeetingId: data.animalMeetingId,
        veterinarianId: data.veterinarianId,
        items: {
          create: data.items.map((item) => ({
            medicationName: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            clinicProductId: item.clinicProductId,
          })),
        },
      },
      include: prescriptionInclude,
    });
  }

  async update(id: string, data: UpdatePrescription) {
    return this.prisma.prescription.update({
      where: { id },
      data: {
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        notes: data.notes,
        ...(data.items && {
          items: {
            deleteMany: {},
            create: data.items.map((item) => ({
              medicationName: item.medicationName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
              clinicProductId: item.clinicProductId,
            })),
          },
        }),
      },
      include: prescriptionInclude,
    });
  }

  async delete(id: string) {
    return this.prisma.prescription.delete({ where: { id } });
  }
}
