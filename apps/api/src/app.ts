import express, { type Express } from "express";
import { prisma } from "./lib/prisma";
import cors from "cors";
import clinicRouter from "./clinics/clinic.router";
import referentRouter from "./referents/referent.router";
import reviewRouter from "./reviews/review.router";
import { collectDefaultMetrics } from "prom-client";
import express_prom_bundle from "express-prom-bundle";
import { default as authRouter } from "./auth/auth.router";
import { default as userRouter } from "./users/user.router";
import { errorHandler } from "./middlewares";
import actRouter from "./acts/act.router";
import { default as meetingRouter } from "./meetings/meeting.router";
import animalRouter from "./animals/animal.router";
import prescriptionRouter from "./prescriptions/prescription.router";
import animalMedicalHistoryRouter from "./medicalHistories/medical-history.router";
import productRouter from "./products/product.router";
import brandRouter from "./brands/brand.router";
import specialityRouter from "./specialities/speciality.router";
import messagingRouter from "./messaging/messaging.router";
import bookingRouter from "./bookings/booking.router";
import veterinarianRouter from "./users/veterinarian.router";
import staffRouter from "./staffs/staff.router";

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
app.use(express.json());

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
app.use("/api/referent", referentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/animals", animalRouter);
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
app.use(errorHandler);
