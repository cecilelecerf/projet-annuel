import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mode = process.env.NODE_ENV === "production" ? "prod" : "dev";
config({ path: resolve(__dirname, `../../.env.${mode}`) });

export default defineConfig({
  schema: "prisma/schemas",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
