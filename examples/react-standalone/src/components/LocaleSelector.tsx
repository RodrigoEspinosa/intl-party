import React from "react";
import { useLocale, useTranslations } from "@intl-party/react";

const LocaleSelector: React.FC = () => {
  const [locale, setLocale] = useLocale();
  const t = useTranslations("common");

  const locales = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "es", name: "Español" },
    { code: "de", name: "Deutsch" },
  ];

  return (
    <div className="locale-selector">
      <span>{t("switchLocale")}: </span>
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        {locales.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocaleSelector;
