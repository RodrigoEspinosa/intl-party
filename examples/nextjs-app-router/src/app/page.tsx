"use client";

import { useTranslations, useLocale } from "@intl-party/react";

export const dynamic = "force-dynamic";

function LanguageSelector() {
  const [locale, setLocale] = useLocale();
  const t = useTranslations("common");

  const languages = [
    { code: "en", name: t("languages.en") },
    { code: "es", name: t("languages.es") },
    { code: "fr", name: t("languages.fr") },
    { code: "de", name: t("languages.de") },
  ];

  return (
    <div className="language-selector">
      <p className="language-label">{t("switchLanguage")}</p>
      <div className="language-buttons">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`language-btn ${locale === lang.code ? "active" : ""}`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations("common");
  const [locale] = useLocale();

  return (
    <main className="main-content">
      <div className="container">
        <header className="header">
          <h1 className="title">{t("title")}</h1>
          <p className="subtitle">{t("subtitle")}</p>
        </header>

        <section className="welcome-section">
          <h2 className="welcome">{t("welcome")}</h2>
          <p className="description">{t("description")}</p>

          <div className="current-locale">
            {t("currentLocale", { interpolation: { locale } })}
          </div>
        </section>

        <section className="demo-section">
          <LanguageSelector />
        </section>

        <section className="features-section">
          <h3 className="features-title">{t("features.title")}</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <span className="feature-text">{t("features.typeScript")}</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span className="feature-text">{t("features.performance")}</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">▲</span>
              <span className="feature-text">{t("features.nextjs")}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
