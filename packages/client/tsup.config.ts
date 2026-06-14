import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/runtime.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["@intl-party/core"],
  clean: true,
  sourcemap: true,
  tsconfig: "tsconfig.build.json",
});
