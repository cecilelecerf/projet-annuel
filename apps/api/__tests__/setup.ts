// setup.ts — setupFiles, pour getPrisma() dans les tests
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/prisma/client";

let _prisma: PrismaClient;
export const getPrisma = () => _prisma;

// DATABASE_URL est déjà setté par globalSetup ici
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
_prisma = new PrismaClient({ adapter });
