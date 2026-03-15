import express from "express";
import { prisma } from "./lib/prisma";
import authRouter from "./routes/auth.route";
import cors from "cors";
import meetingRouter from "./routes/metting.route";
import { errorHandler } from "./middlewares/error.middleware";
import userRouter from "./routes/user.route";
import { resolve } from "path";
import {config}  from 'dotenv';

const env = process.env.ENV;
config({path: resolve(process.cwd(), `../../.env.${env}`),});

const frontendUrl = process.env.VITE_FRONTEND_URL;
const backendUrl = process.env.VITE_BACKEND_URL || "";
const backendPort = backendUrl.split(":").pop();

const app = express();
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(errorHandler);

app.get("/test", async (req, res) => {
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

const server = app.listen(backendPort, () => {
  console.log(`Server running : ${backendUrl}`);
});