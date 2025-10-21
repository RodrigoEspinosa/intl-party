"use client";

import { useTranslations } from "@intl-party/react";
import { useLocale } from "@intl-party/nextjs/client";

import AsciiArt from "../components/ascii";

export default function HomePage() {
  const t = useTranslations("common");
  const [currentLocale, setLocale] = useLocale();

  return (
    <div className="container">
      {/* Header with ASCII Art */}
      <div className="header">
        <AsciiArt />
        <p className="subtitle">{t("subtitle")}</p>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome">{t("welcome")}</h1>
        <p className="description">{t("description")}</p>
      </div>

      {/* Language Switcher */}
      <div className="demo-section">
        <div className="language-selector">
          <div className="selector-header">
            <div className="current-language-display">
              <div className="current-language-label">
                {t("switchLanguage")}: {currentLocale.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="language-buttons">
            <button
              className={`language-btn ${currentLocale === "en" ? "active" : ""}`}
              onClick={() => setLocale("en")}
            >
              🇺🇸 English
            </button>
            <button
              className={`language-btn ${currentLocale === "es" ? "active" : ""}`}
              onClick={() => setLocale("es")}
            >
              🇪🇸 Español
            </button>
            <button
              className={`language-btn ${currentLocale === "fr" ? "active" : ""}`}
              onClick={() => setLocale("fr")}
            >
              🇫🇷 Français
            </button>
            <button
              className={`language-btn ${currentLocale === "de" ? "active" : ""}`}
              onClick={() => setLocale("de")}
            >
              🇩🇪 Deutsch
            </button>
          </div>
        </div>
      </div>

      {/* Interpolation Demo */}
      <div className="demo-section">
        <div className="language-selector">
          <div className="selector-header">
            <div className="current-language-display">
              <div className="current-language-label">
                {t("interpolation.title")}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "20px",
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#888888",
            }}
          >
            {t("interpolation.example", {
              interpolation: { name: "John", count: 5 },
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 className="features-title">{t("features.title")}</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">{t("features.zeroConfig")}</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span className="feature-text">{t("features.typeSafe")}</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔗</span>
            <span className="feature-text">{t("features.cleanUrls")}</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🚀</span>
            <span className="feature-text">{t("features.ssr")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
