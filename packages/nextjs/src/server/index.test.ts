import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLocale } from "./index";
import { headers, cookies } from "next/headers";

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

describe("Server Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLocale", () => {
    it("should return a locale from config", async () => {
      vi.mocked(cookies).mockImplementation(() => ({
        get: vi.fn().mockReturnValue({ value: "fr" }),
      }));

      const config = {
        cookieName: "INTL_LOCALE",
        locales: ["en", "fr", "es"],
        defaultLocale: "en",
      };

      const locale = await getLocale(config);

      // Should return a valid locale from the config
      expect(config.locales).toContain(locale);
    });

    it("should fallback to default locale if no locale detected", async () => {
      vi.mocked(cookies).mockImplementation(() => ({
        get: vi.fn().mockReturnValue(undefined),
      }));

      vi.mocked(headers).mockImplementation(
        () => new Map([["accept-language", "de-DE"]]),
      );

      const config = {
        cookieName: "INTL_LOCALE",
        locales: ["en", "fr", "es"],
        defaultLocale: "en",
      };

      const locale = await getLocale(config);

      // Should fallback to default when unsupported locale
      expect(locale).toBe("en");
    });
  });

});
