import express, { type Express } from "express";
import { prisma } from "./lib/prisma";
import cors from "cors";
import { collectDefaultMetrics } from "prom-client";
import express_prom_bundle from "express-prom-bundle";
import { authRouter } from "./auth";
import { userRouter } from "./users";
import { errorHandler } from "./middlewares";
import { meetingRouter as meetingRouter } from "./meetings";
import ownedPetRouter from "./owned-pets/owned-pet.router";
import actRouter from "./acts/act.router";
import animalMeetingActRouter from "./acts/meetingActs/animal-meeting-act.router";
import prescriptionRouter from "./prescriptions/prescription.router";

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
app.use("/api/owned-pets", ownedPetRouter);
app.use("/api/acts", actRouter);
app.use("/api/meeting-acts", animalMeetingActRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use(errorHandler);
