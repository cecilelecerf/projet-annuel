import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve } from "path";

const env = process.env.ENV;
config({path: resolve(process.cwd(), `../../.env.${env}`)});

export default defineConfig({
  schema: "prisma/schemas",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});