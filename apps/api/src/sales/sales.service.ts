import { prisma } from "@api/lib/prisma";
import { ForbiddenError } from "@api/errors";
import type { UserRole } from "@armali/schemas";

const REVENUE_STATUSES = ["CONFIRMED", "READY", "PICKED_UP"] as const;

export class SalesService {
  private async getClinicId(userId: string, role: UserRole): Promise<string> {
    if (role === "REFERENT") {
      const profile = await prisma.referentClinicProfile.findUnique({
        where: { id: userId },
      });
      if (!profile) throw new ForbiddenError();
      return profile.clinicId;
    }
    if (role === "DIRECTOR") {
      const clinic = await prisma.clinic.findFirst({
        where: { directorId: userId },
        select: { id: true },
      });
      if (!clinic) throw new ForbiddenError();
      return clinic.id;
    }
    throw new ForbiddenError();
  }

  async getReport(userId: string, role: UserRole, from?: string, to?: string) {
    const clinicId = await this.getClinicId(userId, role);

    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const orders = await prisma.order.findMany({
      where: {
        clinicId,
        status: { in: [...REVENUE_STATUSES] },
        ...dateFilter,
      },
      include: {
        client: {
          select: {
            user: { select: { firstname: true, lastname: true, email: true } },
          },
        },
        clinic: { select: { name: true } },
        orderItems: {
          include: {
            productClinic: {
              include: { product: { select: { name: true, picture: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Résumé ────────────────────────────────────────────────────────────
    let totalRevenue = 0;
    for (const order of orders) {
      for (const item of order.orderItems) {
        totalRevenue += Number(item.unitPrice) * item.quantity;
      }
    }
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // ── Chiffre d'affaires par jour (pour le graphique) ────────────────────
    const revenueByDay = new Map<string, number>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      const orderTotal = order.orderItems.reduce(
        (sum, i) => sum + Number(i.unitPrice) * i.quantity,
        0,
      );
      revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + orderTotal);
    }
    const revenueOverTime = [...revenueByDay.entries()]
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Top produits vendus ─────────────────────────────────────────────────
    const productStats = new Map<
      string,
      { productName: string; quantitySold: number; revenue: number }
    >();
    for (const order of orders) {
      for (const item of order.orderItems) {
        const name = item.productClinic.product.name;
        const existing = productStats.get(name) ?? {
          productName: name,
          quantitySold: 0,
          revenue: 0,
        };
        existing.quantitySold += item.quantity;
        existing.revenue += Number(item.unitPrice) * item.quantity;
        productStats.set(name, existing);
      }
    }
    const topProducts = [...productStats.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ── Commandes (aplatit client.user comme ailleurs) ──────────────────────
    const flatOrders = orders.map((order) => ({
      ...order,
      client: order.client.user,
    }));

    return {
      summary: { totalRevenue, orderCount, averageOrderValue },
      revenueOverTime,
      topProducts,
      orders: flatOrders,
    };
  }
}
