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
    it("should get locale from cookie", async () => {
      vi.mocked(cookies).mockImplementation(() => ({
        get: vi.fn().mockReturnValue({ value: "fr" }),
      }));

      const config = {
        cookieName: "INTL_LOCALE",
        locales: ["en", "fr", "es"],
        defaultLocale: "en",
      };

      const locale = await getLocale(config);

      expect(locale).toBe("fr");
      expect(cookies().get).toHaveBeenCalledWith("INTL_LOCALE");
    });

    it("should get locale from headers if no cookie", async () => {
      vi.mocked(cookies).mockImplementation(() => ({
        get: vi.fn().mockReturnValue(undefined),
      }));

      vi.mocked(headers).mockImplementation(
        () =>
          new Map([["accept-language", "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"]]),
      );

      const config = {
        cookieName: "INTL_LOCALE",
        locales: ["en", "fr", "es"],
        defaultLocale: "en",
      };

      const locale = await getLocale(config);

      expect(locale).toBe("fr");
      expect(headers).toHaveBeenCalled();
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

      expect(locale).toBe("en");
    });
  });

  describe("getMessages", () => {
    it("should load messages for specified locale", async () => {
      const mockFs = await import("fs/promises");

      const locale = "fr";
      const messagesPath = "./messages";
      const namespaces = ["common", "navigation"];

      const messages = await getMessages(locale, {
        messagesPath,
        namespaces,
      });

      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("messages/fr/common.json"),
        "utf-8",
      );
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("messages/fr/navigation.json"),
        "utf-8",
      );

      expect(messages).toEqual({
        common: { key: "value" },
        navigation: { key: "value" },
      });
    });

    it("should handle missing message files gracefully", async () => {
      const mockFs = await import("fs/promises");
      vi.mocked(mockFs.readFile).mockRejectedValueOnce(
        new Error("File not found"),
      );

      const locale = "fr";
      const messagesPath = "./messages";
      const namespaces = ["common"];

      const messages = await getMessages(locale, {
        messagesPath,
        namespaces,
      });

      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("messages/fr/common.json"),
        "utf-8",
      );

      expect(messages).toEqual({
        common: {},
      });
    });
  });
});
