import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts"],
  format: ["cjs"],
  dts: true,
  clean: true,
  // chalk@5, ora@7, and inquirer@9 are ESM-only; leaving them external in a
  // CJS bundle produces require() calls that throw ERR_REQUIRE_ESM at
  // runtime. Bundle them instead.
  noExternal: ["chalk", "ora", "inquirer"],
});
