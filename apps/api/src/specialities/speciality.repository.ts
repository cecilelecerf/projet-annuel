import type {
  ClinicId,
  CreateSpeciality,
  UpdateClinicSpecialities,
  UpdateSpeciality,
} from "@armali/schemas";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class SpecialityRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(search?: string) {
    return this.prisma.speciality.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      orderBy: { name: "asc" },
      take: 20,
    });
  }

  async findById(id: string) {
    return this.prisma.speciality.findUnique({ where: { id } });
  }

  async findByExactName(name: string) {
    return this.prisma.speciality.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  }

  async create(data: CreateSpeciality) {
    return this.prisma.speciality.create({ data });
  }

  async update(id: string, data: UpdateSpeciality) {
    return this.prisma.speciality.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.speciality.delete({ where: { id } });
  }

  async linkWithClinic({
    clinicId,
    data,
  }: {
    clinicId: ClinicId;
    data: UpdateClinicSpecialities;
  }) {
    return this.prisma.clinic.update({
      where: { id: clinicId },
      data: {
        specialities: {
          set: data.specialityIds.map((id) => ({ id })),
        },
      },
      include: { specialities: true },
    });
  }

  async findAllByClinicId({ clinicId }: { clinicId: ClinicId }) {
    return this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { specialities: true },
    });
  }
}
