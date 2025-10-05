"use client";

import { AppI18nProvider } from "@intl-party/nextjs/client";

const i18nConfig = {
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  namespaces: ["common"],
  cookieName: "INTL_LOCALE",
};

export function ClientProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <AppI18nProvider locale={locale} config={i18nConfig}>
      {children}
    </AppI18nProvider>
  );
}
