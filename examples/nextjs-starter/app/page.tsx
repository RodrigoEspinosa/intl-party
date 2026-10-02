"use client";

import { useTranslations, useLocale } from "@intl-party/nextjs";

export default function HomePage() {
  const t = useTranslations("common");
  const [locale, setLocale] = useLocale();

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
      
      <nav style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <a href="/">{t("navigation.home")}</a>
        <a href="/about">{t("navigation.about")}</a>
        <a href="/contact">{t("navigation.contact")}</a>
      </nav>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        {["en", "es", "fr"].map((code) => (
          <button key={code} onClick={() => setLocale(code)} disabled={code === locale}>
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}