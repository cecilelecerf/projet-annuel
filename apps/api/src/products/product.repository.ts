import { randomUUID } from "crypto";
import type { CreateProduct, UpdateProduct } from "@armali/schemas";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: { brand: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { brand: true },
    });
  }

  async create(data: CreateProduct) {
    return this.prisma.product.create({
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
    return this.prisma.product.update({
      where: { id },
      data,
      include: { brand: true },
    });
  }

  async delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
