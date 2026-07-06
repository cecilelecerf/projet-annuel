import type { CreateSpeciality, UpdateSpeciality } from "@armali/schemas";
import { PrismaClient } from "@prisma/client/extension";

export class SpecialityRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.speciality.findMany({
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return this.prisma.speciality.findUnique({
      where: { id },
    });
  }

  async create(data: CreateSpeciality) {
    return this.prisma.speciality.create({ data });
  }

  async update(id: string, data: UpdateSpeciality) {
    return this.prisma.speciality.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.speciality.delete({ where: { id } });
  }
}
