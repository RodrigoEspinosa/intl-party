// IntlParty configuration for Next.js
import type { SetupConfig } from "@intl-party/nextjs";

export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  messages: "./messages",
  // localePrefix defaults to "never" for clean URLs
  // cookieName defaults to "INTL_LOCALE"
} satisfies SetupConfig;