import type { PrismaClient } from "../generated/prisma/client";

export async function seedBudgetAndSuppliers(
  prisma: PrismaClient,
  {
    clinics,
  }: {
    clinics: ReturnType<typeof import("./clinics").seedClinics> extends Promise<
      infer T
    >
      ? T
      : never;
  },
) {
  const clinicId = clinics.clinic1.id;

  const referentProfile = await prisma.referentClinicProfile.findFirst({
    where: { clinicId },
  });
  if (!referentProfile) return;
  const referentId = referentProfile.id;

  // Un produit existant du catalogue global pour servir d'exemple
  const product = await prisma.product.findFirst();
  if (!product) return;

  // ── Fournisseur + son catalogue de prix d'achat ────────────────────────────

  const supplier1 = await prisma.supplier.create({
    data: {
      name: "Zoetis France",
      email: "contact@zoetis.fr",
      phone: "0140506070",
      address: "10 rue de la Santé Animale, 75014 Paris",
    },
  });

  const supplierProduct1 = await prisma.supplierProduct.create({
    data: {
      supplierId: supplier1.id,
      productId: product.id,
      costPrice: 12.5,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: "Virbac",
      email: "commandes@virbac.fr",
      phone: "0450050505",
    },
  });

  // ── Budget : crédit initial ───────────────────────────────────────────────

  await prisma.budgetTransaction.create({
    data: {
      clinicId,
      createdById: referentId,
      type: "CREDIT",
      amount: 500,
      reason: "Approvisionnement initial",
    },
  });

  // ── Une commande fournisseur en attente (débite le budget) ──────────────────

  const pendingOrder = await prisma.supplierOrder.create({
    data: {
      clinicId,
      supplierId: supplier1.id,
      createdById: referentId,
      status: "PENDING",
      items: {
        create: [{ productId: product.id, quantity: 10, unitCost: 12.5 }],
      },
    },
  });

  await prisma.budgetTransaction.create({
    data: {
      clinicId,
      createdById: referentId,
      type: "DEBIT",
      amount: 125, // 10 × 12.5
      reason: `Commande fournisseur — ${supplier1.name}`,
      supplierOrderId: pendingOrder.id,
    },
  });

  // ── Une commande déjà reçue, pour avoir un exemple des deux statuts ────────

  const receivedOrder = await prisma.supplierOrder.create({
    data: {
      clinicId,
      supplierId: supplier1.id,
      createdById: referentId,
      status: "RECEIVED",
      receivedAt: new Date(),
      items: {
        create: [{ productId: product.id, quantity: 5, unitCost: 12.5 }],
      },
    },
  });

  await prisma.budgetTransaction.create({
    data: {
      clinicId,
      createdById: referentId,
      type: "DEBIT",
      amount: 62.5,
      reason: `Commande fournisseur — ${supplier1.name}`,
      supplierOrderId: receivedOrder.id,
    },
  });

  return { supplier1, supplier2, supplierProduct1, pendingOrder, receivedOrder };
}