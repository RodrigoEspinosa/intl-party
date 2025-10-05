import { defineConfig } from "vitest/config";
import { resolve } from "path";

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
      "@intl-party/nextjs": resolve(__dirname, "./packages/nextjs/src"),
      "@intl-party/cli": resolve(__dirname, "./packages/cli/src"),
      "@intl-party/eslint-plugin": resolve(
        __dirname,
        "./packages/eslint-plugin/src",
      ),
    },
  },
});
