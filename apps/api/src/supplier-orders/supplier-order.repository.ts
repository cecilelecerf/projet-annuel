import { PrismaClient } from "../../prisma/generated/prisma/client";

const WITH_DETAILS = {
  supplier: { select: { name: true } },
  items: {
    include: {
      product: { select: { name: true, picture: true } },
    },
  },
} as const;

export interface CreateSupplierOrderItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export class SupplierOrderRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    clinicId: string,
    supplierId: string,
    createdById: string,
    items: CreateSupplierOrderItemInput[],
  ) {
    return this.prisma.supplierOrder.create({
      data: {
        clinicId,
        supplierId,
        createdById,
        status: "PENDING",
        items: { create: items },
      },
      include: WITH_DETAILS,
    });
  }

  async findByClinic(clinicId: string, status?: string) {
    return this.prisma.supplierOrder.findMany({
      where: { clinicId, ...(status ? { status: status as never } : {}) },
      include: WITH_DETAILS,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.supplierOrder.findUnique({
      where: { id },
      include: WITH_DETAILS,
    });
  }

  async markReceived(id: string) {
    return this.prisma.supplierOrder.update({
      where: { id },
      data: { status: "RECEIVED", receivedAt: new Date() },
      include: WITH_DETAILS,
    });
  }

  async markCancelled(id: string) {
    return this.prisma.supplierOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: WITH_DETAILS,
    });
  }
}