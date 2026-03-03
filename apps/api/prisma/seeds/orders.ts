import type { PrismaClient, Clinic } from "../generated/prisma/client";

export async function seedOrders(
  prisma: PrismaClient,
  { users, clinic1 }: { users: any; clinic1: Clinic },
) {
  const { clientUser1 } = users;

  const cp1 = await prisma.clinicProduct.findFirst({
    where: { clinicId: clinic1.id },
  });
  if (!cp1) return;

  const order1 = await prisma.order.create({
    data: {
      status: "CONFIRMED",
      pickupAt: new Date("2026-02-25T10:00:00"),
      clientId: clientUser1.id,
      clinicId: clinic1.id,
    },
  });

  await prisma.orderItem.create({
    data: {
      quantity: 2,
      unitPrice: 65.9,
      productClinicId: cp1.id,
      orderId: order1.id,
    },
  });

  return { order1 };
}
