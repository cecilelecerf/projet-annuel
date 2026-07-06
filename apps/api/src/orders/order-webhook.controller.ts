import type { Request, Response } from "express";
import { stripe } from "@api/lib/stripe";
import { orderService } from "@api/instances";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function handleStripeWebhook(req: Request, res: Response) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET manquant");
    return res.status(500).send("Webhook non configuré");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) return res.status(400).send("Signature manquante");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Signature webhook Stripe invalide", err);
    return res.status(400).send("Signature invalide");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await orderService.handlePaymentSuccess(session.id);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await orderService.handlePaymentFailureOrExpiry(session.id);
  }

  res.status(200).json({ received: true });
}