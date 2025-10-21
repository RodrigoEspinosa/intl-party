// Next.js i18n integration
// Everything auto-detected from your messages directory

// Main setup (the only way to use this package)
export { createZeroConfigSetup, type ZeroConfigResult } from "./config";

// Main provider (auto-loads messages)
export { Provider, useZeroTranslations } from "./provider";

// Main middleware (auto-detects everything)
export { middleware, config } from "./middleware";

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
