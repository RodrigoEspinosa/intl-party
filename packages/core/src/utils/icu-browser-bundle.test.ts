// @vitest-environment node
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, it, expect } from "vitest";
import packageJson from "../../package.json";

const packageDir = fileURLToPath(new URL("../..", import.meta.url));

// Node tests can't catch a broken browser build: under Node a lazy
// require("intl-messageformat") works, while in the published ESM build it
// becomes esbuild's throwing __require shim and plurals render as raw ICU
// text. Reproduce both steps: the library build (dependencies external, like
// tsup) and an app bundling it for the browser, run with no require or process.
describe("browser bundle", () => {
  it("formats ICU plurals without Node's require", async () => {
    const library = await build({
      entryPoints: [fileURLToPath(new URL("../index.ts", import.meta.url))],
      bundle: true,
      write: false,
      format: "esm",
      external: Object.keys(packageJson.dependencies),
      logLevel: "silent",
    });

    const app = await build({
      stdin: {
        contents: library.outputFiles[0].text,
        resolveDir: packageDir,
        sourcefile: "index.mjs",
      },
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      globalName: "IntlPartyCore",
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "silent",
    });

    const context: { IntlPartyCore?: typeof import("../index") } = {};
    vm.runInNewContext(app.outputFiles[0].text, context);

    const format = context.IntlPartyCore!.formatICUMessage;
    const message = "{count, plural, one {# item} other {# items}}";
    expect(format(message, "en", { count: 1 })).toBe("1 item");
    expect(format(message, "en", { count: 5 })).toBe("5 items");
  });
});
