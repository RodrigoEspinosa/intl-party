// Next.js i18n integration
// Everything auto-detected from your messages directory
//
// NOTE: This is the server-safe entry. Client components (Provider,
// useZeroTranslations, AppI18nProvider, ...) are exported from
// "@intl-party/nextjs/client" so the "use client" boundary is preserved and
// React is not pulled into server bundles.

// Main setup (the only way to use this package)
export { createZeroConfigSetup, type ZeroConfigResult } from "./config";

// Configurable middleware factory (the documented way to set up middleware)
export {
  createI18nMiddleware,
  createLocaleMatcher,
  createNextI18nConfig,
  type I18nMiddlewareConfig,
} from "./middleware/index";

// Prebuilt demo middleware/config singletons (convenience for simple setups;
// prefer createI18nMiddleware to configure locales explicitly)
export { middleware, config } from "./default-middleware";

// Auto-configuration utilities
export {
  detectConfig,
  detectLocales,
  detectNamespaces,
  type AutoDetectedConfig,
} from "./auto-config";

// Message loading utilities
export {
  loadMessages,
  loadMessagesForLocale,
  loadAllMessages,
  type MessageLoadOptions,
} from "./messages";

// Re-export core types for convenience
export type {
  Locale,
  Namespace,
  TranslationKey,
  TranslationValue,
  I18nConfig as CoreI18nConfig,
} from "@intl-party/core";

// Note: Server-specific functions like getLocale, getServerTranslations, etc.
// are available from "@intl-party/nextjs/server" to maintain proper
// server/client separation and avoid bundling next/headers in client code.
