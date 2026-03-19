import React, { useMemo, ChangeEvent } from "react";
import { useLocale, useLocaleInfo } from "../hooks/useLocale";
import type { Locale } from "@intl-party/core";

export interface LocaleSelectorProps {
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  disabled?: boolean;
  showNativeNames?: boolean;
  filterLocales?: (locale: Locale) => boolean;
  formatLocale?: (locale: Locale) => string;
  onLocaleChange?: (locale: Locale) => void;
  variant?: "select" | "buttons" | "dropdown";
}

// Basic locale selector component
export function LocaleSelector({
  className,
  style,
  placeholder = "Select language",
  disabled = false,
  showNativeNames = true,
  filterLocales,
  formatLocale,
  onLocaleChange,
  variant = "select",
}: LocaleSelectorProps) {
  const [currentLocale, setLocale] = useLocale();
  const { available } = useLocaleInfo();

  const filteredLocales = useMemo(() => {
    return filterLocales ? available.filter(filterLocales) : available;
  }, [available, filterLocales]);

  const handleLocaleChange = (locale: Locale) => {
    setLocale(locale);
    onLocaleChange?.(locale);
  };

  const formatLocaleDisplay = (locale: Locale): string => {
    if (formatLocale) {
      return formatLocale(locale);
    }

    if (showNativeNames) {
      try {
        const intlLocale = new Intl.Locale(locale);
        const displayNames = new Intl.DisplayNames([locale], {
          type: "language",
        });
        return displayNames.of(intlLocale.language) || locale;
      } catch {
        return locale;
      }
    }

    return locale;
  };

  if (variant === "select") {
    return (
      <select
        className={className}
        style={style}
        value={currentLocale}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          handleLocaleChange(e.target.value)
        }
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {filteredLocales.map((locale) => (
          <option key={locale} value={locale}>
            {formatLocaleDisplay(locale)}
          </option>
        ))}
      </select>
    );
  }

  if (variant === "buttons") {
    return (
      <div className={className} style={style}>
        {filteredLocales.map((locale) => (
          <button
            key={locale}
            type="button"
            disabled={disabled}
            onClick={() => handleLocaleChange(locale)}
            style={{
              fontWeight: currentLocale === locale ? "bold" : "normal",
              opacity: currentLocale === locale ? 1 : 0.7,
            }}
          >
            {formatLocaleDisplay(locale)}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={className} style={style}>
        <select
          value={currentLocale}
          onChange={(e) => handleLocaleChange(e.target.value as Locale)}
          disabled={disabled}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            fontSize: "14px",
            minWidth: "120px",
          }}
        >
          {filteredLocales.map((locale) => (
            <option key={locale} value={locale}>
              {formatLocaleDisplay(locale)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}

