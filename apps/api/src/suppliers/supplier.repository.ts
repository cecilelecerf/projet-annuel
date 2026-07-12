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
}
