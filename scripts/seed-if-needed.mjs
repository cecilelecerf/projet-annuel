import fs from "node:fs";
import { execSync } from "node:child_process";

const markerFile = ".seeded.dev";

if (fs.existsSync(markerFile)) {
    console.log("[seed-if-needed] Seed déjà fait, skip.");
    process.exit(0);
}

console.log("[seed-if-needed] Seed en cours...");
execSync("pnpm --filter api run seed", { stdio: "inherit", shell: true });
fs.writeFileSync(markerFile, new Date().toISOString(), "utf8");
console.log("[seed-if-needed] Seed terminé, marqueur créé.");
