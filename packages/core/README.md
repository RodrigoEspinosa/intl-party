# @intl-party/core

The core internationalization library for IntlParty - a comprehensive, type-safe i18n solution for modern web applications.

## Features

- 🌐 **Multi-locale support** - Support for any number of locales with fallback chains
- 📦 **Namespace organization** - Organize translations into logical namespaces
- 🔄 **Dynamic loading** - Load translations on-demand or preload for performance
- 🎯 **Type safety** - Full TypeScript support with typed translation keys
- 🔍 **Auto-detection** - Automatic locale detection from various sources
- 📊 **Validation** - Built-in validation for translation completeness
- ⚡ **Performance** - Efficient caching and optimized lookup
- 🎨 **Formatting** - Built-in date, number, currency, and relative time formatting

## Installation

```bash
npm install @intl-party/core
# or
pnpm add @intl-party/core
# or
yarn add @intl-party/core
```

## Quick Start

```typescript
import { createI18n } from "@intl-party/core";

// Create i18n instance
const i18n = createI18n({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common", "navigation"],
  fallbackChain: {
    es: "en",
    fr: "en",
  },
});

// Add translations
i18n.addTranslations("en", "common", {
  welcome: "Welcome!",
  user: {
    profile: "Profile",
    settings: "Settings",
  },
});

i18n.addTranslations("es", "common", {
  welcome: "¡Bienvenido!",
  user: {
    profile: "Perfil",
    settings: "Configuración",
  },
});

// Use translations
console.log(i18n.t("welcome")); // "Welcome!"
i18n.setLocale("es");
console.log(i18n.t("welcome")); // "¡Bienvenido!"
console.log(i18n.t("user.profile")); // "Perfil"
```

## Configuration

```typescript
interface I18nConfig {
  locales: string[]; // Supported locales
  defaultLocale: string; // Default/fallback locale
  namespaces: string[]; // Available namespaces
  fallbackChain?: Record<string, string>; // Fallback locale mapping
  detection?: DetectionConfig; // Auto-detection settings
  validation?: ValidationConfig; // Validation options
}
```

## API Reference

### Core Methods

```typescript
// Locale management
i18n.setLocale(locale: string): void
i18n.getLocale(): string
i18n.detectLocale(context?: DetectionContext): string

// Namespace management
i18n.setNamespace(namespace: string): void
i18n.getNamespace(): string

// Translation functions
i18n.t(key: string, options?: TranslationOptions): string
i18n.hasTranslation(key: string, namespace?: string): boolean
i18n.getTranslation(key: string, namespace?: string): string | undefined

// Data management
i18n.addTranslations(locale: string, namespace: string, translations: object): void
i18n.removeTranslations(locale: string, namespace?: string): void

// Scoped translators
i18n.createScopedTranslator(namespace: string): TranslationFunction
```

### Translation Options

```typescript
interface TranslationOptions {
  namespace?: string;
  interpolation?: Record<string, any>;
  count?: number;
  fallback?: string;
  formatters?: Record<string, (value: any) => string>;
}
```

### Advanced Features

```typescript
// Preload translations
await i18n.preloadTranslations(["es", "fr"], ["common", "navigation"]);

// Event listeners
i18n.on("localeChange", ({ locale, previousLocale }) => {
  console.log(`Locale changed from ${previousLocale} to ${locale}`);
});

// Formatting utilities
i18n.formatDate(new Date(), { dateStyle: "full" });
i18n.formatNumber(1234.56, { style: "currency", currency: "USD" });
i18n.formatRelativeTime(-1, "day"); // "1 day ago"

// Validation
const validation = i18n.validateTranslations();
console.log(validation.missingKeys);

// Statistics
console.log(i18n.getStats());
```

## TypeScript Support

Create typed instances for better developer experience:

```typescript
interface MyTranslations {
  common: {
    welcome: string;
    user: {
      profile: string;
      settings: string;
    };
  };
}

const typedI18n = createTypedI18n<MyTranslations>(config);
// Now t() function has full autocomplete and type checking
```

## Interpolation and Pluralization

```typescript
// Interpolation
i18n.t("welcome.user", {
  interpolation: { name: "John" },
}); // "Welcome, John!"

// Pluralization
i18n.t("items.count", {
  count: 0,
  interpolation: { count: 0 },
}); // "No items"

i18n.t("items.count", {
  count: 1,
  interpolation: { count: 1 },
}); // "1 item"

i18n.t("items.count", {
  count: 5,
  interpolation: { count: 5 },
}); // "5 items"
```

Translation format for pluralization:

```json
{
  "items": {
    "count": "{{count|item|items|no items}}"
  }
}
```

## License

MIT © IntlParty
