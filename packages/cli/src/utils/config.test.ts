import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig } from "./config";

// Runs against a real temp project laid out like `intl-party nextjs --init`.
describe("loadConfig with a messages directory", () => {
  let tmpDir: string;
  let previousCwd: string;

  beforeEach(() => {
    previousCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "intl-party-config-"));
    process.chdir(tmpDir);
    for (const locale of ["en", "es"]) {
      fs.mkdirSync(path.join("messages", locale), { recursive: true });
      fs.writeFileSync(path.join("messages", locale, "common.json"), "{}");
    }
    fs.writeFileSync(path.join("messages", "en", "auth.json"), "{}");
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("derives namespaces and translation paths from the messages dir", async () => {
    fs.writeFileSync(
      "intl-party.config.json",
      JSON.stringify({
        locales: ["en", "es"],
        defaultLocale: "en",
        messages: "./messages",
      }),
    );

    const config = await loadConfig();

    expect(config.namespaces).toEqual(["auth", "common"]);
    expect(config.translationPaths.es.common).toBe(
      path.join("messages", "es", "common.json"),
    );
    expect(config.translationPaths.en.auth).toBe(
      path.join("messages", "en", "auth.json"),
    );
  });

  it("loads the TypeScript config written by nextjs --init", async () => {
    fs.writeFileSync(
      "intl-party.config.ts",
      `export default { locales: ["en", "es"], defaultLocale: "en", messages: "./messages" };`,
    );

    const config = await loadConfig();

    expect(config.locales).toEqual(["en", "es"]);
    expect(Object.keys(config.translationPaths)).toEqual(["en", "es"]);
  });

  it("keeps explicit translationPaths untouched", async () => {
    fs.writeFileSync(
      "intl-party.config.json",
      JSON.stringify({
        locales: ["en"],
        defaultLocale: "en",
        namespaces: ["custom"],
        messages: "./messages",
        translationPaths: { en: { custom: "elsewhere/en.json" } },
      }),
    );

    const config = await loadConfig();

    expect(config.namespaces).toEqual(["custom"]);
    expect(config.translationPaths.en.custom).toBe("elsewhere/en.json");
  });
});
