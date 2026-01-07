import React, { useState } from "react";
import { useTranslations, useLocale } from "@intl-party/react";
import LocaleSelector from "./components/LocaleSelector";
import Home from "./pages/Home";
import About from "./pages/About";

const App: React.FC = () => {
  const t = useTranslations("common");
  const [page, setPage] = useState<"home" | "about">("home");

  return (
    <div className="app">
      <header>
        <h1>{t("welcome")}</h1>
        <nav>
          <button
            onClick={() => setPage("home")}
            className={page === "home" ? "active" : ""}
          >
            {t("navigation.home")}
          </button>
          <button
            onClick={() => setPage("about")}
            className={page === "about" ? "active" : ""}
          >
            {t("navigation.about")}
          </button>
        </nav>
        <LocaleSelector />
      </header>

      <main>{page === "home" ? <Home /> : <About />}</main>

      <footer>
        <p>© 2025-2026 IntlParty Team</p>
      </footer>
    </div>
  );
};

export default App;
