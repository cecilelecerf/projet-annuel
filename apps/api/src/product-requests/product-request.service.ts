import { prisma } from "@api/lib/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "@api/errors";
import { ProductRequestRepository } from "./product-request.repository";
import { ProductRepository } from "../products/product.repository";
import { BrandRepository } from "../brands/brand.repository";
import type {
    BrandId,
  CreateProductRequest,
  RejectProductRequest,
  UserRole,
} from "@armali/schemas";

const REQUESTER_ROLES: UserRole[] = ["DIRECTOR", "REFERENT"];

export class ProductRequestService {
  constructor(
    private repository: ProductRequestRepository,
    private productRepository: ProductRepository,
    private brandRepository: BrandRepository,
  ) {}

  // Un référent ou un directeur ne gère qu'une seule clinique à la fois
  private async getClinicId(userId: string): Promise<string> {
    const [referentProfile, directorProfile] = await Promise.all([
      prisma.referentClinicProfile.findUnique({ where: { id: userId } }),
      prisma.directorClinicProfile.findFirst({ where: { id: userId } }),
    ]);
    const clinicId = referentProfile?.clinicId ?? directorProfile?.clinicId;
    if (!clinicId) {
      throw new BadRequestError("Aucune clinique associée à ce compte");
    }
    return clinicId;
  }

  async getAll(status: "PENDING" | "APPROVED" | "REJECTED" | undefined, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();
    return this.repository.findAll(status);
  }

  async getMine(userId: string, role: UserRole) {
    if (!REQUESTER_ROLES.includes(role)) throw new ForbiddenError();
    const clinicId = await this.getClinicId(userId);
    return this.repository.findByClinic(clinicId);
  }

  async create(userId: string, role: UserRole, data: CreateProductRequest) {
    if (!REQUESTER_ROLES.includes(role)) throw new ForbiddenError();
    const clinicId = await this.getClinicId(userId);
    return this.repository.create(data, userId, clinicId);
  }

  async approve(id: string, adminId: string, role: UserRole) {
    if (role !== "ADMIN") throw new ForbiddenError();
 
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundError("Demande de produit");
    if (request.status !== "PENDING") {
      throw new BadRequestError("Cette demande a déjà été traitée");
    }
 
    let brandId = request.brandId;
    if (!brandId && request.newBrandName) {
      const existing = await this.brandRepository.findByExactName(
        request.newBrandName,
      );
      brandId = existing ? existing.id : (await this.brandRepository.create({ name: request.newBrandName })).id;
    }
    if (!brandId) {
      throw new BadRequestError("Impossible de déterminer la marque du produit");
    }
 
    const product = await this.productRepository.create({
      name: request.name,
      description: request.description ?? undefined,
      picture: request.picture ?? undefined,
      websiteUrl: request.websiteUrl ?? undefined,
      brandId: brandId as BrandId,
    });
 
    return this.repository.approve(id, product.id, adminId);
  }

  async reject(
    id: string,
    adminId: string,
    role: UserRole,
    data: RejectProductRequest,
  ) {
    if (role !== "ADMIN") throw new ForbiddenError();
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundError("Demande de produit");
    if (request.status !== "PENDING") {
      throw new BadRequestError("Cette demande a déjà été traitée");
    }
    return this.repository.reject(id, adminId, data.rejectionReason);
  }
}