import { randomUUID } from "crypto";
import { prisma } from "@api/lib/prisma";
import type { CreateProduct, UpdateProduct } from "@armali/schemas";
import { PrismaClient } from "@prisma/client/extension";

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return prisma.product.findMany({
      include: { brand: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { brand: true },
    });
  }

  async create(data: CreateProduct) {
    return prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        qrCode: data.qrCode ?? randomUUID(),
        websiteUrl: data.websiteUrl,
        picture: data.picture,
        brandId: data.brandId,
      },
      include: { brand: true },
    });
  }

  async update(id: string, data: UpdateProduct) {
    return prisma.product.update({
      where: { id },
      data,
      include: { brand: true },
    });
  }

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }
}