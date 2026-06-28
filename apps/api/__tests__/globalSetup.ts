// globalSetup.ts — tourne avant tous les imports
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";

export async function setup() {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("test_db")
    .withUsername("test")
    .withPassword("test")
    .start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url; // ← setté AVANT tout import de l'app

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
  execSync("pnpm tsx prisma/seeds/index.ts", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });

  console.log("✅ Seed terminé");

  (globalThis as any).__pgContainer__ = container;
}

export async function teardown() {
  await (globalThis as any).__pgContainer__?.stop();
}
