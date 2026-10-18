import { defineConfig } from "vitest/config";

// The tests only shell out to the Biome CLI, so they need neither the root
// config's jsdom environment nor its setup file.
export default defineConfig({
  test: {
    environment: "node",
    // Each test spawns Biome; the first run can be slow on cold CI machines.
    testTimeout: 30_000,
  },
});
