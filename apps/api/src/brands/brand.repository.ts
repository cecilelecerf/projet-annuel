import { prisma } from "@api/lib/prisma";
import type { CreateBrand, UpdateBrand } from "@armali/schemas";
import { PrismaClient } from "@prisma/client/extension";

export class BrandRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(search?: string) {
    return prisma.brand.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      orderBy: { name: "asc" },
      take: 20,
    });
  }

  async findById(id: string) {
    return prisma.brand.findUnique({ where: { id } });
  }

  async findByExactName(name: string) {
    return prisma.brand.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  }

  async create(data: CreateBrand) {
    return prisma.brand.create({ data });
  }

  async update(id: string, data: UpdateBrand) {
    return prisma.brand.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.brand.delete({ where: { id } });
  }
}