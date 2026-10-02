// Next.js i18n integration
// Everything auto-detected from your messages directory
//
// NOTE: This is the server-safe entry. Client components (Provider,
// useZeroTranslations, AppI18nProvider, ...) live in
// "@intl-party/nextjs/client"; the few re-exported here are imported through
// that entry so the "use client" boundary is preserved.

// One-call setup driven by intl-party.config.ts (see README)
export { createSetup, type SetupConfig, type SetupResult } from "./setup";
export { localizePath, type RoutingConfig } from "./routing";

// Translation hook for client components. Re-exported through the package's
// own "./client" entry (kept external by the build) so the "use client"
// boundary is preserved.
export { useTranslations, useLocale } from "@intl-party/nextjs/client";

// Zero-config setup: auto-detects locales and namespaces from ./messages
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
  IntlPartyRegister,
  RegisteredNamespace,
  NamespaceKey,
  AnyNamespaceKey,
} from "@intl-party/core";

// Note: Server-specific functions like getLocale, getServerTranslations, etc.
// are available from "@intl-party/nextjs/server" to maintain proper
// server/client separation and avoid bundling next/headers in client code.
