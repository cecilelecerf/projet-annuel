import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const env = process.env.ENV;
config({path: resolve(process.cwd(), `../../.env.${env}`)});

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
