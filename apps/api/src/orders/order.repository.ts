import { prisma } from "@api/lib/prisma";
import { PrismaClient } from "@prisma/client/extension";

const WITH_ITEMS = {
  clinic: { select: { name: true } },
  orderItems: {
    include: {
      productClinic: {
        include: { product: { select: { name: true, picture: true } } },
      },
    },
  },
} as const;

const WITH_ITEMS_AND_CLIENT = {
  ...WITH_ITEMS,
  client: {
    select: {
      user: { select: { firstname: true, lastname: true, email: true } },
    },
  },
} as const;

function flattenClient<T extends { client: { user: unknown } }>(
  order: T,
): Omit<T, "client"> & { client: T["client"]["user"] } {
  return { ...order, client: order.client.user } as Omit<T, "client"> & {
    client: T["client"]["user"];
  };
}

export interface OrderItemInput {
  productClinicId: string;
  quantity: number;
  unitPrice: number;
}

export class OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async createWithItems(
    clientId: string,
    clinicId: string,
    items: OrderItemInput[],
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          clientId,
          clinicId,
          status: "PENDING",
          orderItems: {
            create: items.map((item) => ({
              productClinicId: item.productClinicId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: WITH_ITEMS,
      });

      for (const item of items) {
        await tx.clinicProduct.update({
          where: { id: item.productClinicId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });
  }

  async findByClient(clientId: string) {
    return prisma.order.findMany({
      where: { clientId },
      include: WITH_ITEMS,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: WITH_ITEMS,
    });
  }

  async attachStripeSession(orderIds: string[], stripeSessionId: string) {
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { stripeSessionId },
    });
  }

  async findByStripeSession(stripeSessionId: string) {
    return prisma.order.findMany({
      where: { stripeSessionId },
      include: WITH_ITEMS,
    });
  }

  // ── Côté secrétaire : commandes en attente de préparation/retrait ──────────

  async findPendingPickupByClinic(clinicId: string) {
    const orders = await prisma.order.findMany({
      where: { clinicId, status: { in: ["CONFIRMED", "READY"] } },
      include: WITH_ITEMS_AND_CLIENT,
      orderBy: { createdAt: "asc" },
    });
    return orders.map(flattenClient);
  }

  async markReady(id: string, clinicId: string) {
    const result = await prisma.order.updateMany({
      where: { id, clinicId, status: "CONFIRMED" },
      data: { status: "READY" },
    });
    return result.count > 0;
  }

  async findByClinicAndPickupCode(clinicId: string, pickupCode: string) {
    const order = await prisma.order.findFirst({
      where: { clinicId, pickupCode, status: "READY" },
      include: WITH_ITEMS_AND_CLIENT,
    });
    return order ? flattenClient(order) : null;
  }

  async markPickedUp(id: string) {
    const order = await prisma.order.update({
      where: { id },
      data: { status: "PICKED_UP", pickupAt: new Date() },
      include: WITH_ITEMS_AND_CLIENT,
    });
    return flattenClient(order);
  }

  async confirmPayment(id: string, pickupCode: string) {
    return prisma.order.update({
      where: { id },
      data: { status: "CONFIRMED", pickupCode },
      include: WITH_ITEMS,
    });
  }

  async cancelByStripeSession(stripeSessionId: string) {
    const orders = await prisma.order.findMany({
      where: { stripeSessionId, status: "PENDING" },
      include: { orderItems: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        for (const item of order.orderItems) {
          await tx.clinicProduct.update({
            where: { id: item.productClinicId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
      }
    });

    return orders.length;
  }
}
