import { getLocale, getServerTranslations } from "@intl-party/nextjs/server";

// Example messages (in real app, load from files)
const messages = {
  en: {
    "page.title": "Server-Side Rendered Page",
    "page.description":
      "This page is rendered on the server with translations.",
    "current.locale": "Current locale",
    "rendered.on": "Rendered on server at",
  },
  es: {
    "page.title": "Página Renderizada en el Servidor",
    "page.description":
      "Esta página se renderiza en el servidor con traducciones.",
    "current.locale": "Idioma actual",
    "rendered.on": "Renderizado en el servidor a las",
  },
  fr: {
    "page.title": "Page Rendue Côté Serveur",
    "page.description":
      "Cette page est rendue sur le serveur avec des traductions.",
    "current.locale": "Locale actuelle",
    "rendered.on": "Rendu sur le serveur à",
  },
};

const i18nConfig = {
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  namespaces: ["_flat"],
  cookieName: "INTL_LOCALE",
};

export default async function SSRDemoPage() {
  // Get current locale on server
  const locale = await getLocale(i18nConfig);

  // Get server-side translation function (similar to useTranslations)
  const t = await getServerTranslations(
    locale,
    "_flat", // namespace
    i18nConfig,
    messages[locale as keyof typeof messages],
  );

  // Server-side rendering timestamp
  const serverTime = new Date().toISOString();

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      {/* These translations happen on the server! */}
      <h1>{t("page.title")}</h1>
      <p>{t("page.description")}</p>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f0f8ff",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      >
        <h3>Server-Side Info:</h3>
        <p>
          <strong>{t("current.locale")}:</strong> {locale}
        </p>
        <p>
          <strong>{t("rendered.on")}:</strong> {serverTime}
        </p>
        <p>
          <strong>Translation source:</strong> Server-side function
        </p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>How it works:</h3>
        <ol>
          <li>
            <code>getLocale()</code> detects locale from cookies/headers on
            server
          </li>
          <li>
            <code>getServerTranslations()</code> creates translation function
            for server
          </li>
          <li>Translations are rendered on server (SSR/SSG compatible)</li>
          <li>No hydration mismatch - server and client have same content</li>
          <li>SEO-friendly with proper locale meta tags</li>
        </ol>
      </div>

      <div style={{ marginTop: "2rem", fontSize: "0.9em", color: "#666" }}>
        <h4>Usage:</h4>
        <pre
          style={{
            backgroundColor: "#f5f5f5",
            padding: "1rem",
            overflow: "auto",
          }}
        >
          {`// Server Component
import { getLocale, getServerTranslations } from '@intl-party/nextjs/server';

export default async function MyPage() {
  const locale = await getLocale(config);
  const t = await getServerTranslations(locale, 'common', config, messages);
  
  return <h1>{t('title')}</h1>; // Rendered on server!
}`}
        </pre>
      </div>
    </div>
  );
}
