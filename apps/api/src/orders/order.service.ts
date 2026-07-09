import { randomBytes } from "crypto";
import { prisma } from "@api/lib/prisma";
import { stripe } from "@api/lib/stripe";
import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors";
import { OrderRepository } from "./order.repository";
import { getClientClinicIds } from "@api/shop/shop.service";
import { EmailService } from "@api/emails/email.service";
import type { Checkout, CheckoutResult } from "@armali/schemas";
import type Stripe from "stripe";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export class OrderService {
  constructor(
    private repository: OrderRepository,
    private emailService: EmailService,
  ) {}

  async checkout(
    clientUserId: string,
    data: Checkout,
  ): Promise<CheckoutResult> {
    const accessibleClinicIds = await getClientClinicIds(clientUserId);
    const client = await prisma.user.findUnique({
      where: { id: clientUserId },
    });
    if (!client) throw new NotFoundError("Client");

    const createdOrders = [];
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const group of data.groups) {
      if (!accessibleClinicIds.includes(group.clinicId)) {
        throw new ForbiddenError();
      }

      const items = [];
      for (const item of group.items) {
        const clinicProduct = await prisma.clinicProduct.findUnique({
          where: { id: item.productClinicId },
          include: { product: true },
        });
        if (!clinicProduct || clinicProduct.clinicId !== group.clinicId) {
          throw new BadRequestError(
            "Un des produits ne correspond pas à cette clinique",
          );
        }
        if (clinicProduct.stock < item.quantity) {
          throw new BadRequestError(
            `Stock insuffisant pour un des produits (disponible : ${clinicProduct.stock})`,
          );
        }
        const unitPrice = Number(clinicProduct.price);
        items.push({
          productClinicId: item.productClinicId,
          quantity: item.quantity,
          unitPrice,
        });
        lineItems.push({
          price_data: {
            currency: "eur",
            unit_amount: Math.round(unitPrice * 100),
            product_data: { name: clinicProduct.product.name },
          },
          quantity: item.quantity,
        });
      }

      const order = await this.repository.createWithItems(
        clientUserId,
        group.clinicId,
        items,
      );
      createdOrders.push(order);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: client.email,
      line_items: lineItems,
      success_url: `${FRONTEND_URL}/mon-espace/orders?checkout=success`,
      cancel_url: `${FRONTEND_URL}/mon-espace/checkout?checkout=cancelled`,
      metadata: {
        orderIds: createdOrders.map((o) => o.id).join(","),
      },
    });

    await this.repository.attachStripeSession(
      createdOrders.map((o) => o.id),
      session.id,
    );

    return {
      orders: createdOrders,
      checkoutUrl: session.url!,
    } as unknown as CheckoutResult;
  }

  async handlePaymentSuccess(
    sessionId: string,
    _cardInfo?: { brand: string; last4: string },
  ) {
    const orders = await this.repository.findByStripeSession(sessionId);
    if (orders.length === 0) return;

    for (const order of orders) {
      if (order.status !== "PENDING") continue;

      const pickupCode = randomBytes(3).toString("hex").toUpperCase();
      const updated = await this.repository.confirmPayment(
        order.id,
        pickupCode,
      );

      const client = await prisma.user.findUnique({
        where: { id: order.clientId },
      });
      if (client) {
        await this.emailService.sendOrderConfirmation(
          client.email,
          client.firstname,
          {
            clinicName: updated.clinic.name,
            pickupCode,
            items: updated.orderItems.map((i) => ({
              name: i.productClinic.product.name,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
            })),
            total: updated.orderItems.reduce(
              (sum, i) => sum + Number(i.unitPrice) * i.quantity,
              0,
            ),
          },
        );
      }
    }
  }

  async getMyOrders(clientUserId: string) {
    return this.repository.findByClient(clientUserId);
  }

  async getOrderById(clientUserId: string, orderId: string) {
    const order = await this.repository.findById(orderId);
    if (!order) throw new NotFoundError("Commande");
    if (order.clientId !== clientUserId) throw new ForbiddenError();
    return order;
  }

  async handlePaymentFailureOrExpiry(sessionId: string) {
    await this.repository.cancelByStripeSession(sessionId);
  }

  // ── Côté secrétaire : préparation et remise des colis ───────────────────────

  private async getSecretaryClinicId(secretaryUserId: string): Promise<string> {
    const profile = await prisma.secretaryProfile.findUnique({
      where: { id: secretaryUserId },
    });
    if (!profile)
      throw new BadRequestError("Aucune clinique associée à ce compte");
    return profile.clinicId;
  }

  async getClinicPendingOrders(secretaryUserId: string) {
    const clinicId = await this.getSecretaryClinicId(secretaryUserId);
    return this.repository.findPendingPickupByClinic(clinicId);
  }

  async markOrderReady(secretaryUserId: string, orderId: string) {
    const clinicId = await this.getSecretaryClinicId(secretaryUserId);
    const success = await this.repository.markReady(orderId, clinicId);
    if (!success) {
      throw new BadRequestError(
        "Cette commande n'existe pas, n'appartient pas à votre clinique, ou n'est pas en attente de préparation",
      );
    }

    const order = await this.repository.findById(orderId);
    if (!order || !order.pickupCode) return;

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { id: order.clientId },
      include: { user: { select: { firstname: true, email: true } } },
    });
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });

    if (clientProfile?.user && clinic) {
      await this.emailService.sendOrderReady(
        clientProfile.user.email,
        clientProfile.user.firstname,
        {
          clinicName: clinic.name,
          clinicAddress: clinic.address,
          clinicPhone: clinic.phone ?? undefined,
          openingHours: clinic.openingHours ?? undefined,
          pickupCode: order.pickupCode,
          items: order.orderItems.map((i) => ({
            name: i.productClinic.product.name,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
          })),
          total: order.orderItems.reduce(
            (sum, i) => sum + Number(i.unitPrice) * i.quantity,
            0,
          ),
        },
      );
    }
  }

  async deliverOrder(secretaryUserId: string, pickupCode: string) {
    const clinicId = await this.getSecretaryClinicId(secretaryUserId);
    const order = await this.repository.findByClinicAndPickupCode(
      clinicId,
      pickupCode.toUpperCase(),
    );
    if (!order) {
      throw new NotFoundError(
        "Aucune commande prête à récupérer ne correspond à ce code",
      );
    }
    return this.repository.markPickedUp(order.id);
  }
}
