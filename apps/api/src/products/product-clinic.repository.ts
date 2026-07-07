import type { CreateProductClinic, UpdateProductClinic } from "@armali/schemas";
import { PrismaClient } from "../../prisma/generated/prisma/client";

export class ProductClinicRepository {
  constructor(private prisma: PrismaClient) {}

  async findByClinic(clinicId: string) {
    return this.prisma.clinicProduct.findMany({
      where: { clinicId },
      include: { product: { include: { brand: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.clinicProduct.findUnique({
      where: { id },
      include: { product: { include: { brand: true } } },
    });
  }

  async create(data: CreateProductClinic) {
    return this.prisma.clinicProduct.create({
      data: {
        clinicId: data.clinicId,
        productId: data.productId,
        stock: data.stock,
        minimumRequired: data.minimumRequired,
        price: data.price,
      },
      include: { product: { include: { brand: true } } },
    });
  }

  async update(id: string, data: UpdateProductClinic) {
    return this.prisma.clinicProduct.update({
      where: { id },
      data,
      include: { product: { include: { brand: true } } },
    });
  }

  async incrementStock(id: string, quantity: number) {
    return this.prisma.clinicProduct.update({
      where: { id },
      data: { stock: { increment: quantity } },
      include: { product: { include: { brand: true } } },
    });
  }

  async delete(id: string) {
    return this.prisma.clinicProduct.delete({ where: { id } });
  }
}
