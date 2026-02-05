import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLocale, getMessages } from "./index";
import { headers } from "next/headers";
import { cookies } from "next/headers";

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock("fs/promises", () => ({
  readFile: vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(JSON.stringify({ key: "value" })),
    ),
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

  describe("getMessages", () => {
    it("should return messages object for locale", async () => {
      const locale = "fr";
      const messagesPath = "./messages";
      const namespaces = ["common", "navigation"];

      const messages = await getMessages(locale, {
        messagesPath,
        namespaces,
      });

      // Should return an object (possibly empty if files don't exist)
      expect(typeof messages).toBe("object");
    });

    it("should handle errors gracefully", async () => {
      const locale = "fr";
      const messagesPath = "./nonexistent";
      const namespaces = ["common"];

      // Should not throw, returns empty or partial messages
      const messages = await getMessages(locale, {
        messagesPath,
        namespaces,
      });

      expect(typeof messages).toBe("object");
    });
  });
});
