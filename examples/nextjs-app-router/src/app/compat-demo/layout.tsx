import { NextIntlClientProvider } from "@intl-party/nextjs";
import { getLocale } from "@intl-party/nextjs/server";

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

const config = {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["_flat"],
};

export default async function CompatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current locale from cookies/headers
  const locale = await getLocale(config);

  return (
    <div>
      <h2>Next-intl Compatibility Demo</h2>
      <p>
        Current locale: <strong>{locale}</strong> (from cookies)
      </p>

      <NextIntlClientProvider
        locale={locale}
        messages={messages[locale as keyof typeof messages]}
        initialData={messages} // Preload all locales for instant switching
        enableClientSideRouting={true}
      >
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
