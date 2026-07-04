import { NotFoundError, ForbiddenError } from "@api/errors";
import { ProductRepository } from "./product.repository";
import { ProductClinicRepository } from "./product-clinic.repository";
import type {
  CreateProduct,
  UpdateProduct,
  CreateProductClinic,
  UpdateProductClinic,
  RestockProductClinic,
  UserRole,
} from "@armali/schemas";

const STOCK_MANAGER_ROLES: UserRole[] = ["ADMIN", "DIRECTOR", "REFERENT"];

export class ProductService {
  constructor(
    private repository: ProductRepository,
    private clinicRepository: ProductClinicRepository,
  ) {}

  // ── Products (catalogue global) ─────────────────────────────────────────

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundError("Produit");
    return product;
  }

  async create(data: CreateProduct, role: UserRole) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateProduct, role: UserRole) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundError("Produit");
    return this.repository.update(id, data);
  }

  async delete(id: string, role: UserRole) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const product = await this.repository.findById(id);
    if (!product) throw new NotFoundError("Produit");
    return this.repository.delete(id);
  }

  // ── ProductClinic (stock par clinique) ───────────────────────────────────

  async getClinicProducts(clinicId: string) {
    return this.clinicRepository.findByClinic(clinicId);
  }

  async getClinicProductById(id: string) {
    const productClinic = await this.clinicRepository.findById(id);
    if (!productClinic) throw new NotFoundError("Produit clinique");
    return productClinic;
  }

  async createClinicProduct(data: CreateProductClinic, role: UserRole) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    return this.clinicRepository.create(data);
  }

  // Modification du prix et/ou du minimum requis (pas le stock, voir restock)
  async updateClinicProduct(
    id: string,
    data: UpdateProductClinic,
    role: UserRole,
  ) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const productClinic = await this.clinicRepository.findById(id);
    if (!productClinic) throw new NotFoundError("Produit clinique");
    return this.clinicRepository.update(id, data);
  }

  // Réapprovisionnement : incrémente le stock existant plutôt que de l'écraser
  async restockClinicProduct(
    id: string,
    data: RestockProductClinic,
    role: UserRole,
  ) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const productClinic = await this.clinicRepository.findById(id);
    if (!productClinic) throw new NotFoundError("Produit clinique");
    return this.clinicRepository.incrementStock(id, data.quantity);
  }

  async deleteClinicProduct(id: string, role: UserRole) {
    if (!STOCK_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const productClinic = await this.clinicRepository.findById(id);
    if (!productClinic) throw new NotFoundError("Produit clinique");
    return this.clinicRepository.delete(id);
  }
}