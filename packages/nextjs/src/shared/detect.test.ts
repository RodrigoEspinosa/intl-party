import { describe, it, expect } from "vitest";
import {
  detectLocaleFromHeaders,
  matchAcceptLanguage,
  readCookieFromHeader,
} from "./detect";

function headers(map: Record<string, string>) {
  return {
    get: (name: string) => map[name.toLowerCase()] ?? null,
  };
}

describe("matchAcceptLanguage", () => {
  it("honors q-values rather than listed order", () => {
    const result = matchAcceptLanguage("de;q=0.5,fr;q=0.9", ["de", "fr"]);
    expect(result).toBe("fr");
  });

  it("matches region tags against base locales (en-US -> en)", () => {
    expect(matchAcceptLanguage("en-US,en;q=0.9", ["en", "fr"])).toBe("en");
  });

  it("returns null when nothing matches", () => {
    expect(matchAcceptLanguage("de-DE,de;q=0.9", ["en", "fr"])).toBeNull();
  });
});

describe("readCookieFromHeader", () => {
  it("does not match a cookie whose name merely ends with the target", () => {
    expect(readCookieFromHeader("mylocale=de; other=1", "locale")).toBeNull();
  });

  it("reads and decodes the exact cookie", () => {
    expect(readCookieFromHeader("INTL_LOCALE=fr; x=1", "INTL_LOCALE")).toBe(
      "fr",
    );
  });
});

describe("detectLocaleFromHeaders priority", () => {
  const config = { locales: ["en", "fr", "es"], defaultLocale: "en" };

  it("prefers the custom header over cookie and accept-language", () => {
    const result = detectLocaleFromHeaders(
      headers({
        "x-locale": "fr",
        cookie: "INTL_LOCALE=es",
        "accept-language": "es",
      }),
      config,
    );
    expect(result).toBe("fr");
  });

  it("falls back to cookie, then accept-language, then default", () => {
    expect(
      detectLocaleFromHeaders(headers({ cookie: "INTL_LOCALE=es" }), config),
    ).toBe("es");
    expect(
      detectLocaleFromHeaders(headers({ "accept-language": "fr" }), config),
    ).toBe("fr");
    expect(detectLocaleFromHeaders(headers({}), config)).toBe("en");
  });
});
