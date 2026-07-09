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

  // Trouve (ou signale l'absence d') un ClinicProduct pour incrémenter le
  // stock à la réception — un produit commandé chez un fournisseur peut ne
  // pas encore exister dans la boutique de la clinique.
  async findClinicProduct(clinicId: string, productId: string) {
    return this.prisma.clinicProduct.findFirst({
      where: { clinicId, productId },
    });
  }

  async incrementClinicProductStock(clinicProductId: string, quantity: number) {
    return this.prisma.clinicProduct.update({
      where: { id: clinicProductId },
      data: { stock: { increment: quantity } },
    });
  }

  // Crée l'entrée ClinicProduct si le produit reçu n'était pas encore au
  // catalogue de la clinique (stock initial = quantité reçue, prix de vente
  // et seuil minimum à 0 : à ajuster manuellement ensuite par le référent).
  async createClinicProduct(clinicId: string, productId: string, stock: number) {
    return this.prisma.clinicProduct.create({
      data: { clinicId, productId, stock, minimumRequired: 0, price: 0 },
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