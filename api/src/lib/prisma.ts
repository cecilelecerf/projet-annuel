import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "api/prisma/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
console.log("test");
console.log(connectionString);
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
