import express, { type Express } from "express";
import { prisma } from "./lib/prisma";
import cors from "cors";
import { collectDefaultMetrics } from "prom-client";
import express_prom_bundle from "express-prom-bundle";
import { default as authRouter } from "./auth/auth.router";
import { default as userRouter } from "./users/user.router";
import { errorHandler } from "./middlewares";
import { default as meetingRouter } from "./meetings/meeting.router";
import animalsRouter from "./animals/animal.router";
import actRouter from "./acts/act.router";
import prescriptionRouter from "./prescriptions/prescription.router";
import medicalHistories from "./medicalHistories/medical-history.router";

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
app.use("/api/animals", animalsRouter);
app.use("/api/acts", actRouter);
app.use("/api/medical-histories", medicalHistories);
app.use("/api/prescriptions", prescriptionRouter);

app.use(errorHandler);
