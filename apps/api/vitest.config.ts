import { defineConfig } from "vitest/config";
import { resolve } from "path";
const root = resolve(__dirname, "../..");

export default defineConfig({
  test: {
    include: ["src/tests/**/*.test.ts"],
    setupFiles: ["src/tests/helpers/setup.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/tests/**", "src/**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@api": resolve(root, "apps/api/src"),
      "@web": resolve(root, "apps/web/src"),
      "@mobile": resolve(root, "apps/mobile/src"),
      "@armali/schemas": resolve(root, "packages/schemas/src"),
    },
  },
});
