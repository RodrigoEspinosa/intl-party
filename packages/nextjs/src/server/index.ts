// Server-only exports (uses next/headers, next/navigation)
export {
  getLocale,
  getLocaleFromParams,
  type NextI18nConfig,
} from "../server-only";

// Server-side compatibility helpers
export async function setLocale(locale: string): Promise<void> {
  try {
    const { cookies } = await import("next/headers");

    cookies().set("INTL_LOCALE", locale, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // Fallback for environments where next/headers is not available
    if (typeof document !== "undefined") {
      document.cookie = `INTL_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    }
  }
}

export interface RequestConfig {
  locale: string;
  messages: Record<string, any>;
}

export function setRequestLocale(_locale: string): void {
  // This is a no-op in our implementation since we handle locale via middleware/cookies
}

export async function getRequestConfig({
  locale,
}: {
  locale: string;
}): Promise<RequestConfig> {
  return {
    locale,
    messages: {},
  };
}

export async function getMessages(
  _locale: string,
): Promise<Record<string, any>> {
  // This would load from your i18n/messages directory
  return {};
}

export function defineRouting<T>(config: T): T {
  return config;
}

// Server-side translation utilities
export {
  createServerTranslations,
  getServerTranslations,
  type ServerTranslationConfig,
} from "./translations";

// Simplified server-side useTranslations equivalent
export function useServerTranslations(
  locale: string,
  namespace?: string,
  messages?: Record<string, any>,
): (key: string, options?: any) => string {
  // Import here to avoid circular dependency
  const { getServerTranslations } = require("./translations");
  return getServerTranslations(locale, namespace, undefined, messages);
}
