// Server-only exports for @intl-party/nextjs
// These functions use next/headers and should only be imported in server components

// Server utilities
export {
  getLocale,
  getLocaleFromParams,
  setLocale,
  useServerTranslations,
  type NextI18nConfig,
} from "./server/index";

// Server-side translations
export {
  createServerTranslations,
  getServerTranslations,
  type ServerTranslationConfig,
} from "./server/translations";

// Message loading utilities (server-side)
export {
  loadMessages,
  loadMessagesForLocale,
  loadAllMessages,
  type MessageLoadOptions,
} from "./messages";

// Note: Client components and providers are available from the main export
// to maintain proper server/client separation.
