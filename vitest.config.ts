import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

process.env.VITE_CJS_IGNORE_WARNING = "true";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "**/examples/**",
        "**/*.test.*",
        "**/*.spec.*",
      ],
    },
  },
  resolve: {
    alias: {
      "@intl-party/core": resolve(__dirname, "./packages/core/src"),
      "@intl-party/react": resolve(__dirname, "./packages/react/src"),
      // Must precede "@intl-party/nextjs": aliases match by prefix, first wins.
      "@intl-party/nextjs/client": resolve(
        __dirname,
        "./packages/nextjs/src/client-exports.ts"
      ),
      "@intl-party/nextjs": resolve(__dirname, "./packages/nextjs/src"),
      "@intl-party/cli": resolve(__dirname, "./packages/cli/src"),
      "@intl-party/eslint-plugin": resolve(
        __dirname,
        "./packages/eslint-plugin/src"
      ),
    },
  },
});
