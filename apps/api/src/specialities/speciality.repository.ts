import { prisma } from "@api/lib/prisma";
import type { CreateSpeciality, UpdateSpeciality } from "@armali/schemas";
import { PrismaClient } from "@prisma/client/extension";

export class SpecialityRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(search?: string) {
    return prisma.speciality.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      orderBy: { name: "asc" },
      take: 20,
    });
  }

  async findById(id: string) {
    return prisma.speciality.findUnique({ where: { id } });
  }

  async findByExactName(name: string) {
    return prisma.speciality.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  }

  async create(data: CreateSpeciality) {
    return prisma.speciality.create({ data });
  }

  async update(id: string, data: UpdateSpeciality) {
    return prisma.speciality.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.speciality.delete({ where: { id } });
  }
}