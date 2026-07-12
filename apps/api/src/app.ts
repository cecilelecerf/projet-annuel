import express, { type Express } from "express";
import { resolve } from "path";
import { handleStripeWebhook } from "./orders/order-webhook.controller";
import { prisma } from "./lib/prisma";
import cors from "cors";
import clinicRouter from "./clinics/clinic.router";
import reviewRouter from "./reviews/review.router";
import { collectDefaultMetrics } from "prom-client";
import express_prom_bundle from "express-prom-bundle";
import { default as authRouter } from "./auth/auth.router";
import { default as userRouter } from "./users/user.router";
import { errorHandler } from "./middlewares";
import actRouter from "./acts/act.router";
import { default as meetingRouter } from "./meetings/meeting.router";
import animalRouter from "./animals/animal.router";
import animalEmergencyRouter from "./animals/animal-emergency.router";
import prescriptionRouter from "./prescriptions/prescription.router";
import animalMedicalHistoryRouter from "./medical-histories/medical-history.router";
import productRouter from "./products/product.router";
import brandRouter from "./brands/brand.router";
import specialityRouter from "./specialities/speciality.router";
import messagingRouter from "./messaging/messaging.router";
import bookingRouter from "./bookings/booking.router";
import productRequestRouter from "./product-requests/product-request.router";
import clientShopRouter from "./shop/shop.router";
import orderRouter from "./orders/order.router";
import salesRouter from "./sales/sales.router";
import dashboardRouter from "./dashboard/dashboard.router";
import budgetRouter from "./budget/budget.router";
import supplierRouter from "./suppliers/supplier.router";
import supplierOrderRouter from "./supplier-orders/supplier-order.router";

import veterinarianRouter from "./veterinarians/veterinarian.router";
import veterinarianClinicRouter from "./clinics/veterinarian-clinics/veterinarian-clinic.router";
import petRouter from "./pets/pet.router";
import vaccineRouter from "./vaccines/vaccine.router";
import raceRouter from "./races/race.router";
import staffRouter from "./clinics/staffs/staff.router";

collectDefaultMetrics();

const metricsMiddleware = express_prom_bundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  normalizePath: [
    ["/api/users/.*", "/api/users/#id"],
    ["/api/meetings/.*", "/api/meetings/#id"],
  ],
});
export const app: Express = express();

app.use(metricsMiddleware);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.post(
  "/api/orders/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

app.use(express.json());
app.use("/uploads", express.static(resolve(process.cwd(), "uploads")));

app.get("/api/test", async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      clientProfile: true,
      veterinarianProfile: true,
      secretaryProfile: true,
    },
  });
  res.json(users);
});
app.use("/api/auth", authRouter);
app.use("/api/meetings", meetingRouter);
app.use("/api/users", userRouter);
app.use("/api/clinics", clinicRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/animals", animalRouter);
app.use("/api/emergency", animalEmergencyRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/medical-histories", animalMedicalHistoryRouter);
app.use("/api/acts", actRouter);
app.use("/api/products", productRouter);
app.use("/api/brands", brandRouter);
app.use("/api/conversations", messagingRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/specialities", specialityRouter);
app.use("/api/veterinarians", veterinarianRouter);
app.use("/api/staffs", staffRouter);

app.use("/api/product-requests", productRequestRouter);
app.use("/api/shop", clientShopRouter);
app.use("/api/orders", orderRouter);
app.use("/api/sales", salesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/supplier-orders", supplierOrderRouter);
app.use("/api/veterinarian-clinics", veterinarianClinicRouter);
app.use("/api/pets", petRouter);
app.use("/api/vaccines", vaccineRouter);
app.use("/api/races", raceRouter);
app.use(errorHandler);
