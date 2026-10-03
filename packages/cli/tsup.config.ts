import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts"],
  format: ["cjs"],
  dts: true,
  clean: true,
  // These deps are ESM-only. Bundle them instead of emitting require() calls,
  // which would depend on Node's require(esm) support.
  noExternal: ["chalk", "ora", "inquirer", "commander", "glob", "chokidar"],
});
