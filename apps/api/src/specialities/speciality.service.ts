import { prisma } from "@api/lib/prisma";
import { ConflictError, NotFoundError } from "@api/errors";
import type { CreateSpeciality, UpdateSpeciality } from "@armali/schemas";

export class SpecialityService {
  async getAll() {
    return prisma.speciality.findMany({ orderBy: { name: "asc" } });
  }

  async create(data: CreateSpeciality) {
    const existing = await prisma.speciality.findUnique({
      where: { name: data.name },
    });
    if (existing) throw new ConflictError("Cette spécialité existe déjà");

    return prisma.speciality.create({ data });
  }

  async update(id: string, data: UpdateSpeciality) {
    const speciality = await prisma.speciality.findUnique({ where: { id } });
    if (!speciality) throw new NotFoundError("Spécialité");

    if (data.name && data.name !== speciality.name) {
      const existing = await prisma.speciality.findUnique({
        where: { name: data.name },
      });
      if (existing) throw new ConflictError("Cette spécialité existe déjà");
    }

    return prisma.speciality.update({ where: { id }, data });
  }

  async delete(id: string) {
    const speciality = await prisma.speciality.findUnique({ where: { id } });
    if (!speciality) throw new NotFoundError("Spécialité");

    await prisma.speciality.delete({ where: { id } });
    return { message: "Spécialité supprimée" };
  }
}
