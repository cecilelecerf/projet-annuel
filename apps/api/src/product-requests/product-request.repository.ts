import { prisma } from "@api/lib/prisma";
import type { CreateProductRequest } from "@armali/schemas";
import { PrismaClient } from "@prisma/client/extension";

const WITH_RELATIONS = {
  brand: true,
  requestedBy: {
    select: { firstname: true, lastname: true, email: true },
  },
  clinic: { select: { name: true } },
} as const;

export class ProductRequestRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(status?: "PENDING" | "APPROVED" | "REJECTED") {
    return prisma.productRequest.findMany({
      where: status ? { status } : undefined,
      include: WITH_RELATIONS,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByClinic(clinicId: string) {
    return prisma.productRequest.findMany({
      where: { clinicId },
      include: WITH_RELATIONS,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.productRequest.findUnique({
      where: { id },
      include: WITH_RELATIONS,
    });
  }

  async create(
    data: CreateProductRequest,
    requestedById: string,
    clinicId: string,
  ) {
    return prisma.productRequest.create({
      data: {
        name: data.name,
        description: data.description,
        picture: data.picture,
        websiteUrl: data.websiteUrl,
        brandId: data.brandId,
        newBrandName: data.newBrandName,
        requestedById,
        clinicId,
      },
      include: WITH_RELATIONS,
    });
  }

  async approve(id: string, createdProductId: string, reviewedById: string) {
    return prisma.productRequest.update({
      where: { id },
      data: { status: "APPROVED", createdProductId, reviewedById },
      include: WITH_RELATIONS,
    });
  }

  async reject(id: string, reviewedById: string, rejectionReason?: string) {
    return prisma.productRequest.update({
      where: { id },
      data: { status: "REJECTED", reviewedById, rejectionReason },
      include: WITH_RELATIONS,
    });
  }
}