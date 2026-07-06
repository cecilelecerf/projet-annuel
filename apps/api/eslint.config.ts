import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // =====================
  // API / TypeScript
  // =====================
  {
    files: ["**/*.ts"],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // =====================
  // 🧪 TESTS (Vitest)
  // =====================
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    plugins: {
      vitest,
    },
    languageOptions: {
      globals: vitest.environments.env.globals,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
