import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocaleDetector, createLocaleDetector } from "./index";
import type { LocaleDetectionConfig } from "../types";

describe("LocaleDetector", () => {
  let detector: LocaleDetector;
  let config: LocaleDetectionConfig;

  beforeEach(() => {
    config = {
      strategies: ["localStorage", "acceptLanguage"],
      storageKey: "locale",
    };

    detector = createLocaleDetector(["en", "es", "fr"], "en", config);
  });

  describe("localStorage detection", () => {
    it("should detect locale from localStorage", () => {
      const mockGetItem = vi.fn().mockReturnValue("es");
      Object.defineProperty(window, "localStorage", {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const result = detector.detect();

      expect(mockGetItem).toHaveBeenCalledWith("locale");
      expect(result).toBe("es");
    });

    it("should fallback when localStorage is not available", () => {
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
      });

      const result = detector.detect();
      expect(result).toBe("en"); // fallback to default
    });

    it("should fallback when localStorage throws error", () => {
      const mockGetItem = vi.fn().mockImplementation(() => {
        throw new Error("Storage not available");
      });

      Object.defineProperty(window, "localStorage", {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const result = detector.detect();
      expect(result).toBe("en"); // fallback to default
    });
  });

  describe("Accept-Language detection", () => {
    it("should detect locale from Accept-Language header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "accept-language": "es-ES,es;q=0.9,en;q=0.8",
        },
      });

      const result = detector.detect({ request });
      expect(result).toBe("es");
    });

    it("should handle complex Accept-Language header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "accept-language": "fr-CA,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      const result = detector.detect({ request });
      expect(result).toBe("fr");
    });

    it("should fallback when no matching locale found", () => {
      const request = new Request("http://localhost", {
        headers: {
          "accept-language": "de-DE,de;q=0.9",
        },
      });

      const result = detector.detect({ request });
      expect(result).toBe("en"); // fallback to default
    });
  });

  describe("cookie detection", () => {
    it("should detect locale from cookie", () => {
      const cookieConfig = {
        ...config,
        strategies: ["cookie" as const],
        cookieName: "lang",
      };

      const cookieDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        cookieConfig,
      );

      const request = new Request("http://localhost", {
        headers: {
          cookie: "lang=es; other=value",
        },
      });

      const result = cookieDetector.detect({ request });
      expect(result).toBe("es");
    });

    it("should handle URL encoded cookie values", () => {
      const cookieConfig = {
        ...config,
        strategies: ["cookie" as const],
        cookieName: "locale",
      };

      const cookieDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        cookieConfig,
      );

      const request = new Request("http://localhost", {
        headers: {
          cookie: "locale=es%2DES; other=value",
        },
      });

      const result = cookieDetector.detect({ request });
      expect(result).toBe("en"); // es-ES is not in supported locales
    });
  });

  describe("geographic detection", () => {
    it("should detect locale from geographic info", () => {
      const geoConfig = {
        ...config,
        strategies: ["geographic" as const],
        geographic: {
          countryToLocale: {
            US: "en",
            ES: "es",
            FR: "fr",
          },
        },
      };

      const geoDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        geoConfig,
      );

      const result = geoDetector.detect({
        geographic: { country: "ES" },
      });

      expect(result).toBe("es");
    });

    it("should use fallback for unknown country", () => {
      const geoConfig = {
        ...config,
        strategies: ["geographic" as const],
        geographic: {
          countryToLocale: {
            US: "en",
            ES: "es",
          },
          fallback: "en",
        },
      };

      const geoDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        geoConfig,
      );

      const result = geoDetector.detect({
        geographic: { country: "DE" },
      });

      expect(result).toBe("en");
    });
  });

  describe("URL detection", () => {
    it("should detect locale from query parameter", () => {
      const queryConfig = {
        ...config,
        strategies: ["queryParam" as const],
        queryParamName: "lang",
      };

      const queryDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        queryConfig,
      );

      const result = queryDetector.detect({
        url: "http://localhost?lang=es&other=value",
      });

      expect(result).toBe("es");
    });

    it("should detect locale from path segment", () => {
      const pathConfig = {
        ...config,
        strategies: ["path" as const],
        pathSegment: 0,
      };

      const pathDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        pathConfig,
      );

      const result = pathDetector.detect({
        url: "http://localhost/es/dashboard",
      });

      expect(result).toBe("es");
    });

    it("should detect locale from subdomain", () => {
      const subdomainConfig = {
        ...config,
        strategies: ["subdomain" as const],
      };

      const subdomainDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        subdomainConfig,
      );

      const result = subdomainDetector.detect({
        url: "http://es.example.com/dashboard",
      });

      expect(result).toBe("es");
    });
  });

  describe("strategy priority", () => {
    it("should use strategies in order of priority", () => {
      const priorityConfig = {
        strategies: ["localStorage" as const, "acceptLanguage" as const],
        storageKey: "locale",
      };

      const priorityDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        priorityConfig,
      );

      // Mock localStorage to return Spanish
      const mockGetItem = vi.fn().mockReturnValue("es");
      Object.defineProperty(window, "localStorage", {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const request = new Request("http://localhost", {
        headers: {
          "accept-language": "fr-FR,fr;q=0.9",
        },
      });

      const result = priorityDetector.detect({ request });

      // Should use localStorage (es) over Accept-Language (fr)
      expect(result).toBe("es");
    });
  });

  describe("locale persistence", () => {
    it("should persist locale to localStorage", () => {
      const mockSetItem = vi.fn();
      Object.defineProperty(window, "localStorage", {
        value: { setItem: mockSetItem },
        writable: true,
      });

      detector.setLocale("es");

      expect(mockSetItem).toHaveBeenCalledWith("locale", "es");
    });

    it("should persist locale to cookie", () => {
      const cookieConfig = {
        ...config,
        strategies: ["cookie" as const],
        cookieName: "lang",
      };

      const cookieDetector = createLocaleDetector(
        ["en", "es", "fr"],
        "en",
        cookieConfig,
      );

      // Mock document.cookie
      let cookieValue = "";
      Object.defineProperty(document, "cookie", {
        get: () => cookieValue,
        set: (value) => {
          cookieValue = value;
        },
        configurable: true,
      });

      cookieDetector.setLocale("es");

      expect(cookieValue).toContain("lang=es");
    });

    it("should throw error for unsupported locale", () => {
      expect(() => detector.setLocale("de")).toThrow(
        'Locale "de" is not supported',
      );
    });
  });
});
