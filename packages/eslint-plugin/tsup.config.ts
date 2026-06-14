import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  dts: true,
  clean: true,
  // Legacy ESLint resolves plugins via plain require() and reads `.rules`
  // off the top-level export, so the plugin must be module.exports itself
  // (not module.exports.default). Keep `.default` as a self-reference for
  // ESM/transpiled importers.
  footer: {
    js: "if (module.exports.default) { module.exports = module.exports.default; module.exports.default = module.exports; }",
  },
});
