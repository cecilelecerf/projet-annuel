import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    outDir: "dist",
    clean: true,
    sourcemap: true,
  },
  {
    entry: ["prisma.config.ts"],
    format: ["esm"],
    target: "node22",
    outDir: "dist",
    clean: false,
  },
]);
