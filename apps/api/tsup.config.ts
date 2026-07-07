import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node24",
    outDir: "dist",
    clean: true,
    sourcemap: true,
  },
  {
    entry: ["prisma.config.ts"],
    format: ["esm"],
    target: "node24",
    outDir: "dist",
    clean: false,
  },
  {
    entry: { seeds: "prisma/seeds/index.ts" },
    format: ["esm"],
    target: "node24",
    outDir: "dist",
    clean: false,
  },
]);
