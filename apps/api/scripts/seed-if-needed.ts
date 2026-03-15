import { execSync } from "node:child_process";
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/prisma/client";

const env = process.env.ENV;
config({path: resolve(process.cwd(), `../../.env.${env}`)});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	console.error("Url DATABASE_URL manquante dans .env.dev");
	process.exit(1);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const run = async () => {
	try {
		const usersCount = await prisma.user.count();

		if (usersCount > 0) {
			console.log(
				`Seed stoppé , la bdd contiens déja ${usersCount} user(s).`,
			);
			return;
		}

		console.log("bdd vide, execution du seed...");
		execSync("pnpm run seed", {
			stdio: "inherit",
			cwd: process.cwd(),
			shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
		});
	} finally {
		await prisma.$disconnect();
	}
};

run().catch((error) => {
	console.error("check Seed erroné :", error);
	process.exit(1);
});
