import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { SupplierOrderRepository } from "./supplier-order.repository";
import { SupplierRepository } from "@api/suppliers/supplier.repository";
import { BudgetRepository } from "@api/budget/budget.repository";
import { ProductClinicRepository } from "@api/products/product-clinic.repository";
import { ClinicService } from "@api/clinics/clinic.service";
import type { CreateSupplierOrder, UserId, UserRole } from "@armali/schemas";

const SUPPLIER_ORDER_MANAGER_ROLES: UserRole[] = ["REFERENT", "DIRECTOR"];

function computeTotal(items: { unitCost: unknown; quantity: number }[]) {
  return (
    Math.round(
      items.reduce((sum, i) => sum + Number(i.unitCost) * i.quantity, 0) * 100,
    ) / 100
  );
}

function serializeOrder<T extends { createdAt: Date; receivedAt: Date | null }>(
  order: T,
) {
  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    receivedAt: order.receivedAt ? order.receivedAt.toISOString() : null,
  };
}

export class SupplierOrderService {
  constructor(
    private repository: SupplierOrderRepository,
    private supplierRepository: SupplierRepository,
    private budgetRepository: BudgetRepository,
    private clinicService: ClinicService,
    private productClinicRepository: ProductClinicRepository,
  ) {}

  private async getClinicId(userId: UserId, role: UserRole): Promise<string> {
    if (!SUPPLIER_ORDER_MANAGER_ROLES.includes(role))
      throw new ForbiddenError();
    return this.clinicService.getClinicIdByUserId({ userId, role });
  }

  // ── Création : vérifie le catalogue fournisseur, le budget, débite ────────

  async create(userId: UserId, role: UserRole, data: CreateSupplierOrder) {
    const clinicId = await this.getClinicId(userId, role);

    const supplier = await this.supplierRepository.findById(data.supplierId);
    if (!supplier) {
      throw new ForbiddenError();
    }

    const items = data.items.map((item) => {
      const catalogEntry = supplier.supplierProducts.find(
        (sp) => sp.productId === item.productId,
      );
      if (!catalogEntry) {
        throw new BadRequestError(
          "Un des produits ne fait pas partie du catalogue de ce fournisseur",
        );
      }
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: Number(catalogEntry.costPrice),
      };
    });

    const total = computeTotal(items);

    const balance = await this.budgetRepository.getBalance(clinicId);
    if (balance < total) {
      throw new BadRequestError(
        `Budget insuffisant (disponible : ${balance.toFixed(2)} €, requis : ${total.toFixed(2)} €)`,
      );
    }

    const order = await this.repository.create(
      clinicId,
      data.supplierId,
      userId,
      items,
    );

    await this.budgetRepository.create({
      clinicId,
      createdById: userId,
      type: "DEBIT",
      amount: total,
      reason: `Commande fournisseur — ${supplier.name}`,
      supplierOrderId: order.id,
    });

    return { ...serializeOrder(order), total };
  }

  // ── Lecture ─────────────────────────────────────────────────────────────────

  async getAll(userId: UserId, role: UserRole, status?: string) {
    const clinicId = await this.getClinicId(userId, role);
    const orders = await this.repository.findByClinic(clinicId, status);
    return orders.map((o) => ({
      ...serializeOrder(o),
      total: computeTotal(o.items),
    }));
  }

  private async getOwnedOrder(userId: UserId, role: UserRole, id: string) {
    const clinicId = await this.getClinicId(userId, role);
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundError("Commande fournisseur");
    if (order.clinicId !== clinicId) throw new ForbiddenError();
    return order;
  }

  async getById(userId: UserId, role: UserRole, id: string) {
    const order = await this.getOwnedOrder(userId, role, id);
    return { ...serializeOrder(order), total: computeTotal(order.items) };
  }

  // ── Réception : incrémente le stock de chaque ligne, crée le ClinicProduct
  //    s'il n'existait pas encore dans la boutique de la clinique ──────────

  async markReceived(userId: UserId, role: UserRole, id: string) {
    const order = await this.getOwnedOrder(userId, role, id);
    if (order.status !== "PENDING") {
      throw new BadRequestError("Cette commande a déjà été traitée");
    }

    for (const item of order.items) {
      const clinicProduct =
        await this.productClinicRepository.findByClinicAndProduct(
          order.clinicId,
          item.productId,
        );
      if (clinicProduct) {
        await this.productClinicRepository.incrementStock(
          clinicProduct.id,
          item.quantity,
        );
      } else {
        await this.productClinicRepository.create({
          clinicId: order.clinicId,
          productId: item.productId,
          stock: item.quantity,
          minimumRequired: 0,
          price: 0,
        } as never);
      }
    }

    const updated = await this.repository.markReceived(id);
    return { ...serializeOrder(updated), total: computeTotal(updated.items) };
  }

  // ── Annulation : ne peut se faire que sur une commande PENDING, rembourse
  //    intégralement le budget débité à la création ──────────────────────────

  async cancel(userId: UserId, role: UserRole, id: string) {
    const order = await this.getOwnedOrder(userId, role, id);
    if (order.status !== "PENDING") {
      throw new BadRequestError(
        "Seule une commande en attente peut être annulée",
      );
    }

    const total = computeTotal(order.items);

    await this.budgetRepository.create({
      clinicId: order.clinicId,
      createdById: userId,
      type: "REFUND",
      amount: total,
      reason: `Annulation commande fournisseur — ${order.supplier.name}`,
      supplierOrderId: order.id,
    });

    const updated = await this.repository.markCancelled(id);
    return { ...serializeOrder(updated), total };
  }
}
