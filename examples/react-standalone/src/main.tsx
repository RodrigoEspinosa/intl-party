import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nProvider } from "@intl-party/react";
import { createI18n } from "@intl-party/core";
import "./messages";

const i18n = createI18n({
  locales: ["en", "fr", "es", "de"],
  defaultLocale: "en",
  namespaces: ["common", "home", "about"],
});

// Add translations
import { translations } from "./messages";
Object.entries(translations).forEach(([locale, namespaces]) => {
  Object.entries(namespaces).forEach(([namespace, messages]) => {
    i18n.addTranslations(locale, namespace, messages);
  });
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider i18n={i18n}>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
