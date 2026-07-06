import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_APP_CLIENT__: PrismaClient | undefined;
}

/**
 * Même raison que pour setup.ts (client de test) : sous Vitest, ce module
 * est ré-évalué à chaque fichier de test qui importe `app` (directement ou
 * transitivement), à cause de l'isolation par défaut (`isolate: true`).
 * Sans ce garde, un nouveau PrismaClient — et donc un nouveau pool de
 * connexions pg — serait recréé à chaque fichier de test d'intégration,
 * en plus du client de test lui-même.
 *
 * En production (un seul process, un seul import), ce garde ne change
 * rien au comportement : le client est créé une fois, comme avant.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaPg({ connectionString, max: 5 });
  return new PrismaClient({ adapter });
}

const prisma = globalThis.__PRISMA_APP_CLIENT__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__PRISMA_APP_CLIENT__ = prisma;
}

export { prisma };
