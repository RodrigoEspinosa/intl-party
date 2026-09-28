// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { headers } from "next/headers";
import { createSetup } from "./setup";
import { Provider } from "./client-exports";
import * as mainEntry from "./index";
import * as clientEntry from "./client-exports";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

const config = { locales: ["en", "es"], defaultLocale: "en" };

describe("createSetup", () => {
  let messagesDir: string;

  beforeAll(() => {
    messagesDir = mkdtempSync(join(tmpdir(), "intl-party-setup-"));
    for (const [locale, welcome] of [
      ["en", "Welcome"],
      ["es", "Bienvenido"],
    ]) {
      mkdirSync(join(messagesDir, locale));
      writeFileSync(
        join(messagesDir, locale, "common.json"),
        JSON.stringify({ welcome }),
      );
      writeFileSync(
        join(messagesDir, locale, "home.json"),
        JSON.stringify({ title: `${welcome} home` }),
      );
    }
  });

  afterAll(() => {
    rmSync(messagesDir, { recursive: true, force: true });
  });

  it("returns middleware, matcher config, and the client Provider", () => {
    const setup = createSetup(config);

    expect(typeof setup.middleware).toBe("function");
    expect(setup.middlewareConfig.matcher.length).toBeGreaterThan(0);
    expect(setup.Provider).toBe(Provider);
  });

  it("loads messages keyed by locale, detecting every namespace", async () => {
    const { getMessages } = createSetup({
      ...config,
      messages: relative(process.cwd(), messagesDir),
    });

    await expect(getMessages("es")).resolves.toEqual({
      es: {
        common: { welcome: "Bienvenido" },
        home: { title: "Bienvenido home" },
      },
    });
  });

  it("only loads the configured namespaces when given", async () => {
    const { getMessages } = createSetup({
      ...config,
      messages: relative(process.cwd(), messagesDir),
      namespaces: ["home"],
    });

    await expect(getMessages("en")).resolves.toEqual({
      en: { home: { title: "Welcome home" } },
    });
  });

  it("reads the locale from the configured cookie", async () => {
    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ cookie: "LANG=es" }) as never,
    );

    const { getLocale } = createSetup({ ...config, cookieName: "LANG" });

    await expect(getLocale()).resolves.toBe("es");
  });

  it("falls back to Accept-Language, then the default locale", async () => {
    const { getLocale } = createSetup(config);

    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ "accept-language": "es-MX,es;q=0.9" }) as never,
    );
    await expect(getLocale()).resolves.toBe("es");

    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ "accept-language": "de" }) as never,
    );
    await expect(getLocale()).resolves.toBe("en");
  });
});

describe("documented exports", () => {
  it("exposes createSetup and useTranslations from the main entry", () => {
    expect(typeof mainEntry.createSetup).toBe("function");
    expect(mainEntry.useTranslations).toBe(clientEntry.useZeroTranslations);
  });

  it("exposes useTranslations from the client entry", () => {
    expect(clientEntry.useTranslations).toBe(clientEntry.useZeroTranslations);
  });
});
