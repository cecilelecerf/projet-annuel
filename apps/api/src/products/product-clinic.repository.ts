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

  // Utilisé à la réception d'une commande fournisseur : on cherche si ce
  // produit est déjà au catalogue de la clinique (pas via son id de ligne
  // ClinicProduct, mais via la paire clinique+produit).
  async findByClinicAndProduct(clinicId: string, productId: string) {
    return this.prisma.clinicProduct.findFirst({
      where: { clinicId, productId },
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

  // ── Boutique client (déplacé depuis shop/shop.repository.ts) ────────────
  async findByClinics(clinicIds: string[]) {
    return this.prisma.clinicProduct.findMany({
      where: { clinicId: { in: clinicIds } },
      include: {
        product: { include: { brand: true } },
        clinic: { select: { id: true, name: true } },
      },
      orderBy: { product: { name: "asc" } },
    });
  }

  async findByIdWithClinic(id: string) {
    return this.prisma.clinicProduct.findUnique({
      where: { id },
      include: {
        product: { include: { brand: true } },
        clinic: { select: { id: true, name: true } },
      },
    });
  }

  async findFoodProductsByClinics(clinicIds: string[]) {
    return this.prisma.clinicProduct.findMany({
      where: {
        clinicId: { in: clinicIds },
        product: { Food: { isNot: null } },
      },
      select: {
        id: true,
        product: {
          select: {
            Food: {
              select: {
                caloriesPer100: true,
                foodHealthConditions: {
                  select: { healthConditionId: true, recommendation: true },
                },
              },
            },
          },
        },
      },
    });
  }
}