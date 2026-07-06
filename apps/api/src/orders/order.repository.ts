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