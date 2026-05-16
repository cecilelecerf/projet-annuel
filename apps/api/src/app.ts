import express, { type Express } from "express";
import { prisma } from "./lib/prisma";
import authRouter from "./routes/auth.route";
import cors from "cors";
import meetingRouter from "./routes/metting.route";
import { errorHandler } from "./middlewares/error.middleware";
import userRouter from "./routes/user.route";
import { collectDefaultMetrics } from "prom-client";
import express_prom_bundle from "express-prom-bundle";

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
app.use(errorHandler);
