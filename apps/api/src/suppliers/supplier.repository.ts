import { PrismaClient } from "../../prisma/generated/prisma/client";

const WITH_PRODUCTS = {
  supplierProducts: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          picture: true,
          brand: { select: { name: true } },
        },
      },
    },
  },
} as const;

export interface CreateSupplierInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export class SupplierRepository {
  constructor(private prisma: PrismaClient) {}

  // ── Supplier ──────────────────────────────────────────────────────────────

  async findAll() {
    return this.prisma.supplier.findMany({
      include: WITH_PRODUCTS,
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
      include: WITH_PRODUCTS,
    });
  }

  async create(data: CreateSupplierInput) {
    return this.prisma.supplier.create({
      data,
      include: WITH_PRODUCTS,
    });
  }

  async update(id: string, data: Partial<CreateSupplierInput>) {
    return this.prisma.supplier.update({
      where: { id },
      data,
      include: WITH_PRODUCTS,
    });
  }

  async delete(id: string) {
    return this.prisma.supplier.delete({ where: { id } });
  }

  // ── SupplierProduct ───────────────────────────────────────────────────────

  async findProductLink(id: string) {
    return this.prisma.supplierProduct.findUnique({ where: { id } });
  }

  async addProduct(supplierId: string, productId: string, costPrice: number) {
    return this.prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId, productId } },
      update: { costPrice },
      create: { supplierId, productId, costPrice },
    });
  }

  async updateProductCost(id: string, costPrice: number) {
    return this.prisma.supplierProduct.update({
      where: { id },
      data: { costPrice },
    });
  }

  async removeProduct(id: string) {
    return this.prisma.supplierProduct.delete({ where: { id } });
  }
}