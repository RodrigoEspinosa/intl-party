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

  // TODO: Implement dropdown variant
  return null;
}

// Flag-based locale selector
export interface FlagLocaleSelectorProps
  extends Omit<LocaleSelectorProps, "showNativeNames"> {
  flagMap?: Record<Locale, string>;
  showFlags?: boolean;
  showLabels?: boolean;
}

export function FlagLocaleSelector({
  flagMap = {},
  showFlags = true,
  showLabels = true,
  variant = "buttons",
  ...props
}: FlagLocaleSelectorProps) {
  const [currentLocale, setLocale] = useLocale();
  const { available } = useLocaleInfo();

  const defaultFlagMap: Record<string, string> = {
    en: "🇺🇸",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    ru: "🇷🇺",
    ja: "🇯🇵",
    ko: "🇰🇷",
    zh: "🇨🇳",
  };

  const combinedFlagMap = { ...defaultFlagMap, ...flagMap };

  const formatLocaleWithFlag = (locale: Locale): string => {
    const parts: string[] = [];

    if (showFlags && combinedFlagMap[locale]) {
      parts.push(combinedFlagMap[locale]);
    }

    if (showLabels) {
      if (props.formatLocale) {
        parts.push(props.formatLocale(locale));
      } else {
        try {
          const displayNames = new Intl.DisplayNames([locale], {
            type: "language",
          });
          const intlLocale = new Intl.Locale(locale);
          parts.push(displayNames.of(intlLocale.language) || locale);
        } catch {
          parts.push(locale);
        }
      }
    }

    return parts.join(" ");
  };

  return (
    <LocaleSelector
      {...props}
      variant={variant}
      formatLocale={formatLocaleWithFlag}
      showNativeNames={false}
    />
  );
}

// Compact locale selector for mobile
export interface CompactLocaleSelectorProps extends LocaleSelectorProps {
  maxVisibleLocales?: number;
}

export function CompactLocaleSelector({
  maxVisibleLocales = 3,
  ...props
}: CompactLocaleSelectorProps) {
  const { available } = useLocaleInfo();

  if (available.length <= maxVisibleLocales) {
    return <LocaleSelector {...props} variant="buttons" />;
  }

  return <LocaleSelector {...props} variant="select" />;
}

// Accessible locale selector with ARIA support
export interface AccessibleLocaleSelectorProps extends LocaleSelectorProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export function AccessibleLocaleSelector({
  ariaLabel = "Select language",
  ariaDescribedBy,
  ...props
}: AccessibleLocaleSelectorProps) {
  const [currentLocale] = useLocale();

  const enhancedProps = {
    ...props,
    style: {
      ...props.style,
      // Ensure minimum touch target size for accessibility
      minHeight: "44px",
      minWidth: "44px",
    },
  };

  if (props.variant === "select") {
    return (
      <LocaleSelector
        {...enhancedProps}
        className={`${props.className || ""} accessible-locale-selector`}
      />
    );
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={props.className}
      style={props.style}
    >
      <LocaleSelector {...enhancedProps} />
      <span className="sr-only">Current language: {currentLocale}</span>
    </div>
  );
}
