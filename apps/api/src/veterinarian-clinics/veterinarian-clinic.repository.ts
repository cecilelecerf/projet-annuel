import { PrismaClient } from "../../prisma/generated/prisma/client";

export const veterinarianClinicInclude = {
  veterinarian: {
    include: { user: true },
  },
  clinic: true,
} as const;

export class VeterinarianClinicRepository {
  constructor(private prisma: PrismaClient) {}
  async findAll() {
    return this.prisma.veterinarianClinic.findMany({
      include: veterinarianClinicInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.veterinarianClinic.findUnique({
      where: { id },
      include: veterinarianClinicInclude,
    });
  }

  async findByClinic(clinicId: string) {
    return this.prisma.veterinarianClinic.findMany({
      where: { clinicId },
      include: veterinarianClinicInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByVeterinarian(veterinarianId: string) {
    return this.prisma.veterinarianClinic.findMany({
      where: { veterinarianId },
      include: veterinarianClinicInclude,
    });
  }

  async findByVeterinarianAndClinic(veterinarianId: string, clinicId: string) {
    return this.prisma.veterinarianClinic.findFirst({
      where: { veterinarianId, clinicId },
      include: veterinarianClinicInclude,
    });
  }

  async create(veterinarianId: string, clinicId: string) {
    return this.prisma.veterinarianClinic.create({
      data: { veterinarianId, clinicId },
      include: veterinarianClinicInclude,
    });
  }

  async delete(id: string) {
    return this.prisma.veterinarianClinic.delete({ where: { id } });
  }
}
