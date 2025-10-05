"use client";

// Import next-intl compatible APIs directly from intl-party packages!
import { useTranslations, useLocale } from "@intl-party/react";
import { useState } from "react";

// setLocale would be imported from '@intl-party/nextjs/server' in server actions
async function setLocale(locale: string) {
  // This would call the actual server action
  console.log(`Switching to locale: ${locale}`);
}

export default function CompatDemoPage() {
  const [currentLocale, setCurrentLocale] = useState("en");
  const t = useTranslations();
  const tNav = useTranslations("navigation");
  const locale = useLocale();

  const handleLocaleChange = async (newLocale: string) => {
    await setLocale(newLocale);
    setCurrentLocale(newLocale);
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>{t("welcome.title")}</h1>
      <p>{t("welcome.description")}</p>

      <nav
        style={{ margin: "2rem 0", padding: "1rem", border: "1px solid #ccc" }}
      >
        <h3>Navigation (namespace: "navigation")</h3>
        <ul>
          <li>
            <a href="#">{tNav("home")}</a>
          </li>
          <li>
            <a href="#">{tNav("about")}</a>
          </li>
        </ul>
      </nav>

      <section style={{ marginTop: "2rem" }}>
        <h3>{t("locale.switch")}</h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => handleLocaleChange("en")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: currentLocale === "en" ? "#007acc" : "#f0f0f0",
              color: currentLocale === "en" ? "white" : "black",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            English
          </button>
          <button
            onClick={() => handleLocaleChange("es")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: currentLocale === "es" ? "#007acc" : "#f0f0f0",
              color: currentLocale === "es" ? "white" : "black",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Español
          </button>
          <button
            onClick={() => handleLocaleChange("fr")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: currentLocale === "fr" ? "#007acc" : "#f0f0f0",
              color: currentLocale === "fr" ? "white" : "black",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Français
          </button>
        </div>
      </section>

      <section
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h3>Key Features Demonstrated:</h3>
        <ul>
          <li>
            ✅ <strong>NextIntlClientProvider</strong> - Drop-in replacement for
            next-intl provider
          </li>
          <li>
            ✅ <strong>useTranslations(namespace?)</strong> - Compatible
            translation hook
          </li>
          <li>
            ✅ <strong>useLocale()</strong> - Get current locale
          </li>
          <li>
            ✅ <strong>setLocale()</strong> - Change locale without URL changes
          </li>
          <li>
            ✅ <strong>Cookie-based storage</strong> - Persists across sessions
          </li>
          <li>
            ✅ <strong>Multi-locale preloading</strong> - Instant switching
          </li>
          <li>
            ✅ <strong>Flat message format</strong> - Compatible with next-intl
            structure
          </li>
        </ul>
      </section>

      <section
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#e8f4f8",
        }}
      >
        <h3>Migration Steps:</h3>
        <ol>
          <li>
            Install: <code>npm install @intl-party/compat-next-intl</code>
          </li>
          <li>
            Replace imports:
            <pre
              style={{
                backgroundColor: "#f0f0f0",
                padding: "0.5rem",
                fontSize: "0.9em",
              }}
            >
              {`// Before
import { useTranslations } from 'next-intl';

// After  
import { useTranslations } from '@intl-party/compat-next-intl';`}
            </pre>
          </li>
          <li>Update provider and add multi-locale support</li>
          <li>Test - your existing components should work unchanged!</li>
        </ol>
      </section>

      <footer style={{ marginTop: "2rem", fontSize: "0.9em", color: "#666" }}>
        <p>
          <strong>Current locale:</strong> {locale} (stored in cookies)
          <br />
          <strong>URL:</strong> /compat-demo (clean, no locale prefix)
          <br />
          <strong>Storage:</strong> Cookie-based persistence
        </p>
      </footer>
    </main>
  );
}
