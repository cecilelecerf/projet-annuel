import { prisma } from "@api/lib/prisma";

export const veterinarianClinicInclude = {
  veterinarian: {
    include: { user: true },
  },
  clinic: true,
} as const;

export class VeterinarianClinicRepository {
  async findAll() {
    return prisma.veterinarianClinic.findMany({
      include: veterinarianClinicInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.veterinarianClinic.findUnique({
      where: { id },
      include: veterinarianClinicInclude,
    });
  }

  async findByClinic(clinicId: string) {
    return prisma.veterinarianClinic.findMany({
      where: { clinicId },
      include: veterinarianClinicInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByVeterinarian(veterinarianId: string) {
    return prisma.veterinarianClinic.findMany({
      where: { veterinarianId },
      include: veterinarianClinicInclude,
    });
  }

  async findByVeterinarianAndClinic(veterinarianId: string, clinicId: string) {
    return prisma.veterinarianClinic.findFirst({
      where: { veterinarianId, clinicId },
      include: veterinarianClinicInclude,
    });
  }

  async create(veterinarianId: string, clinicId: string) {
    return prisma.veterinarianClinic.create({
      data: { veterinarianId, clinicId },
      include: veterinarianClinicInclude,
    });
  }

  async delete(id: string) {
    return prisma.veterinarianClinic.delete({ where: { id } });
  }
}
