"use client";

import { NextIntlClientProvider } from "@intl-party/nextjs/client";

// Example messages (in real app, load from files)
const messages = {
  en: {
    "navigation.home": "Home",
    "navigation.about": "About",
    "welcome.title": "Welcome to IntlParty!",
    "welcome.description":
      "This demonstrates next-intl compatibility with cookie-based locale storage.",
    "locale.switch": "Switch Language",
  },
  es: {
    "navigation.home": "Inicio",
    "navigation.about": "Acerca de",
    "welcome.title": "¡Bienvenido a IntlParty!",
    "welcome.description":
      "Esto demuestra la compatibilidad con next-intl usando almacenamiento de idioma basado en cookies.",
    "locale.switch": "Cambiar Idioma",
  },
  fr: {
    "navigation.home": "Accueil",
    "navigation.about": "À propos",
    "welcome.title": "Bienvenue à IntlParty!",
    "welcome.description":
      "Ceci démontre la compatibilité next-intl avec le stockage de locale basé sur les cookies.",
    "locale.switch": "Changer de Langue",
  },
};

export function CompatClientWrapper({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale as keyof typeof messages]}
      initialData={messages} // Preload all locales for instant switching
      enableClientSideRouting={true}
    >
      {children}
    </NextIntlClientProvider>
  );
}
