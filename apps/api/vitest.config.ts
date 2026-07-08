import { defineConfig } from "vitest/config";
import { resolve } from "path";
const root = resolve(__dirname, "../..");

export default defineConfig({
  test: {
    globalSetup: "./__tests__/globalSetup.ts",
    setupFiles: ["./__tests__/setup.ts"],
    hookTimeout: 60_000,
    testTimeout: 15_000,
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/tests/**",
        "src/tests/**",
        "src/**/*.test.ts",
        "src/index.ts",
        ".env",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
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
