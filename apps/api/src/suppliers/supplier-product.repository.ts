import { PrismaClient } from "../../prisma/generated/prisma/client";

export class SupplierProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.supplierProduct.findUnique({ where: { id } });
  }

  async upsert(supplierId: string, productId: string, costPrice: number) {
    return this.prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId, productId } },
      update: { costPrice },
      create: { supplierId, productId, costPrice },
    });
  }

  async updateCost(id: string, costPrice: number) {
    return this.prisma.supplierProduct.update({
      where: { id },
      data: { costPrice },
    });
  }

  async delete(id: string) {
    return this.prisma.supplierProduct.delete({ where: { id } });
  }
}
