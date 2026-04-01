import { match } from "@formatjs/intl-localematcher";
import type {
  Locale,
  LocaleDetectionConfig,
  DetectionStrategy,
  GeographicConfig,
  ErrorHandler,
} from "../types";

export class LocaleDetector {
  private config: LocaleDetectionConfig;
  private supportedLocales: Locale[];
  private defaultLocale: Locale;
  private onError: ErrorHandler;

  constructor(
    supportedLocales: Locale[],
    defaultLocale: Locale,
    config: LocaleDetectionConfig,
    onError?: ErrorHandler,
  ) {
    this.supportedLocales = supportedLocales;
    this.defaultLocale = defaultLocale;
    this.config = config;
    this.onError = onError ?? (() => {});
  }

  detect(context?: DetectionContext): Locale {
    for (const strategy of this.config.strategies) {
      const detected = this.detectByStrategy(strategy, context);
      if (detected && this.isSupported(detected)) {
        return detected;
      }
    }
    return this.defaultLocale;
  }

  private detectByStrategy(
    strategy: DetectionStrategy,
    context?: DetectionContext,
  ): Locale | null {
    switch (strategy) {
      case "localStorage":
        return this.detectFromLocalStorage();
      case "sessionStorage":
        return this.detectFromSessionStorage();
      case "cookie":
        return this.detectFromCookie(context?.request);
      case "acceptLanguage":
        return this.detectFromAcceptLanguage(context?.request);
      case "geographic":
        return this.detectFromGeographic(context?.geographic);
      case "queryParam":
        return this.detectFromQueryParam(context?.url);
      case "path":
        return this.detectFromPath(context?.url);
      case "subdomain":
        return this.detectFromSubdomain(context?.url);
      default:
        return null;
    }
  }

  private detectFromLocalStorage(): Locale | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.config.storageKey || "locale");
      return stored;
    } catch (error) {
      this.onError({
        code: "DETECTION_FAILED",
        message: "Failed to read locale from localStorage",
        source: "LocaleDetector.detectFromLocalStorage",
        cause: error,
      });
      return null;
    }
  }

  private detectFromSessionStorage(): Locale | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = sessionStorage.getItem(this.config.storageKey || "locale");
      return stored;
    } catch (error) {
      this.onError({
        code: "DETECTION_FAILED",
        message: "Failed to read locale from sessionStorage",
        source: "LocaleDetector.detectFromSessionStorage",
        cause: error,
      });
      return null;
    }
  }

  private detectFromCookie(request?: Request): Locale | null {
    if (typeof window !== "undefined" && document.cookie) {
      const cookieName = this.config.cookieName || "locale";
      const match = document.cookie.match(new RegExp(`${cookieName}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : null;
    }

    if (request?.headers) {
      const cookies = request.headers.get("cookie");
      if (cookies) {
        const cookieName = this.config.cookieName || "locale";
        const match = cookies.match(new RegExp(`${cookieName}=([^;]+)`));
        return match ? decodeURIComponent(match[1]) : null;
      }
    }

    return null;
  }

  private detectFromAcceptLanguage(request?: Request): Locale | null {
    let acceptLanguage: string | null = null;

    if (typeof window !== "undefined" && navigator.language) {
      acceptLanguage = navigator.languages?.join(",") || navigator.language;
    } else if (request?.headers) {
      acceptLanguage = request.headers.get("accept-language");
    }

    if (!acceptLanguage) return null;

    try {
      const parsed = this.parseAcceptLanguage(acceptLanguage);
      const matched = match(parsed, this.supportedLocales, this.defaultLocale);
      return matched;
    } catch {
      return null;
    }
  }

  private detectFromGeographic(geographic?: GeographicInfo): Locale | null {
    if (!geographic?.country || !this.config.geographic) return null;

    const countryToLocale = this.config.geographic.countryToLocale;
    return (
      countryToLocale[geographic.country.toUpperCase()] ||
      this.config.geographic.fallback ||
      null
    );
  }

  private detectFromQueryParam(url?: string | URL): Locale | null {
    if (!url) return null;

    try {
      const urlObj =
        typeof url === "string" ? new URL(url, "http://localhost") : url;
      const paramName = this.config.queryParamName || "locale";
      return urlObj.searchParams.get(paramName);
    } catch {
      return null;
    }
  }

  private detectFromPath(url?: string | URL): Locale | null {
    if (!url) return null;

    try {
      const urlObj =
        typeof url === "string" ? new URL(url, "http://localhost") : url;
      const segments = urlObj.pathname.split("/").filter(Boolean);
      const segmentIndex = this.config.pathSegment || 0;

      const locale = segments[segmentIndex];
      return locale && this.isSupported(locale) ? locale : null;
    } catch {
      return null;
    }
  }

  private detectFromSubdomain(url?: string | URL): Locale | null {
    if (!url) return null;

    try {
      const urlObj = typeof url === "string" ? new URL(url) : url;
      const subdomain = urlObj.hostname.split(".")[0];
      return subdomain && this.isSupported(subdomain) ? subdomain : null;
    } catch (error) {
      this.onError({
        code: "DETECTION_FAILED",
        message: "Failed to match accept-language header",
        source: "LocaleDetector.detectFromAcceptLanguage",
        cause: error,
      });
      return null;
    }
  }

  private parseAcceptLanguage(acceptLanguage: string): string[] {
    return acceptLanguage
      .split(",")
      .map((lang) => {
        const [locale, q] = lang.trim().split(";q=");
        return {
          locale: locale.trim(),
          quality: q ? parseFloat(q) : 1.0,
        };
      })
      .sort((a, b) => b.quality - a.quality)
      .map((item) => item.locale);
  }

  private isSupported(locale: Locale): boolean {
    return this.supportedLocales.includes(locale);
  }

  setLocale(locale: Locale, persist: boolean = true): void {
    if (!this.isSupported(locale)) {
      throw new Error(`Locale "${locale}" is not supported`);
    }

    if (!persist) return;

    if (typeof window !== "undefined") {
      if (this.config.strategies.includes("localStorage")) {
        try {
          localStorage.setItem(this.config.storageKey || "locale", locale);
        } catch (error) {
          this.onError({
            code: "STORAGE_ERROR",
            message: "Failed to persist locale to localStorage",
            source: "LocaleDetector.setLocale",
            cause: error,
          });
        }
      }

      if (this.config.strategies.includes("cookie")) {
        const cookieName = this.config.cookieName || "locale";
        document.cookie = `${cookieName}=${locale}; path=/; max-age=31536000`; // 1 year
      }
    }
  }
}

export interface DetectionContext {
  request?: Request;
  url?: string | URL;
  geographic?: GeographicInfo;
  userAgent?: string;
}

export interface GeographicInfo {
  country: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export function createLocaleDetector(
  supportedLocales: Locale[],
  defaultLocale: Locale,
  config: LocaleDetectionConfig,
): LocaleDetector {
  return new LocaleDetector(supportedLocales, defaultLocale, config);
}
