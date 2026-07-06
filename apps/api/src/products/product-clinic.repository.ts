import { prisma } from "@api/lib/prisma";
import type {
  CreateProductClinic,
  UpdateProductClinic,
} from "@armali/schemas";
import { PrismaClient } from "@prisma/client/extension";

export class ProductClinicRepository {
  constructor(private prisma: PrismaClient) {}

  async findByClinic(clinicId: string) {
    return prisma.clinicProduct.findMany({
      where: { clinicId },
      include: { product: { include: { brand: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.clinicProduct.findUnique({
      where: { id },
      include: { product: { include: { brand: true } } },
    });
  }

  async create(data: CreateProductClinic) {
    return prisma.clinicProduct.create({
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
    return prisma.clinicProduct.update({
      where: { id },
      data,
      include: { product: { include: { brand: true } } },
    });
  }

  async incrementStock(id: string, quantity: number) {
    return prisma.clinicProduct.update({
      where: { id },
      data: { stock: { increment: quantity } },
      include: { product: { include: { brand: true } } },
    });
  }

  async delete(id: string) {
    return prisma.clinicProduct.delete({ where: { id } });
  }
}