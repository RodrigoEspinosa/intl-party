"use client";

import { AppI18nProvider } from "@intl-party/nextjs/client";

// Import all translation files
import enCommon from "../../messages/en/common.json";
import esCommon from "../../messages/es/common.json";
import frCommon from "../../messages/fr/common.json";
import deCommon from "../../messages/de/common.json";

const i18nConfig = {
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  namespaces: ["common"],
  cookieName: "INTL_LOCALE",
};

// Preload all messages for instant switching
const initialData = {
  en: { common: enCommon },
  es: { common: esCommon },
  fr: { common: frCommon },
  de: { common: deCommon },
};

export function ClientProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <AppI18nProvider
      locale={locale}
      config={i18nConfig}
      initialData={initialData}
      enableClientSideRouting={true}
    >
      {children}
    </AppI18nProvider>
  );
}
