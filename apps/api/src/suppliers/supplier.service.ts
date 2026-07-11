import { ForbiddenError, NotFoundError } from "@api/errors";
import { SupplierRepository } from "./supplier.repository";
import { SupplierProductRepository } from "./supplier-product.repository";
import type {
  CreateSupplier,
  UpdateSupplier,
  CreateSupplierProduct,
  UpdateSupplierProduct,
  UserRole,
} from "@armali/schemas";

const SUPPLIER_READ_ROLES: UserRole[] = ["ADMIN", "REFERENT", "DIRECTOR"];
const SUPPLIER_MANAGER_ROLES: UserRole[] = ["ADMIN"];

export class SupplierService {
  constructor(
    private repository: SupplierRepository,
    private supplierProductRepository: SupplierProductRepository,
  ) {}

  // ── Supplier ──────────────────────────────────────────────────────────────

  async getAll(role: UserRole) {
    if (!SUPPLIER_READ_ROLES.includes(role)) throw new ForbiddenError();
    return this.repository.findAll();
  }

  async getById(role: UserRole, id: string) {
    if (!SUPPLIER_READ_ROLES.includes(role)) throw new ForbiddenError();
    const supplier = await this.repository.findById(id);
    if (!supplier) throw new NotFoundError("Fournisseur");
    return supplier;
  }

  async create(role: UserRole, data: CreateSupplier) {
    if (!SUPPLIER_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    return this.repository.create(data);
  }

  async update(role: UserRole, id: string, data: UpdateSupplier) {
    if (!SUPPLIER_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const supplier = await this.repository.findById(id);
    if (!supplier) throw new NotFoundError("Fournisseur");
    return this.repository.update(id, data);
  }

  async delete(role: UserRole, id: string) {
    if (!SUPPLIER_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const supplier = await this.repository.findById(id);
    if (!supplier) throw new NotFoundError("Fournisseur");
    return this.repository.delete(id);
  }

  // ── SupplierProduct (catalogue de prix d'achat, admin-only) ─────────────────

  async addProduct(
    role: UserRole,
    supplierId: string,
    data: CreateSupplierProduct,
  ) {
    if (!SUPPLIER_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const supplier = await this.repository.findById(supplierId);
    if (!supplier) throw new NotFoundError("Fournisseur");
    return this.supplierProductRepository.upsert(
      supplierId,
      data.productId,
      data.costPrice,
    );
  }

  async updateProduct(
    role: UserRole,
    supplierId: string,
    productLinkId: string,
    data: UpdateSupplierProduct,
  ) {
    if (!SUPPLIER_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const link = await this.supplierProductRepository.findById(productLinkId);
    if (!link || link.supplierId !== supplierId) {
      throw new NotFoundError("Produit du fournisseur");
    }
    return this.supplierProductRepository.updateCost(productLinkId, data.costPrice);
  }

  async removeProduct(role: UserRole, supplierId: string, productLinkId: string) {
    if (!SUPPLIER_MANAGER_ROLES.includes(role)) throw new ForbiddenError();
    const link = await this.supplierProductRepository.findById(productLinkId);
    if (!link || link.supplierId !== supplierId) {
      throw new NotFoundError("Produit du fournisseur");
    }
    return this.supplierProductRepository.delete(productLinkId);
  }
}