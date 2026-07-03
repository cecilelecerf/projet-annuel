import { NotFoundError, ForbiddenError } from "@api/errors";
import { BrandRepository } from "./brand.repository";
import type { CreateBrand, UpdateBrand, UserRole } from "@armali/schemas";

const STOCK_MANAGER_ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "REFERANT"];

export class BrandService {
  constructor(private repository: BrandRepository) {}

  async getAll(search?: string) {
    return this.repository.findAll(search);
  }

  async getById(id: string) {
    const brand = await this.repository.findById(id);
    if (!brand) throw new NotFoundError("Marque");
    return brand;
  }

  async findOrCreate(data: CreateBrand, role: UserRole) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const existing = await this.repository.findByExactName(data.name);
    if (existing) return existing;
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateBrand, role: UserRole) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const brand = await this.repository.findById(id);
    if (!brand) throw new NotFoundError("Marque");
    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const brand = await this.repository.findById(id);
    if (!brand) throw new NotFoundError("Marque");
    return this.repository.delete(id);
  }
}